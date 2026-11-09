/**
 * The closing band (CtaBand): the page began on a painted morning sky and ends on the open sea at
 * sunset (India: a riverside of stone steps), and you hold the sun. It sits half set on the horizon,
 * a path of glitter on the water under it; drag it below the horizon and it sets; on a desktop it follows the cursor, and the
 * painting relights from wherever it is: shafts of light fan out through the gaps in the clouds and
 * the cloud edges facing it catch a warm rim. Toward every edge the painting breaks into the page's
 * halftone (the acts' strips), the dots shrinking to nothing; near the sun they swell back into paint.
 *
 * Art direction
 *   verb      light: one point of light, and the whole sky answers it
 *   geometry  the painting; rays fanned from the sun; the band's edges in the square dot grid
 *   palette   the generated paintings (animations/assets/dusk*.jpg and india-dusk*.jpg, the hero's
 *             brushwork, their own scenes; the night ones painted from the day ones); sunlight apricot-white by day, a pale moon and sea-blue light at night
 *   scale     1440 x 640 full bleed (the page keeps that shape, the faded sides run off), and 390 x 640
 *             for phones, where the sun sways on the horizon on its own
 *   words     none in the scene: the page sets the headline in the calm above the sun
 *
 *   pnpm tsx animations/paint-panels.ts cta   (the painted crops, once)
 *   pnpm tsx animations/cta-field.ts          (writes public/scene/cta-field[-india]/{light,dark}[-narrow].json)
 */
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  keyed,
  validateAnimationDocument,
  withComputedRevision,
  withInteraction,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';

const LOOP = 12; // seconds; the idle sway and the shimmer of the rays repeat once per loop
const END = t(LOOP);
const IMG = { width: 2880, height: 1280 };

type Look = { ground: string; core: string; light: string; bright: number; rays: number; disc: number };

const SKSL = (W: number, H: number, CELL: number, RX: number, RY: number, L: Look, HZ: number) => `
uniform shader inputImage;
uniform float2 sun;
uniform float phase;
uniform half4 ground;
uniform half4 core;
uniform half4 light;
uniform float2 renderScale;

half3 img(float2 p, float s) {
  return unpremul(inputImage.eval(p * s)).rgb;
}
float luma(half3 c) {
  return dot(c, half3(0.299, 0.587, 0.114));
}
float hash1(float x) {
  return fract(sin(x * 127.1) * 43758.5453);
}
float vnoise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash1(i), hash1(i + 1.0), f * f * (3.0 - 2.0 * f));
}
float hash2(float2 c) {
  return fract(sin(dot(c, float2(127.1, 311.7))) * 43758.5453);
}
float vnoise2(float2 x) {
  float2 i = floor(x);
  float2 f = fract(x);
  float2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + float2(1.0, 0.0)), w.x), mix(hash2(i + float2(0.0, 1.0)), hash2(i + float2(1.0, 1.0)), w.x), w.y);
}

// the painting at p, lit from the sun at sn (composition units)
half3 shade(float2 p, float2 sn, float s) {
  half3 c = img(p, s);
  float2 d = sn - p;
  float dist = length(d);
  float near = exp(-dist / 300.0);
  float HZ = ${HZ.toFixed(1)};
  // how much of the sun is above the water: drag it down and it sets
  float up = smoothstep(-4.0, 30.0, HZ - sn.y + ${L.disc.toFixed(1)});

  // the cloud edges facing the sun catch a rim
  float l0 = luma(c);
  float2 g = float2(luma(img(p + float2(3.0, 0.0), s)) - l0, luma(img(p + float2(0.0, 3.0), s)) - l0);
  float facing = max(0.0, dot(normalize(g + 1e-5), normalize(d + 1e-5)));
  float rim = clamp(length(g) * 9.0, 0.0, 1.0) * facing * near;

  // shafts: march toward the sun, gathering the bright gaps between the clouds and the disc itself
  float acc = 0.0;
  float wsum = 0.0;
  float2 stepv = d / 14.0;
  float2 sp = p;
  float w = 1.0;
  // far from the sun the shafts have faded to nothing: skip the march there
  int steps = dist < 1100.0 ? 14 : 0;
  for (int i = 0; i < 14; i++) {
    if (i >= steps) { break; }
    sp += stepv;
    float b = smoothstep(${L.bright.toFixed(3)}, ${(L.bright + 0.22).toFixed(3)}, luma(img(sp, s)));
    float disc = exp(-dot(sp - sn, sp - sn) / 2600.0);
    acc += (b * 0.55 + disc) * w;
    wsum += w;
    w *= 0.9;
  }
  acc /= wsum;
  // broken into fans that shimmer slowly
  float ang = atan(d.y, d.x);
  float fan = 0.72 + 0.28 * vnoise(ang * 6.0 + sin(phase) * 1.2) * vnoise(ang * 13.0 - cos(phase) * 0.9 + 7.0);
  float rays = acc * fan * exp(-dist / 620.0) * ${L.rays.toFixed(2)} * mix(0.2, 1.0, up);

  // the sun: a hard disc and two glows
  float disc = 1.0 - smoothstep(${L.disc - 1}.0, ${L.disc + 1}.0, dist);
  float halo = (exp(-dist / ${(L.disc * 1.6).toFixed(1)}) * 0.55 + exp(-dist / 240.0) * 0.4) * mix(0.3, 1.0, up);
  // the water hides whatever of it is below the horizon
  disc *= 1.0 - smoothstep(HZ - 0.8, HZ + 0.8, p.y);

  // a path of glitter on the water under it, widening toward you, its ripples drifting
  float glit = 0.0;
  float below = p.y - HZ;
  if (below > 0.0) {
    float lane = exp(-abs(p.x - sn.x) / (8.0 + below * 0.45));
    float rip = vnoise2(float2(p.x * 0.05 + sin(phase) * 0.6, below * 0.42 + sin(phase) * 2.0 + cos(phase) * 1.3));
    glit = lane * smoothstep(0.5, 0.85, rip) * up * exp(-below / 220.0) * 1.3;
  }

  half3 add = light.rgb * (rays + rim * 0.55 + halo * 0.6) + core.rgb * (disc + glit * 0.7);
  // screen, so light never clips to a flat white
  return 1.0 - (1.0 - c) * (1.0 - clamp(add, 0.0, 1.0));
}

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float2 sn = sun / s;
  float CELL = ${CELL.toFixed(1)};
  float2 cc = (floor(u / CELL) + 0.5) * CELL;

  // how much of the painting stands here: whole in the middle, gone at the edges, a slow breath along
  // the boundary, and swelling back near the sun
  float2 e2 = (cc - float2(${(W / 2).toFixed(1)}, ${(H / 2).toFixed(1)})) / float2(${RX.toFixed(1)}, ${RY.toFixed(1)});
  float2 a2 = abs(e2);
  // a squared-off oval: the band, not a vignette
  float e = pow(pow(a2.x, 5.0) + pow(a2.y, 3.2), 0.24) + 0.035 * sin(atan(e2.y, e2.x) * 5.0 + phase) + 0.02 * (hash1(dot(cc, float2(0.13, 0.71))) - 0.5);
  float pres = 1.0 - smoothstep(0.62, 1.0, e);
  pres = max(pres, 1.0 - smoothstep(34.0, 170.0, length(cc - sn)));

  if (pres > 0.985) {
    return half4(shade(u, sn, s), 1.0);
  }
  // a dot of the lit painting (its colour per pixel, so nothing goes blocky), sized by how much of it
  // stands; it fills its cell as it nears whole
  float r = CELL * 0.74 * pow(pres, 0.85);
  float cov = 1.0 - smoothstep(r - 0.6, r + 0.6, length(u - cc));
  half3 col = shade(u, sn, s);
  return half4(col * cov, cov);
}
`;

const hexC = (h: string): Color => {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
};

function build(dark: boolean, phone: boolean, look: Look, horizon: number) {
  const W = phone ? 390 : 1440;
  const H = 640;
  const CELL = phone ? 8 : 10;
  // the painting's whole region: an ellipse; on a phone it runs off the sides
  const RX = phone ? W * 0.62 : W * 0.53;
  const RY = H * 0.52;
  // where the sun rests: half set on the painting's horizon, under the words
  const HZ = H * horizon;
  const REST = { x: W / 2, y: HZ + 2 };
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);

  // the painting, cover-fit (a phone sees its middle)
  add({ ...base('sky', { outTick: END, x: W / 2, y: H / 2 }), type: 'image', assetId: 'sky', size: constant({ width: W, height: H }), fit: 'cover' } as SceneNode);
  add({
    ...base('field', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'sky',
    // a phone's frame is a quarter as wide, so its sun is smaller
    implementation: SKSL(W, H, CELL, RX, RY, phone ? { ...look, disc: Math.round(look.disc * 0.62) } : look, HZ),
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      // driven by the bindings below; this is where it rests for stills and exports
      { id: 'sun', name: 'sun', valueType: 'point', minimum: { x: -400, y: -400 }, maximum: { x: 1840, y: 1040 }, value: constant(REST) },
      { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 7, value: keyed('field.phase', [[0, 0, 'linear'], [END, Math.PI * 2]]) },
      { id: 'ground', name: 'ground', valueType: 'color', value: constant(hexC(look.ground)) },
      { id: 'core', name: 'core', valueType: 'color', value: constant(hexC(look.core)) },
      { id: 'light', name: 'light', valueType: 'color', value: constant(hexC(look.light)) },
    ],
  } as SceneNode);

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-cta-field-${dark ? 'dark' : 'light'}${phone ? '-narrow' : ''}`,
    name: 'ContentOS closing band, the sun in your hand',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: { sky: { id: 'sky', type: 'image', uri: dark ? 'sky-night.jpg' : 'sky-day.jpg', ...IMG, mimeType: 'image/jpeg' } },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['field'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);

  // on its own the sun sways along the horizon, once per loop so a restart never jumps; with a cursor
  // over the band it follows, slowly, as something heavy would
  const w = (2 * Math.PI) / LOOP;
  const interactive = withInteraction(doc as never, [
    {
      id: 'sun-follow',
      target: { kind: 'effect-parameter', nodeId: 'field', parameterId: 'sun' },
      blend: 'set',
      steps: [
        { id: 'tm', op: 'time', unit: 'seconds' },
        { id: 'ax', op: 'arithmetic', operation: 'multiply', operand: w, inputs: ['tm'] },
        { id: 'sx', op: 'unary', operation: 'sine' },
        { id: 'dx', op: 'arithmetic', operation: 'multiply', operand: W * (phone ? 0.12 : 0.06) },
        { id: 'px', op: 'arithmetic', operation: 'add', operand: REST.x },
        { id: 'ay', op: 'arithmetic', operation: 'multiply', operand: 2 * w, inputs: ['tm'] },
        { id: 'sy', op: 'unary', operation: 'sine' },
        { id: 'dy', op: 'arithmetic', operation: 'multiply', operand: 10 },
        { id: 'py', op: 'arithmetic', operation: 'add', operand: REST.y },
        { id: 'idle', op: 'vec2', inputs: ['px', 'py'] },
        { id: 'ptr', op: 'pointer', space: 'composition' },
        { id: 'in', op: 'pointer-state', field: 'inside' },
        { id: 'pick', op: 'select', inputs: ['in', 'ptr', 'idle'] },
        { id: 'ease', op: 'damp', halfLife: 0.22 },
      ],
    },
  ] as never) as { interaction: object; revision?: string };
  // the words and buttons sit over the canvas: keep tracking the cursor across them
  const { revision: _r, ...rest } = interactive;
  const final = withComputedRevision({ ...rest, interaction: { ...interactive.interaction, pointer: { captureOutside: true } } } as never);
  assertValidAnimationDocument(final);
  const diags = validateAnimationDocument(final).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return final;
}

// where the sea meets the sky in each painting (measured), as a share of the height
const HORIZON: Record<string, number> = { '': 0.753, '-india': 0.658 };

const LOOKS: Record<'light' | 'dark', Look> = {
  light: { ground: '#FAF9F6', core: '#FFF6E6', light: '#FFB27A', bright: 0.72, rays: 0.95, disc: 22 },
  dark: { ground: '#080F14', core: '#EEF6F8', light: '#6CC6EB', bright: 0.36, rays: 0.6, disc: 16 },
};
for (const bg of ['', '-india']) {
  const name = `cta-field${bg}`;
  const pub = `public/scene/${name}`;
  const out = `animations/out/${name}`;
  for (const dir of [pub, out]) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }
  for (const dark of [false, true]) {
    for (const phone of [false, true]) {
      const doc = build(dark, phone, dark ? LOOKS.dark : LOOKS.light, HORIZON[bg]);
      const file = `${dark ? 'dark' : 'light'}${phone ? '-narrow' : ''}.json`;
      writeFileSync(`${pub}/${file}`, JSON.stringify(doc));
      writeFileSync(`${out}/${file}`, JSON.stringify(doc));
      console.log('wrote', name, file, (doc as { revision: string }).revision.slice(0, 16));
    }
    const src = `animations/assets/panels/cta${bg}-${dark ? 'night' : 'day'}-oil.jpg`;
    const f = dark ? 'sky-night.jpg' : 'sky-day.jpg';
    copyFileSync(src, `${pub}/${f}`);
    copyFileSync(src, `${out}/${f}`);
  }
}
