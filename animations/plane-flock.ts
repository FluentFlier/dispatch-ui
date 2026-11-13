/**
 * A flock of the plane mark for phones, where the big halftone plane has no room: it fills the
 * band between the hero and the voice check.
 *
 * Art direction
 *   mode      a few marks crossing one band, never more than three in view
 *   verb      glide: each plane climbs across on its own gentle arc, nose first, and leaves a
 *             dotted contrail that thins out behind it
 *   geometry  the plane mark in the same halftone as the desktop plane; each plane's dot grid
 *             travels with it, so the dots never swim; trails are a dot every 6 units
 *   palette   ink dots (pale on dark), the lead plane cobalt / periwinkle
 *   scale     390 x 160, the full width of a phone; sizes 20 to 46 for depth
 *
 *   pnpm tsx animations/plane-flock.ts   (writes public/scene/plane-flock/{light,dark}.json)
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  hex,
  keyed,
  parseSvgPath,
  stroke,
  trim,
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';
import { MARK } from './lib/mark';

const W = 390;
const H = 160;
const END = t(10);
// the mark's nose points 45 degrees above the horizontal (measured off public/brand/mark.svg)
const NOSE = -45;
// how often to key a plane's position along its arc (seconds)
const STEP = 1 / 15;

type Pt = [number, number];
type Bird = { size: number; alpha: number; lead?: boolean; cell: number; path: [Pt, Pt, Pt, Pt]; t0: number; dur: number };
const FLOCK: Bird[] = [
  { size: 78, alpha: 0.8, lead: true, cell: 3.4, path: [[-60, 140], [110, 128], [260, 60], [460, 18]], t0: 0, dur: 5.2 },
  { size: 50, alpha: 0.45, cell: 3, path: [[-50, 104], [120, 98], [280, 66], [440, 28]], t0: 2.6, dur: 6 },
  { size: 62, alpha: 0.6, cell: 3.2, path: [[-55, 156], [140, 150], [300, 102], [450, 62]], t0: 5.3, dur: 5.4 },
  { size: 36, alpha: 0.32, cell: 2.6, path: [[-40, 78], [130, 74], [270, 38], [430, 10]], t0: 7.6, dur: 6.4 },
];

/** a cubic as an arc-length polyline, so trims and positions share one measure */
function arc(p: [Pt, Pt, Pt, Pt], n = 96) {
  const at = (u: number): Pt => {
    const v = 1 - u;
    return [0, 1].map((k) => v * v * v * p[0][k] + 3 * v * v * u * p[1][k] + 3 * v * u * u * p[2][k] + u * u * u * p[3][k]) as Pt;
  };
  const raw = Array.from({ length: 400 }, (_, i) => at(i / 399));
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const len = cum[cum.length - 1];
  /** the point and heading at fraction s of the length */
  const point = (s: number) => {
    const target = Math.min(1, Math.max(0, s)) * len;
    let i = cum.findIndex((c) => c >= target);
    if (i <= 0) i = 1;
    const f = (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    const x = raw[i - 1][0] + (raw[i][0] - raw[i - 1][0]) * f;
    const y = raw[i - 1][1] + (raw[i][1] - raw[i - 1][1]) * f;
    const ang = (Math.atan2(raw[i][1] - raw[i - 1][1], raw[i][0] - raw[i - 1][0]) * 180) / Math.PI;
    return { x, y, ang };
  };
  const d = Array.from({ length: n + 1 }, (_, i) => point(i / n))
    .map(({ x, y }, i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  return { point, d, len };
}

const SKSL = `
uniform shader inputImage;
uniform float2 org;
uniform float cell;
uniform half4 ink;
uniform float2 renderScale;

half4 main(float2 q) {
  float s = renderScale.x;
  // the grid is anchored to the plane, so its dots ride with it
  float2 u = (q - org) / s;
  float2 c = floor(u / cell);
  float2 cc = (c + 0.5) * cell;
  half4 src = unpremul(inputImage.eval(org + cc * s));
  if (src.a < 0.02) { return half4(0.0); }
  float lum = dot(src.rgb, half3(0.299, 0.587, 0.114));
  float tone = (0.3 + clamp(1.0 - lum, 0.0, 1.0) * 0.7) * src.a;
  float r = cell * 0.44 * sqrt(tone);
  float d = length(u - cc);
  float cov = 1.0 - smoothstep(r - 0.45, r + 0.45, d);
  return half4(ink.rgb * cov, cov) * ink.a;
}
`;

function build(dark: boolean) {
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
  const roots: string[] = [];
  const inkOf = (lead?: boolean): Color => (lead ? hex(dark ? MARK.lit.dark : MARK.lit.light) : hex(dark ? '#E4ECF0' : '#101114'));

  FLOCK.forEach((b, n) => {
    const A = arc(b.path);
    // phase of the flight at loop time `sec`: 0..1 in the air, otherwise parked off screen
    const phase = (sec: number) => (((sec - b.t0) % 10) + 10) % 10 / b.dur;
    const ticks: number[] = [];
    for (let sec = 0; sec <= 10 + 1e-9; sec += STEP) ticks.push(Math.min(END, t(sec)));
    const uniq = [...new Set(ticks)];
    const pos = uniq.map((tk) => {
      const p = phase(tk / TPS);
      const at = A.point(p > 1 ? 0 : p);
      return { tk, p, ...at };
    });
    // a key that jumps (landing, or the trail's reset) holds, so nothing streaks across the band
    const ease = (i: number, live: (p: number) => boolean) => (i + 1 < pos.length && live(pos[i].p) && !live(pos[i + 1].p) ? 'hold' : 'linear');
    const flying = (p: number) => p <= 1;

    // the plane: its image, turned to its heading, through a halftone that travels with it
    const imgId = `pl${n}`;
    add({
      ...base(imgId, {
        outTick: END,
        position: keyed(`${imgId}.p`, pos.map(({ tk, x, y }, i) => [tk, { x, y, z: 0 }, ease(i, flying)]) as never),
        rotation: keyed(`${imgId}.r`, pos.map(({ tk, ang }, i) => [tk, { x: 0, y: 0, z: ang - NOSE }, ease(i, flying)]) as never) as never,
      }),
      type: 'image',
      assetId: 'plane',
      size: constant({ width: b.size, height: b.size }),
      fit: 'contain',
    } as SceneNode);
    add({
      ...base(`pd${n}`, { outTick: END, opacity: constant(b.alpha) as never }),
      type: 'effect',
      effect: 'custom-sksl',
      inputId: imgId,
      implementation: SKSL,
      capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
      parameters: [
        { id: 'org', name: 'org', valueType: 'point', minimum: { x: -200, y: -200 }, maximum: { x: 800, y: 600 }, value: keyed(`pd${n}.org`, pos.map(({ tk, x, y }, i) => [tk, { x, y }, ease(i, flying)]) as never) },
        { id: 'cell', name: 'cell', valueType: 'number', minimum: 1, maximum: 10, value: constant(b.cell) },
        { id: 'ink', name: 'ink', valueType: 'color', value: constant(inkOf(b.lead)) },
      ],
    } as SceneNode);

    // the contrail: dots left along the arc, a short dense run and a longer faint one
    const gap = (b.size * 0.42) / A.len;
    const trail = (id: string, span: number, alpha: number) => {
      // the trail keeps sliding out after the plane has left, then resets off screen
      const live = (p: number) => p <= 1 + gap + span;
      const ends = pos.map(({ tk, p }, i) => [tk, live(p) ? Math.min(1, Math.max(0, p - gap)) : 0, ease(i, live)]);
      const starts = pos.map(({ tk, p }, i) => [tk, live(p) ? Math.min(1, Math.max(0, p - gap - span)) : 0, ease(i, live)]);
      add({
        ...base(id, { outTick: END }),
        type: 'path',
        path: constant(parseSvgPath(A.d).path),
        style: { stroke: stroke({ ...inkOf(b.lead), a: alpha * b.alpha }, Math.max(1.4, b.size / 22), { dash: [0.01, 6] }) },
        operators: [trim(`${id}.trim`, { start: keyed(`${id}.ts`, starts as never), end: keyed(`${id}.te`, ends as never) })],
      } as SceneNode);
      return id;
    };
    roots.push(trail(`tl${n}`, 0.34, 0.22), trail(`ts${n}`, 0.14, 0.4), `pd${n}`);
  });

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-plane-flock-${dark ? 'dark' : 'light'}`,
    name: 'ContentOS plane flock (phones)',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: { plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' } },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: roots } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 800));
  return doc;
}

const OUT = 'public/scene/plane-flock';
mkdirSync(OUT, { recursive: true });
mkdirSync('animations/out/plane-flock', { recursive: true });
for (const dark of [false, true]) {
  const doc = build(dark);
  const name = dark ? 'dark' : 'light';
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(doc));
  writeFileSync(`animations/out/plane-flock/${name}.json`, JSON.stringify(doc));
  console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16));
}
copyFileSync('public/scene/dither-plane/plane.png', `${OUT}/plane.png`);
copyFileSync('public/scene/dither-plane/plane.png', 'animations/out/plane-flock/plane.png');
