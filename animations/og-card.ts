/**
 * The share card: the OG video (public/og.mp4, a seamless loop) and the OG image (public/og.jpg, one
 * frame of it). The brand's layout with one slow loop in it, in the manner of the best og:video cards.
 *
 * Art direction
 *   mode      card: the wordmark and the promise on the left, one painted window on the right
 *   verb      send off: the closing band's riverside at sunset (CtaBand), painted in the middle and
 *             breaking into the page's halftone at its edges; an endless, unhurried stream of the
 *             brand's paper planes rises off the river and glides away into the sun, shrinking into
 *             the distance, each trailing a few dots: word of mouth, going further than you can see.
 *             The sun's light breathes
 *   geometry  the mark; the square dot grid; the band's squared-off oval
 *   palette   the painting's own on the page's paper ground and its navy grain; ink type
 *   scale     1200 x 630; the window takes the right 55 %, the words the left
 *   words     the wordmark, and the promise, set as the hero sets its title
 *   time      6 s, seamless (the planes are evenly phased round the loop)
 *
 *   pnpm tsx animations/og-card.ts   (writes animations/out/og/og.json, beside cta-day.jpg and plane.png)
 *   clayzo export animations/out/og/og.json <master>.mp4 --format mp4, then x264 it to public/og.mp4
 *   clayzo render-frame animations/out/og/og.json <frame>.png --tick 600 --full-resolution
 */
import { writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  keyed,
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';

const W = 1200;
const H = 630;
const LOOP = 6;
const END = t(LOOP);
const CELL = 9;

const hexC = (h: string, a = 1): Color => {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
};
const GROUND = hexC('#FAF9F6');
const INK = hexC('#101114');
const f = (x: number) => x.toFixed(3);
const rgb = (c: Color) => `half3(${f(c.r)}, ${f(c.g)}, ${f(c.b)})`;

// ------------------------------------------------------------------ the window
const WIN = { x: 868, y: 318, rx: 352, ry: 330 }; // the band shape's centre and reach
const PH = 600; // the painting's drawn height (2880 x 1280 source)
const PWD = (2880 * PH) / 1280;
const PTOP = WIN.y - PH / 2;
const SUN = { x: WIN.x, y: PTOP + 0.658 * PH + 2 };

// ------------------------------------------------------------------ the planes
// each rises off the river from its own spot and glides away into the sun, slowing and shrinking as
// it recedes; N of them, evenly phased round the loop
const N = 7;
const STARTS = [-120, 90, -40, 160, -180, 20, 130].map((dx, i) => ({ x: WIN.x + dx * 0.6, y: 560 + (i % 3) * 12 }));
// where each ends: fanned out across the upper sky, far away
const ENDS = [-250, 210, -90, 290, -310, 60, 150].map((dx, i) => ({ x: WIN.x + dx, y: 70 + (i % 4) * 34 }));
const SIZE = [92, 13] as const;
const along = (p: number) => 1 - Math.pow(1 - p, 1.8);
type V2 = { x: number; y: number };
function pathAt(k: number, p: number): V2 {
  const s = STARTS[k];
  const e = ENDS[k];
  const u = along(p);
  // off the water past the sun, then out and up into the sky
  const c = { x: SUN.x + (s.x - SUN.x) * 0.3, y: SUN.y - 30 };
  const v = 1 - u;
  return { x: v * v * s.x + 2 * v * u * c.x + u * u * e.x, y: v * v * s.y + 2 * v * u * c.y + u * u * e.y };
}
const sizeAt = (p: number) => SIZE[0] * Math.pow(SIZE[1] / SIZE[0], along(p));
const phaseOf = (k: number, s: number) => (((s / LOOP + k / N) % 1) + 1) % 1;
const alphaAt = (p: number) => Math.min(1, p / 0.08) * (1 - Math.max(0, (p - 0.82) / 0.18));

const SKSL = `
uniform shader inputImage;
uniform float time;
uniform float2 renderScale;

float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float vnoise(float x) {
  float i = floor(x);
  float g = fract(x);
  return mix(hash1(i), hash1(i + 1.0), g * g * (3.0 - 2.0 * g));
}
// the page's grain (--cos-noise): fractal noise at 0.85 per px, navy, alpha 0.55 n - 0.24
float noise2(float2 x) {
  float2 i = floor(x);
  float2 g = fract(x);
  float2 w = g * g * (3.0 - 2.0 * g);
  float a = fract(sin(dot(i, float2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + float2(1.0, 0.0), float2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + float2(0.0, 1.0), float2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + float2(1.0, 1.0), float2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
half3 paper(float2 u) {
  float2 x = u * 0.85;
  float n = 0.5 * noise2(x) + 0.25 * noise2(x * 2.0 + 17.0) + 0.125 * noise2(x * 4.0 + 31.0);
  // feTurbulence's fractal noise sits close to 0.5; ours spreads wider, so draw it in
  n = 0.5 + (n / 0.875 - 0.5) * 0.3;
  float a = clamp(0.55 * n - 0.24, 0.0, 1.0);
  return mix(${rgb(GROUND)}, half3(0.06, 0.17, 0.28), a);
}
float along(float p) { return 1.0 - pow(1.0 - p, 1.8); }
float2 pathAt(float2 s, float2 e, float p) {
  float u = along(p);
  float2 SUN = float2(${f(SUN.x)}, ${f(SUN.y)});
  float2 c = float2(SUN.x + (s.x - SUN.x) * 0.3, SUN.y - 30.0);
  float v = 1.0 - u;
  return v * v * s + 2.0 * v * u * c + u * u * e;
}

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float tt = time;
  float2 cc = (floor(u / ${f(CELL)}) + 0.5) * ${f(CELL)};
  float2 SUN = float2(${f(SUN.x)}, ${f(SUN.y)});

  // the closing band's shape: whole in the middle, breaking into dots toward its edge
  float2 e2 = (cc - float2(${f(WIN.x)}, ${f(WIN.y)})) / float2(${f(WIN.rx)}, ${f(WIN.ry)});
  float2 a2 = abs(e2);
  float e = pow(pow(a2.x, 4.0) + pow(a2.y, 3.2), 0.26) + 0.03 * sin(atan(e2.y, e2.x) * 5.0 + 6.2831853 * tt / ${f(LOOP)}) + 0.02 * (hash1(dot(cc, float2(0.13, 0.71))) - 0.5);
  float pres = 1.0 - smoothstep(0.62, 1.0, e);

  half3 col = unpremul(inputImage.eval(q)).rgb;
  // the sun's light, breathing, and its shafts turning slowly
  float2 dv = u - SUN;
  float dist = length(dv);
  float br = 0.92 + 0.08 * sin(6.2831853 * tt / ${f(LOOP / 2)});
  float halo = exp(-dist / 30.0) * 0.6 + exp(-dist / 170.0) * 0.3;
  float ang = atan(dv.y, dv.x);
  float ph = 6.2831853 * tt / ${f(LOOP)};
  float fan = vnoise(ang * 7.0 + sin(ph) * 0.8) * vnoise(ang * 15.0 - cos(ph) * 0.6 + 7.0);
  float rays = fan * exp(-dist / 330.0) * smoothstep(30.0, -60.0, dv.y) * 0.32;
  half3 light = half3(1.0, 0.86, 0.66) * (halo + rays) * br;
  col = 1.0 - (1.0 - col) * (1.0 - clamp(light, 0.0, 1.0));

  // the planes' trails: a few pale dots behind each, fading
  float trail = 0.0;
  ${STARTS.map(
    (st, k) => `{
    float p0 = fract(tt / ${f(LOOP)} + ${f(k / N)});
    for (int j = 1; j <= 7; j++) {
      float pj = p0 - float(j) * 0.016;
      if (pj > 0.02) {
        float2 pp = pathAt(float2(${f(st.x)}, ${f(st.y)}), float2(${f(ENDS[k].x)}, ${f(ENDS[k].y)}), pj);
        float sz = ${f(SIZE[0])} * pow(${f(SIZE[1] / SIZE[0])}, along(pj));
        float rr = max(1.1, sz * 0.045);
        float fadeP = min(1.0, p0 / 0.08) * (1.0 - max(0.0, (p0 - 0.82) / 0.18));
        trail = max(trail, smoothstep(rr + 0.6, rr - 0.6, length(u - pp)) * (1.0 - float(j) / 8.0) * fadeP);
      }
    }
  }`,
  ).join('\n  ')}
  col = mix(col, half3(1.0, 0.99, 0.97), trail * 0.85);

  half3 ground = paper(u);
  if (pres > 0.985) { return half4(col, 1.0); }
  float r = ${f(CELL)} * 0.74 * pow(clamp(pres, 0.0, 1.0), 0.85);
  float cov = (1.0 - smoothstep(r - 0.6, r + 0.6, length(u - cc))) * step(0.03, pres);
  return half4(mix(ground, col, cov), 1.0);
}
`;

const FRAMES: number[] = [];
for (let i = 0; i * (1 / FPS) <= LOOP + 1e-6; i += 1) FRAMES.push(i / FPS);
const nodes: Record<string, SceneNode> = {};
const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
const sampled = <T>(id: string, fn: (s: number) => T) =>
  keyed(id, FRAMES.map((s, i) => [t(s), fn(s), i === FRAMES.length - 1 ? 'hold' : 'linear']) as never) as never;

add({ ...base('paint', { outTick: END, x: WIN.x, y: WIN.y }), type: 'image', assetId: 'paint', size: constant({ width: PWD, height: PH }), fit: 'cover' } as SceneNode);
const field = add({
  ...base('field', { outTick: END }),
  type: 'effect',
  effect: 'custom-sksl',
  inputId: 'paint',
  implementation: SKSL,
  capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
  parameters: [{ id: 'time', name: 'time', valueType: 'number', minimum: 0, maximum: 10, value: keyed('field.time', [[0, 0, 'linear'], [END, LOOP]]) }],
} as SceneNode);

// the planes: heading along their path, the drawing's nose 45 degrees up
const planeIds = STARTS.map((_, k) => {
  const pos = (s: number) => pathAt(k, phaseOf(k, s));
  const heading = (s: number) => {
    const p = phaseOf(k, s);
    const a = pathAt(k, Math.max(0, p - 0.004));
    const b = pathAt(k, Math.min(1, p + 0.004));
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 45;
  };
  // the wrap (phase 1 -> 0) is a hold cut while the plane is invisible
  const keys = (fn: (s: number) => unknown) => {
    const out: [number, unknown, string][] = [];
    FRAMES.forEach((s, i) => {
      const wrapsNext = i < FRAMES.length - 1 && phaseOf(k, FRAMES[i + 1]) < phaseOf(k, s);
      out.push([t(s), fn(s), i === FRAMES.length - 1 || wrapsNext ? 'hold' : 'linear']);
    });
    return out;
  };
  return add({
    ...base(`plane${k}`, {
      outTick: END,
      position: keyed(`plane${k}.p`, keys((s) => ({ ...pos(s), z: 0 })) as never) as never,
      rotation: keyed(`plane${k}.r`, keys((s) => ({ x: 0, y: 0, z: heading(s) })) as never) as never,
      scale: keyed(`plane${k}.s`, keys((s) => {
        const p = phaseOf(k, s);
        const g = (sizeAt(p) / 0.861 / 512) * Math.max(0.0001, alphaAt(p) > 0.001 ? 1 : 0.0001);
        return { x: g, y: g, z: 1 };
      }) as never) as never,
      opacity: keyed(`plane${k}.o`, keys((s) => alphaAt(phaseOf(k, s))) as never) as never,
    }),
    type: 'image',
    assetId: 'plane',
    size: constant({ width: 512, height: 512 }),
    fit: 'contain',
  } as SceneNode);
});

// the wordmark, top left, as in the nav
const PAD = 64;
const MARK = 30;
const mark = add({
  ...base('mark', { outTick: END, x: PAD + MARK / 2, y: PAD + 4, scale: constant({ x: MARK / 0.861 / 512, y: MARK / 0.861 / 512, z: 1 }) }),
  type: 'image',
  assetId: 'plane',
  size: constant({ width: 512, height: 512 }),
  fit: 'contain',
} as SceneNode);
const WM = 26;
const wordmark = add({
  ...base('wordmark', { outTick: END, x: PAD + MARK + 11, y: PAD + 4 - WM * 0.62 }),
  type: 'text',
  runs: constant([{ text: 'ContentOS', fontFamily: 'Geist', fontSize: WM, fontWeight: 600, letterSpacing: 0, lineHeight: WM, color: INK }]),
  box: { width: 300, height: WM * 1.4 },
  wrap: 'none',
  align: 'left',
  verticalAlign: 'top',
} as SceneNode);

// the promise
// set as the hero sets its title: Mona Sans 500, ink, tight
const HS = 64;
const headline = add({
  ...base('headline', { outTick: END, x: PAD - 3, y: H / 2 - HS * 1.08 }),
  type: 'text',
  runs: constant([
    { text: 'Grow beyond', fontFamily: 'Mona Sans', fontSize: HS, fontWeight: 500, letterSpacing: 0, lineHeight: HS * 1.02, color: INK },
    { text: 'word of mouth.', fontFamily: 'Mona Sans', fontSize: HS, fontWeight: 500, letterSpacing: 0, lineHeight: HS * 1.02, color: INK },
  ]),
  box: { width: 560, height: HS * 2.6 },
  wrap: 'none',
  align: 'left',
  verticalAlign: 'top',
} as SceneNode);

const doc = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-og-card-river',
  name: 'ContentOS share card: send off',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: GROUND },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
  assets: {
    paint: { id: 'paint', type: 'image', uri: 'cta-day.jpg', width: 2880, height: 1280, mimeType: 'image/jpeg' },
    plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' },
  },
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: [field, ...planeIds, mark, wordmark, headline] } },
  markers: [],
  design: { tokens: { looping: true } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
} as never);
assertValidAnimationDocument(doc);
const diags = validateAnimationDocument(doc).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 900));
writeFileSync('animations/out/og/og.json', JSON.stringify(doc));
console.log('wrote animations/out/og/og.json', `${W}x${H}`, `${LOOP}s loop`, 'sun', SUN);
