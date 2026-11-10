/**
 * The share card: the OG video (public/og.mp4) and the OG image (public/og.png, one frame of it).
 *
 * Art direction
 *   mode      one object: the name, written across the site's own painted sky
 *   verb      skywrite: the ContentOS plane flies across the sky and the name forms in its wake, each
 *             letter made of the brand's paper planes, every one spinning into place as the plane
 *             passes, lit in the mark's colours and cooling to ink behind it; the plane climbs away,
 *             the promise rises under the name, and a second light crosses it
 *   geometry  the mark: the hero plane, and the same plane as the unit of every letter (the footer's
 *             wordmark system, animations/plane-wordmark.ts)
 *   palette   the hero's own sky, footage of its scene (the oil-painted Udaipur lake palace by day,
 *             clouds billowing); ink planes; lit, the mark's folds (blue through Content as the
 *             light passes); it settles on ink Content and coral OS
 *   scale     1200 x 630; the name spans 86 % of the width in the sky's calm band
 *   words     ContentOS, and the hero's headline under it
 *
 *   clayzo export animations/out/hero-india.json animations/out/og/sky.mp4 --format mp4 --end 2064
 *     (the hero's painted sky, oil-paint pass and all, as footage; then clayzo import-video on it)
 *   pnpm tsx animations/og-card.ts      (writes animations/out/og/og.json)
 *   clayzo export animations/out/og/og.json public/og.mp4 --format mp4
 *   clayzo render-frame animations/out/og/og.json public/og.png --tick <OG_TICK> --full-resolution
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  keyed,
  validateAnimationDocument,
  video,
  videoAsset,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';
import { MARK } from './lib/mark';

const W = 1200;
const H = 630;
const DUR = 8.6;
const END = t(DUR);

// the name, on the footer wordmark's measure (Geist 760, "ContentOS" 5.393 em of ink)
const EM_W = 5.393;
const INK_TOP = 0.273;
const INK_H = 0.74;
const INK_LEFT = 0.04;
const SIZE = (W * 0.86) / EM_W;
const NAME_TOP = 112;
const MIDY = NAME_TOP + (SIZE * INK_H) / 2;
const NAME_X0 = (W - SIZE * EM_W) / 2;
const NAME_X1 = NAME_X0 + SIZE * EM_W;
const CELL = 10;
// "Content" alone is 3.95 em on this measure; the gap before the O sits just past it
const SPLIT_X = NAME_X0 + SIZE * 3.97;

// the writing front runs across the name at the plane's speed; the plane flies just ahead of it
const SPEED = 330; // px per second
const WRITE0 = 0.95; // s: the front reaches the name's left edge
const WRITE1 = WRITE0 + (NAME_X1 - NAME_X0 + 40) / SPEED;
const AHEAD = 78;
const WAVE = [5.3, 7.7] as const; // the second light crossing the finished name
const HEAD = [5.0, 5.9] as const; // the promise rising in
export const OG_TICK = t(8.5); // the frame used as the OG image: the finished card

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const front = (s: number) => NAME_X0 - 20 + (s - WRITE0) * SPEED;

// where the plane is: in from the left at writing speed, a gentle swell as it writes, then a climb
// away to the top right, faster
function planeAt(s: number) {
  const exitT = WRITE1 + 0.05;
  if (s <= exitT) {
    const x = front(s) + AHEAD;
    const y = MIDY - 6 + 18 * Math.sin(((s - WRITE0) / 1.6) * 2 * Math.PI) * smooth(clamp((s - 0.4) / 0.8));
    return { x, y };
  }
  const u = s - exitT;
  const x0 = front(exitT) + AHEAD;
  const y0 = MIDY - 6 + 18 * Math.sin(((exitT - WRITE0) / 1.6) * 2 * Math.PI);
  return { x: x0 + SPEED * u + 160 * u * u, y: y0 - 60 * u - 260 * u * u };
}
function planePose(s: number) {
  const e = 1 / 120;
  const a = planeAt(s - e);
  const b = planeAt(s + e);
  const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return { ...planeAt(s), rot: heading + 45 }; // the drawing's nose points 45 degrees up
}

const SKSL = `
uniform shader inputImage;
uniform float write;
uniform float wave;
uniform half4 ink;
uniform half4 topA;
uniform half4 topB;
uniform half4 lowA;
uniform half4 lowB;
uniform float2 renderScale;

float sdTri(float2 p, float2 p0, float2 p1, float2 p2) {
  float2 e0 = p1 - p0;
  float2 e1 = p2 - p1;
  float2 e2 = p0 - p2;
  float2 v0 = p - p0;
  float2 v1 = p - p1;
  float2 v2 = p - p2;
  float2 q0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  float2 q1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  float2 q2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float sg = sign(e0.x * e2.y - e0.y * e2.x);
  float2 d = min(min(float2(dot(q0, q0), sg * (v0.x * e0.y - v0.y * e0.x)),
                     float2(dot(q1, q1), sg * (v1.x * e1.y - v1.y * e1.x))),
                     float2(dot(q2, q2), sg * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}

float coverage(float2 cc, float s) {
  float h = ${(CELL * 0.25).toFixed(2)};
  float cov = 0.0;
  for (int k = 0; k < 4; k++) {
    float2 o = float2((k == 0 || k == 2) ? -h : h, k < 2 ? -h : h);
    cov += inputImage.eval((cc + o) * s).a;
  }
  return cov * 0.25;
}

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float CELL = ${CELL.toFixed(2)};
  float2 cc = (floor(u / CELL) + 0.5) * CELL;

  // behind the front only; the front leans with the plane's dive so the letters fill from its tail
  float d = write - cc.x + (cc.y - ${MIDY.toFixed(1)}) * 0.18;
  if (d <= 0.0) { return half4(0.0); }
  float cov = coverage(cc, s);
  if (cov < 0.2) { return half4(0.0); }

  // each plane pops in over a few cells behind the front, spinning once into the mark's heading
  float ap = clamp(d / ${(CELL * 9).toFixed(1)}, 0.0, 1.0);
  float e = 1.0 - (1.0 - ap) * (1.0 - ap) * (1.0 - ap);
  float pop = e + 0.22 * sin(3.14159265 * ap);
  // lit as it lands, cooling to ink over the next part of the name
  float hot = exp(-d / ${(W * 0.22).toFixed(1)});
  // the second light: a slanted front crossing the finished name
  float wf = mix(${(-0.3 * W).toFixed(1)}, ${(1.45 * W).toFixed(1)}, wave);
  float lp = clamp((wf - cc.x - (cc.y - ${MIDY.toFixed(1)}) * 0.35) / ${(0.2 * W).toFixed(1)}, 0.0, 1.0);
  float glint = sin(3.14159265 * lp);
  // the name's halves, split in the gap before the O
  float k = cc.x > ${SPLIT_X.toFixed(1)} ? 1.0 : 0.0;
  // the second light flashes through Content and leaves OS in coral, the mark's accent half: on the
  // hero's cobalt sky, ink Content and coral OS is the lockup that holds
  float lit = clamp(max(hot, mix(glint, lp, k)), 0.0, 1.0);

  float th = (1.0 - e) * -6.2831853 + 6.2831853 * (lp * lp * (3.0 - 2.0 * lp));
  float size = (0.8 + 0.34 * smoothstep(0.2, 0.75, cov)) * pop * (1.0 + 0.22 * glint);
  float R = CELL * 0.5 * max(size, 0.001);
  float2 v = (u - cc) / R;
  float c0 = cos(th);
  float s0 = sin(th);
  v = float2(c0 * v.x + s0 * v.y, -s0 * v.x + c0 * v.y);

  float dTop = sdTri(v, float2(0.929, -0.934), float2(-0.931, -0.171), float2(-0.164, 0.156));
  float dLow = sdTri(v, float2(0.929, -0.934), float2(-0.164, 0.156), float2(0.162, 0.932));
  float px = 1.0 / (s * R);
  float aTop = smoothstep(px, -px, dTop);
  float aLow = smoothstep(px, -px, dLow) * (1.0 - aTop);

  // lit, Content takes the blue fold and OS the coral one; each plane's crease a lighter shade of
  // its fold (OS's held halfway to coral, so it keeps its weight over the pink clouds)
  half3 cTop = mix(ink.rgb, mix(topB.rgb, lowB.rgb, k), lit);
  half3 cLow = mix(ink.rgb, mix(topA.rgb, mix(lowA.rgb, lowB.rgb, 0.55), k), lit);
  float fLow = mix(0.66, 1.0, lit);
  float a = clamp(e * 3.0, 0.0, 1.0);
  half3 rgb = (cTop * aTop + cLow * aLow * fLow) * a;
  return half4(rgb, (aTop + aLow * fLow) * a);
}
`;

const hexC = (h: string, a = 1): Color => {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
};
const pair = (f: string | readonly string[]) => (typeof f === 'string' ? [f, f] : [f[0], f[1]]);
const [TOP_A, TOP_B] = pair(MARK.upper);
const [LOW_A, LOW_B] = pair(MARK.lower);
const INK = hexC('#101114');

const times: number[] = [];
for (let i = 0; i * (1 / FPS) <= DUR + 1e-6; i += 1) times.push(i / FPS);
const sampled = <T>(id: string, f: (s: number) => T) =>
  keyed(id, times.map((s, i) => [t(s), f(s), i === times.length - 1 ? 'hold' : 'linear']) as never) as never;

const nodes: Record<string, SceneNode> = {};
const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);

// the hero's sky, as footage of its own scene (oil-paint pass, cloud flow and grade included): its box
// keeps the painting's shape at the card's width (1200 x 686), so the card trims it, mostly from the lake
const SKY = videoAsset('sky', 'sky.mp4', readFileSync('animations/out/og/sky.mp4'));
const paint = add(video('paint', { asset: SKY, inTick: 0, outTick: END, x: W / 2, y: H / 2 + 18, width: W, height: (W * 914) / 1600, fit: 'cover' }) as SceneNode);

add({
  ...base('word', { outTick: END, x: NAME_X0 - SIZE * INK_LEFT, y: NAME_TOP - SIZE * INK_TOP }),
  type: 'text',
  runs: constant([{ text: 'ContentOS', fontFamily: 'Geist', fontSize: SIZE, fontWeight: 760, letterSpacing: -SIZE / 30, lineHeight: SIZE, color: { r: 1, g: 0, b: 0, a: 1 } }]),
  box: { width: W * 1.1, height: SIZE * 1.2 },
  wrap: 'none',
  align: 'left',
  verticalAlign: 'top',
} as SceneNode);
const planes = add({
  ...base('planes', { outTick: END }),
  type: 'effect',
  effect: 'custom-sksl',
  inputId: 'word',
  implementation: SKSL,
  capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
  parameters: [
    { id: 'write', name: 'write', valueType: 'number', minimum: -2000, maximum: 4000, value: sampled('planes.write', (s) => Math.min(front(s), W + 400)) },
    { id: 'wave', name: 'wave', valueType: 'number', minimum: 0, maximum: 1, value: keyed('planes.wave', [[0, 0, 'hold'], [t(WAVE[0]), 0, { x1: 0.45, y1: 0, x2: 0.55, y2: 1 }], [t(WAVE[1]), 1]]) },
    { id: 'ink', name: 'ink', valueType: 'color', value: constant(INK) },
    { id: 'topA', name: 'topA', valueType: 'color', value: constant(hexC(TOP_A)) },
    { id: 'topB', name: 'topB', valueType: 'color', value: constant(hexC(TOP_B)) },
    { id: 'lowA', name: 'lowA', valueType: 'color', value: constant(hexC(LOW_A)) },
    { id: 'lowB', name: 'lowB', valueType: 'color', value: constant(hexC(LOW_B)) },
  ],
} as SceneNode);

// the plane itself (the mark, 512 px, its drawing 0.861 of the box)
const PLANE_BOX = 150;
const plane = add({
  ...base('plane', {
    outTick: END,
    position: sampled('plane.p', (s) => {
      const p = planePose(s);
      return { x: p.x, y: p.y, z: 0 };
    }),
    rotation: sampled('plane.r', (s) => ({ x: 0, y: 0, z: planePose(s).rot })),
    scale: constant({ x: PLANE_BOX / 512, y: PLANE_BOX / 512, z: 1 }),
  }),
  type: 'image',
  assetId: 'plane',
  size: constant({ width: 512, height: 512 }),
  fit: 'contain',
} as SceneNode);

// the promise, rising in under the name
const HEAD_SIZE = 42;
const headline = add({
  ...base('headline', {
    outTick: END,
    position: keyed('headline.p', [
      [0, { x: W / 2 - 500, y: NAME_TOP + SIZE * INK_H + 52 + 16, z: 0 }, 'hold'],
      [t(HEAD[0]), { x: W / 2 - 500, y: NAME_TOP + SIZE * INK_H + 52 + 16, z: 0 }, { x1: 0.2, y1: 0.8, x2: 0.3, y2: 1 }],
      [t(HEAD[1]), { x: W / 2 - 500, y: NAME_TOP + SIZE * INK_H + 52, z: 0 }],
    ]),
    opacity: keyed('headline.o', [[0, 0, 'hold'], [t(HEAD[0]), 0, { x1: 0.3, y1: 0, x2: 0.4, y2: 1 }], [t(HEAD[1]), 1]]),
  }),
  type: 'text',
  runs: constant([{ text: 'Grow beyond word of mouth.', fontFamily: 'Geist', fontSize: HEAD_SIZE, fontWeight: 500, letterSpacing: -0.025 * HEAD_SIZE, lineHeight: HEAD_SIZE * 1.2, color: INK }]),
  box: { width: 1000, height: HEAD_SIZE * 1.4 },
  wrap: 'none',
  align: 'center',
  verticalAlign: 'top',
} as SceneNode);

const doc = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-og-card',
  name: 'ContentOS share card',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0.62, g: 0.74, b: 0.9, a: 1 } },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
  assets: {
    sky: SKY,
    plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' },
  },
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: [paint, planes, plane, headline] } },
  markers: [],
  design: { tokens: { looping: false } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
} as never);
assertValidAnimationDocument(doc);
const diags = validateAnimationDocument(doc).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 800));
writeFileSync('animations/out/og/og.json', JSON.stringify(doc));
console.log('wrote animations/out/og/og.json', `${W}x${H}`, `${DUR}s`, 'og frame tick', OG_TICK, 'write', WRITE0.toFixed(2), '->', WRITE1.toFixed(2));
