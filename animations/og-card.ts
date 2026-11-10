/**
 * The share card: the OG video (public/og.mp4) and the OG image (public/og.jpg, its last frame).
 *
 * Art direction
 *   mode      the closing band's world (CtaBand, animations/cta-field.ts): the riverside of stone steps
 *             at sunset, painted, and broken into the page's halftone
 *   verb      into the sun: the card opens on the painting held in dots of its own colours, the camera
 *             easing in; the ContentOS plane sweeps in huge from the foreground and races away into
 *             the painting toward the sun, painting the river back to life in its wake; it hits the
 *             sun, the sun flares and its shafts fan out, and a ring of paint blooms from it across
 *             the whole scene, its front catching the light; the plane climbs out of the sun, loops up
 *             above it and lands as the lockup's mark; the name and the promise rise
 *   geometry  one square dot grid; the mark; the name in Geist; the promise in Mona Sans
 *   palette   the painting's own (the closing band's India dusk); the sun's warm light; ink type
 *   scale     1200 x 630; the lockup and the promise centred in the frame, in the sky above the sun
 *   words     the lockup (the mark and ContentOS), and the hero's promise under it
 *   time      5.6 s: the sun at 1.55 s, the bloom by 3 s, the landing at 2.95 s, the words by 3.9 s
 *
 *   pnpm tsx animations/og-card.ts      (writes animations/out/og/og.json, beside cta-day.jpg and plane.png)
 *   clayzo export animations/out/og/og.json <master>.mp4 --format mp4, then x264 it to public/og.mp4
 *   clayzo render-frame animations/out/og/og.json <frame>.png --tick <last> --full-resolution
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
const DUR = 5.6;
const END = t(DUR);
const CELL = 9;
const HZ = H * 0.658; // the painting's horizon (the closing band's India value)
const SUN = { x: W / 2, y: HZ + 2 };

// ------------------------------------------------------------------ the flight
type V2 = { x: number; y: number };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const seg = (s: number, a: number, b: number) => clamp((s - a) / (b - a));
function bez(p0: V2, p1: V2, p2: V2, p3: V2, u: number): V2 {
  const v = 1 - u;
  return {
    x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
    y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y,
  };
}
function hermite(p0: V2, m0: V2, p1: V2, m1: V2, u: number): V2 {
  const u2 = u * u;
  const u3 = u2 * u;
  const a = 2 * u3 - 3 * u2 + 1;
  const b = u3 - 2 * u2 + u;
  const c = -2 * u3 + 3 * u2;
  const d = u3 - u2;
  return { x: a * p0.x + b * m0.x + c * p1.x + d * m1.x, y: a * p0.y + b * m0.y + c * p1.y + d * m1.y };
}

// leg A: in from the foreground (huge, bottom left), racing away into the painting to the sun; on
// screen it slows as it recedes. Leg B: out of the sun, up and round, landing as the lockup's mark
const A = { t0: 0.3, t1: 1.55, p0: { x: -160, y: 760 }, c1: { x: 120, y: 470 }, c2: { x: 430, y: 380 }, p1: SUN };
const legAu = (s: number) => 1 - Math.pow(1 - seg(s, A.t0, A.t1), 1.7);
const legA = (u: number) => bez(A.p0, A.c1, A.c2, A.p1, u);
const SIZE_A = [360, 46] as const; // the drawing's size, foreground to the sun

// the lockup: the mark, then ContentOS in Geist 600; with the promise, centred in the frame
const WM = { size: 72, gap: 18, width: 5.2 * 72 };
const MARK_DRAW = 86;
const LOCK_W = MARK_DRAW + WM.gap + WM.width;
const LOCK_Y = 278;
const LAND = { x: W / 2 - LOCK_W / 2 + MARK_DRAW / 2, y: LOCK_Y };
const B = { t1: 2.95 };

function planeAt(s: number): V2 & { size: number } {
  if (s <= A.t1) {
    const u = legAu(s);
    return { ...legA(u), size: SIZE_A[0] * Math.pow(SIZE_A[1] / SIZE_A[0], u) };
  }
  const T = B.t1 - A.t1;
  const u = seg(s, A.t1, B.t1);
  // leaving the sun the way it went in, then up and round and back to land, arriving slow
  const e = 1e-3;
  const a = legA(1 - e);
  const vin = { x: ((A.p1.x - a.x) / e) * 0.0016, y: ((A.p1.y - a.y) / e) * 0.0016 };
  const k = Math.hypot(vin.x, vin.y) || 1;
  const m0 = { x: (vin.x / k) * 900, y: (vin.y / k) * 900 - 500 };
  const p = hermite(SUN, m0, LAND, { x: -220, y: 140 }, u);
  void T;
  // it comes back toward the camera a little as it climbs to the lockup
  return { ...p, size: SIZE_A[1] + (MARK_DRAW - SIZE_A[1]) * smooth(u) };
}

// heading from the path; heading left, the drawing is mirrored so it never flies upside down;
// softened over a few frames so it rolls, and settled to the logo's own pose as it lands
function rawPose(s: number) {
  const e = 1 / 120;
  const a = planeAt(s - e);
  const b = planeAt(s + e);
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const sp = Math.hypot(vx, vy) || 1;
  const side = vx >= 0 ? 1 : -1;
  const alpha = (Math.atan2(vy, Math.abs(vx)) * 180) / Math.PI;
  let rot = side * (clamp(alpha, -75, 75) + 45);
  let flip = side * smooth(clamp(Math.abs(vx) / sp / 0.35));
  const land = smooth(seg(s, B.t1 - 0.45, B.t1));
  rot *= 1 - land;
  flip += (1 - flip) * land;
  return { rot, flip };
}
const FRAMES: number[] = [];
for (let i = 0; i * (1 / FPS) <= DUR + 1e-6; i += 1) FRAMES.push(i / FPS);
const softened = (key: 'rot' | 'flip', s: number) => {
  let acc = 0;
  let ws = 0;
  for (let k = -6; k <= 6; k += 1) {
    const w = Math.exp(-(k * k) / 18);
    acc += rawPose(s + k / FPS)[key] * w;
    ws += w;
  }
  return acc / ws;
};

// ------------------------------------------------------------------ the painting, in dots
const f = (x: number) => x.toFixed(3);
// leg A's path, sampled for the wake: point and the time the plane passed it
const WAKE = Array.from({ length: 14 }, (_, i) => {
  const s = A.t0 + ((A.t1 - A.t0) * (i + 0.5)) / 14;
  const p = planeAt(s);
  return { x: p.x, y: p.y, s, r: p.size * 0.42 };
});
const FLASH_T = A.t1;
const BLOOM = [A.t1 + 0.04, A.t1 + 1.45] as const;

const SKSL = `
uniform shader inputImage;
uniform float time;
uniform float2 plane;
uniform float planeR;
uniform float2 renderScale;

float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float vnoise(float x) {
  float i = floor(x);
  float g = fract(x);
  return mix(hash1(i), hash1(i + 1.0), g * g * (3.0 - 2.0 * g));
}

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float tt = time;
  float2 cc = (floor(u / ${f(CELL)}) + 0.5) * ${f(CELL)};
  float2 SUN = float2(${f(SUN.x)}, ${f(SUN.y)});

  // the closing band's shape: whole in the middle, gone at the edges (a squared-off oval)
  float2 e2 = (cc - float2(${f(W / 2)}, ${f(H / 2)})) / float2(${f(W * 0.56)}, ${f(H * 0.56)});
  float2 a2 = abs(e2);
  float e = pow(pow(a2.x, 5.0) + pow(a2.y, 3.2), 0.24) + 0.03 * sin(atan(e2.y, e2.x) * 5.0 + tt * 1.2) + 0.02 * (hash1(dot(cc, float2(0.13, 0.71))) - 0.5);
  float band = 1.0 - smoothstep(0.6, 1.0, e);
  // held in dots to begin with: a dot of every colour, smaller toward the edges
  float pres = 0.5 * smoothstep(1.25, 0.45, e);

  // the wake: painted where the plane has passed, the clear path widening as it ages
  ${WAKE.map(
    (w) => `{
    float age = tt - ${f(w.s)};
    float wd = ${f(w.r)} + max(age, 0.0) * 60.0;
    pres = max(pres, step(0.0, age) * smoothstep(0.0, 0.2, age) * exp(-dot(cc - float2(${f(w.x)}, ${f(w.y)}), cc - float2(${f(w.x)}, ${f(w.y)})) / (wd * wd)));
  }`,
  ).join('\n  ')}
  // and around the plane, the paint swells back as it passes
  float2 pl = plane / s;
  float near = 1.0 - smoothstep(planeR * 0.5, planeR * 1.4, length(cc - pl));
  pres = max(pres, near * step(${f(A.t0)}, tt) * (1.0 - step(${f(A.t1)}, tt)));

  // the bloom: a ring of paint out from the sun, leaving the band's shape behind it
  float sd = length(cc - SUN);
  float bk = clamp((tt - ${f(BLOOM[0])}) / ${f(BLOOM[1] - BLOOM[0])}, 0.0, 1.0);
  float R = 1500.0 * (1.0 - pow(1.0 - bk, 2.4));
  float inside = smoothstep(R + 10.0, R - 150.0, sd) * step(${f(BLOOM[0])}, tt);
  pres = mix(pres, max(band, pres * (1.0 - band * 0.0)), inside);
  pres = max(pres * (1.0 - inside), mix(pres, band, inside));
  float front = exp(-pow((sd - R + 40.0) / 34.0, 2.0)) * step(${f(BLOOM[0])}, tt) * (1.0 - bk);

  // the dots breathe, a little, out of step with each other
  pres *= 1.0 + 0.06 * sin(tt * 2.2 + hash1(dot(cc, float2(0.31, 0.17))) * 6.2831853) * (1.0 - smoothstep(0.85, 1.0, pres));

  half3 col = unpremul(inputImage.eval(q)).rgb;
  float2 dv = u - SUN;
  float dist = length(dv);
  // the flash as the plane hits the sun, then the sun's warm light, breathing
  float flash = step(${f(FLASH_T)}, tt) * exp(-max(tt - ${f(FLASH_T)}, 0.0) * 3.2) + smoothstep(${f(FLASH_T - 0.25)}, ${f(FLASH_T)}, tt) * (1.0 - step(${f(FLASH_T)}, tt)) * 0.6;
  float halo = exp(-dist / 34.0) * 0.6 + exp(-dist / 200.0) * 0.3 + exp(-dist / 120.0) * flash * 0.9;
  // shafts fanning from the sun across the sky, flaring with it
  float ang = atan(dv.y, dv.x);
  float fan = vnoise(ang * 7.0 + tt * 0.35) * vnoise(ang * 15.0 - tt * 0.22 + 7.0);
  float rays = fan * exp(-dist / 430.0) * smoothstep(40.0, -60.0, dv.y) * (0.22 + 1.1 * flash);
  half3 light = half3(1.0, 0.86, 0.66) * (halo * (0.94 + 0.06 * sin(tt * 2.4)) + rays) + half3(1.0, 0.9, 0.75) * front * 0.5;
  col = 1.0 - (1.0 - col) * (1.0 - clamp(light, 0.0, 1.0));

  if (pres > 0.985) { return half4(col, 1.0); }
  float r = ${f(CELL)} * 0.74 * pow(clamp(pres, 0.0, 1.0), 0.85);
  float cov = 1.0 - smoothstep(r - 0.6, r + 0.6, length(u - cc));
  half3 ground = half3(0.98, 0.976, 0.965);
  return half4(mix(ground, col, cov), 1.0);
}
`;

const nodes: Record<string, SceneNode> = {};
const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
const sampled = <T>(id: string, fn: (s: number) => T) =>
  keyed(id, FRAMES.map((s, i) => [t(s), fn(s), i === FRAMES.length - 1 ? 'hold' : 'linear']) as never) as never;

// the painting, cover-fit (2880 x 1280 at 630 tall is 1418 wide), the camera easing in on it the
// whole time: the dot grid holds still while the painting moves under it
const PW = (2880 * H) / 1280;
add({
  ...base('paint', {
    outTick: END,
    x: W / 2,
    y: H / 2,
    scale: keyed('paint.s', [[0, { x: 1.12, y: 1.12, z: 1 }, { x1: 0.25, y1: 0.4, x2: 0.3, y2: 1 }], [END, { x: 1, y: 1, z: 1 }]]),
  }),
  type: 'image',
  assetId: 'paint',
  size: constant({ width: PW, height: H }),
  fit: 'cover',
} as SceneNode);
const field = add({
  ...base('field', { outTick: END }),
  type: 'effect',
  effect: 'custom-sksl',
  inputId: 'paint',
  implementation: SKSL,
  capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
  parameters: [
    { id: 'time', name: 'time', valueType: 'number', minimum: 0, maximum: 10, value: keyed('field.time', [[0, 0, 'linear'], [END, DUR]]) },
    { id: 'plane', name: 'plane', valueType: 'point', minimum: { x: -4000, y: -4000 }, maximum: { x: 4000, y: 4000 }, value: sampled('field.plane', (s) => ({ x: planeAt(s).x, y: planeAt(s).y })) },
    { id: 'planeR', name: 'planeR', valueType: 'number', minimum: 0, maximum: 1000, value: sampled('field.planeR', (s) => planeAt(s).size) },
  ],
} as SceneNode);

// the plane (the mark's drawing fills 0.861 of plane.png)
const plane = add({
  ...base('plane', {
    outTick: END,
    position: sampled('plane.p', (s) => ({ x: planeAt(s).x, y: planeAt(s).y, z: 0 })),
    rotation: sampled('plane.r', (s) => ({ x: 0, y: 0, z: softened('rot', s) })),
    scale: sampled('plane.s', (s) => {
      const k = planeAt(s).size / 0.861 / 512;
      const visible = s >= A.t0;
      return { x: visible ? k * softened('flip', s) : 0.0001, y: visible ? k : 0.0001, z: 1 };
    }),
  }),
  type: 'image',
  assetId: 'plane',
  size: constant({ width: 512, height: 512 }),
  fit: 'contain',
} as SceneNode);

// the name, rising in beside the landed mark
const INK: Color = { r: 0.063, g: 0.067, b: 0.078, a: 1 };
const NAME_IN = [2.75, 3.35] as const;
const textX = LAND.x + MARK_DRAW / 2 + WM.gap;
const textTop = LOCK_Y - 0.643 * WM.size;
const wordmark = add({
  ...base('wordmark', {
    outTick: END,
    position: keyed('wordmark.p', [
      [0, { x: textX - 16, y: textTop, z: 0 }, 'hold'],
      [t(NAME_IN[0]), { x: textX - 16, y: textTop, z: 0 }, { x1: 0.16, y1: 1, x2: 0.3, y2: 1 }],
      [t(NAME_IN[1]), { x: textX, y: textTop, z: 0 }],
    ]),
    opacity: keyed('wordmark.o', [[0, 0, 'hold'], [t(NAME_IN[0]), 0, { x1: 0.3, y1: 0, x2: 0.4, y2: 1 }], [t(NAME_IN[1]), 1]]),
  }),
  type: 'text',
  runs: constant([{ text: 'ContentOS', fontFamily: 'Geist', fontSize: WM.size, fontWeight: 600, letterSpacing: 0, lineHeight: WM.size, color: INK }]),
  box: { width: 600, height: WM.size * 1.3 },
  wrap: 'none',
  align: 'left',
  verticalAlign: 'top',
} as SceneNode);

// the promise, in the page's face (Mona Sans 500), in the ink the page sets on its sky
const TAG = { size: 34, in: [3.25, 3.9] as const };
const tagTop = LOCK_Y + 0.36 * WM.size + 26;
const tagline = add({
  ...base('tagline', {
    outTick: END,
    position: keyed('tagline.p', [
      [0, { x: 0, y: tagTop + 10, z: 0 }, 'hold'],
      [t(TAG.in[0]), { x: 0, y: tagTop + 10, z: 0 }, { x1: 0.16, y1: 1, x2: 0.3, y2: 1 }],
      [t(TAG.in[1]), { x: 0, y: tagTop, z: 0 }],
    ]),
    opacity: keyed('tagline.o', [[0, 0, 'hold'], [t(TAG.in[0]), 0, { x1: 0.3, y1: 0, x2: 0.4, y2: 1 }], [t(TAG.in[1]), 1]]),
  }),
  type: 'text',
  runs: constant([{ text: 'Grow beyond word of mouth.', fontFamily: 'Mona Sans', fontSize: TAG.size, fontWeight: 500, letterSpacing: 0, lineHeight: TAG.size * 1.2, color: { r: 0.173, g: 0.18, b: 0.212, a: 1 } }]),
  box: { width: W, height: TAG.size * 1.4 },
  wrap: 'none',
  align: 'center',
  verticalAlign: 'top',
} as SceneNode);

const doc = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-og-card',
  name: 'ContentOS share card: into the sun',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0.98, g: 0.976, b: 0.965, a: 1 } },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
  assets: {
    paint: { id: 'paint', type: 'image', uri: 'cta-day.jpg', width: 2880, height: 1280, mimeType: 'image/jpeg' },
    plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' },
  },
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: [field, plane, wordmark, tagline] } },
  markers: [],
  design: { tokens: { looping: false } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
} as never);
assertValidAnimationDocument(doc);
const diags = validateAnimationDocument(doc).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 900));
writeFileSync('animations/out/og/og.json', JSON.stringify(doc));
console.log('wrote animations/out/og/og.json', `${W}x${H}`, `${DUR}s`, 'last tick', END - 4, 'land', LAND, 'text block', Math.round(LOCK_Y - 0.36 * WM.size), '-', Math.round(tagTop + TAG.size * 1.05));
