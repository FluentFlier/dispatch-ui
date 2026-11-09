/**
 * The phone strip above "Keeps working when you're busy." (ActMore): a clock in the halftone of
 * Act 1's plane, Act 2's crowd and Act 3's conversation, so the page keeps one dot language while each
 * strip says its own thing.
 *
 * Art direction
 *   verb      keep time: the hands sweep on their own; each time the minute hand reaches the top, a
 *             ring ripples out across the strip in cobalt, a post going out while you are elsewhere
 *   geometry  a square dot grid; dot size is presence: the face a faint field, the ticks and hands
 *             full dots, the rings lit
 *   palette   ink dots (pale on dark), the rings cobalt / sea cyan
 *   scale     390 wide, the other strips' width, and 500 tall: the rings rise up behind the section above
 *             and down behind the heading, fading out before the canvas edge (see the page CSS)
 *
 *   pnpm tsx animations/clock-mark.ts   (writes public/scene/clock-mark/{light,dark}.json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  keyed,
  stroke,
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, OUT, TPS, t } from './lib/kit';

const W = 390;
// taller than wide: the page lays it so the clock sits where a 212-tall strip would put it, the
// rest running up behind the section above and down behind the heading
const H = 500;
const CX = W / 2;
const CY = H / 2;
const R = 90; // the face
const TURN = 4; // seconds for one minute-hand turn
const TURNS = 3;
const END = t(TURN * TURNS);

const SKSL = `
uniform shader inputImage;
uniform float phase;
uniform half4 ink;
uniform half4 glint;
uniform float2 renderScale;

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  // the dots thin out toward every edge, so a ring fades before the canvas could cut it
  float edge = min(min(u.x, ${W}.0 - u.x), min(u.y, ${H}.0 - u.y));
  float fade = smoothstep(0.0, 56.0, edge);
  float CELL = 5.4;
  float2 cell = floor(u / CELL);
  float2 cc = (cell + 0.5) * CELL;
  // drawn opaque, one meaning per channel: red is presence, blue is the ripple
  float h = CELL * 0.25;
  float a = 0.0;
  float w = 0.0;
  float litSum = 0.0;
  for (int k = 0; k < 4; k++) {
    float2 o = float2((k == 0 || k == 2) ? -h : h, k < 2 ? -h : h);
    half4 tp = unpremul(inputImage.eval((cc + o) * s));
    w += tp.a;
    a += tp.r * tp.a;
    litSum += tp.b * tp.a;
  }
  if (w < 0.02) { return half4(0.0); }
  float lit = clamp(litSum / max(w, 0.0001), 0.0, 1.0);
  a *= 0.25 * fade;
  float wv = sin(dot(cc, float2(0.011, -0.007)) - phase);
  float crest = smoothstep(0.6, 1.0, wv);
  float r = CELL * 0.5 * sqrt(a) * (0.86 + 0.22 * crest);
  float d = length(u - cc);
  float cov = 1.0 - smoothstep(r - 0.5, r + 0.45, d);
  float strength = mix(ink.a, glint.a, lit);
  half3 col = mix(ink.rgb, glint.rgb, lit);
  return half4(col * strength * cov, strength * cov);
}
`;

function build(dark: boolean) {
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
  const field = (r: number, b: number): Color => ({ r, g: 0, b, a: 1 });
  const hexA = (h: string, al: number): Color => {
    const n = Number.parseInt(h.slice(1), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: al };
  };
  const ink = dark ? hexA('#E4ECF0', 0.27) : hexA('#101114', 0.3);
  const glint = dark ? hexA('#6CC6EB', 0.9) : hexA('#2F5BEA', 0.85);

  const rect = (id: string, x: number, y: number, w: number, h: number, color: Color, r = 0) =>
    add({ ...base(id, { outTick: END, x, y }), type: 'rect', size: constant({ width: w, height: h }), cornerRadius: constant(r), style: { fill: fill(color) } } as SceneNode);
  const disc = (id: string, d: number, color: Color) =>
    add({ ...base(id, { outTick: END, x: CX, y: CY }), type: 'ellipse', size: constant({ width: d, height: d }), style: { fill: fill(color) } } as SceneNode);

  // the face: a faint field, and the hour ticks in full dots (the quarters longer)
  const face = disc('face', R * 2, field(0.16, 0));
  const ticks: string[] = [];
  for (let k = 0; k < 12; k++) {
    const q = k % 3 === 0;
    const len = q ? 18 : 10;
    const ang = (k / 12) * Math.PI * 2;
    const rr = R - 8 - len / 2;
    const id = `tick${k}`;
    rect(`${id}-r`, 0, -rr, q ? 8 : 6, len, field(1, 0));
    ticks.push(add({ ...base(id, { outTick: END, x: CX, y: CY, rotation: constant({ x: 0, y: 0, z: (ang * 180) / Math.PI }) as never }), type: 'group', children: [`${id}-r`] } as SceneNode));
  }

  // the hands turn about the centre: a group at the centre holds each hand drawn upward
  const hand = (id: string, len: number, wdt: number, degPerTurn: number) => {
    rect(`${id}-r`, 0, -len / 2 + 6, wdt, len, field(1, 0), wdt / 2);
    const keys = Array.from({ length: TURNS + 1 }, (_, i) => [t(TURN * i), { x: 0, y: 0, z: degPerTurn * i }, 'linear']);
    return add({ ...base(id, { outTick: END, x: CX, y: CY, rotation: keyed(`${id}.r`, keys as never) as never }), type: 'group', children: [`${id}-r`] } as SceneNode);
  };
  const hourHand = hand('hour', 48, 10, 30);
  const minuteHand = hand('minute', 74, 7, 360);
  const hub = disc('hub', 14, field(1, 0));

  // each time the minute hand reaches the top, a ring goes out across the strip, lit. The hand is at
  // the top at 0, TURN, 2 TURN ...; the loop's start stands in for its end, so the seam is a ring too
  const rings: string[] = [];
  for (let i = 0; i < TURNS; i++) {
    const at = TURN * i;
    // a ring and a thinner echo just behind it, eased out so they linger on the strip
    [
      { id: `ring${i}`, lag: 0, w: 16, peak: 1 },
      { id: `echo${i}`, lag: 0.22, w: 8, peak: 0.7 },
    ].forEach(({ id, lag, w, peak }) => {
      const a0 = at + lag;
      rings.push(
        add({
          ...base(id, {
            outTick: END,
            x: CX,
            y: CY,
            scale: keyed(`${id}.s`, [...(a0 ? [[0, { x: 0.96, y: 0.96, z: 1 }, 'hold']] : []), [t(a0), { x: 0.96, y: 0.96, z: 1 }, OUT], [t(a0 + 2.6), { x: 2.5, y: 2.5, z: 1 }, 'hold']] as never) as never,
            opacity: keyed(`${id}.o`, [...(a0 ? [[0, 0, 'hold'], [t(a0) - 4, 0, 'linear']] : []), [t(a0), peak, { x1: 0.4, y1: 0, x2: 0.6, y2: 1 }], [t(a0 + 2.6), 0, 'hold']] as never) as never,
          }),
          type: 'ellipse',
          size: constant({ width: R * 2, height: R * 2 }),
          style: { stroke: stroke(field(1, 1), w) },
        } as SceneNode),
      );
    });
  }

  add({ ...base('src', { outTick: END }), type: 'group', children: [face, ...ticks, hourHand, minuteHand, hub, ...rings], isolation: true } as SceneNode);
  add({
    ...base('clock', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'src',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 7, value: keyed('clock.phase', [[0, 0, 'linear'], [END, Math.PI * 2]]) },
      { id: 'ink', name: 'ink', valueType: 'color', value: constant(ink) },
      { id: 'glint', name: 'glint', valueType: 'color', value: constant(glint) },
    ],
  } as SceneNode);

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-clock-mark-${dark ? 'dark' : 'light'}`,
    name: 'ContentOS clock, halftone',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['clock'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

const OUTDIR = 'public/scene/clock-mark';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/clock-mark', { recursive: true });
for (const dark of [false, true]) {
  const doc = build(dark);
  const name = dark ? 'dark' : 'light';
  writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
  writeFileSync(`animations/out/clock-mark/${name}.json`, JSON.stringify(doc));
  console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16));
}
