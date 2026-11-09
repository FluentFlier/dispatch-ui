/**
 * Act 3's mark: a conversation starting, in the same halftone as Act 1's plane and Act 2's crowd.
 *
 * Art direction
 *   mode      two speech bubbles, no text: one types and says something, the other answers
 *   verb      reply: three dots pulse, settle into a message, then an answer arrives in cobalt
 *             (the way Hannah's reply lands at the end of the timeline beside it)
 *   geometry  a square dot grid; dot size is presence, so the bubbles are faint fields and the
 *             message lines inside them are full dots
 *   palette   ink dots, faint (pale on dark); the answer cobalt / sea cyan
 *   scale     520 x 360, under the section's sentence on desktop
 *
 *   pnpm tsx animations/talk-mark.ts   (writes public/scene/talk-mark/{light,dark}.json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  keyed,
  parseSvgPath,
  stroke,
  trim,
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, INOUT, OUT, TPS, fade, t, type K } from './lib/kit';

const W = 520;
const H = 360;
const END = t(10.6);
const TYPING = [0.5, 3.0] as const;
const SAID = 3.1;
const ANSWER = 4.6;
const RESET = [9.4, 9.9] as const;

const SKSL = `
uniform shader inputImage;
uniform float phase;
uniform half4 ink;
uniform half4 glint;
uniform float2 renderScale;

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float CELL = 8.0;
  float2 cell = floor(u / CELL);
  float2 cc = (cell + 0.5) * CELL;
  // drawn opaque, one meaning per channel: red is presence, blue is the answer
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
  a *= 0.25;
  float wv = sin(dot(cc, float2(0.009, -0.006)) - phase);
  float crest = smoothstep(0.6, 1.0, wv);
  float r = CELL * 0.5 * sqrt(a) * (0.84 + 0.26 * crest);
  float d = length(u - cc);
  float cov = 1.0 - smoothstep(r - 0.6, r + 0.5, d);
  float strength = mix(ink.a, glint.a, lit);
  half3 col = mix(ink.rgb, glint.rgb, lit);
  return half4(col * strength * cov, strength * cov);
}
`;

function build(dark: boolean) {
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
  const ink: Color = dark ? hexA('#E4ECF0', 0.2) : hexA('#101114', 0.22);
  const glint: Color = dark ? hexA('#6CC6EB', 0.75) : hexA('#2F5BEA', 0.7);
  // presence in red, the answer in blue
  const field = (r: number, b: number): Color => ({ r, g: 0, b, a: 1 });

  const shape = (id: string, d: string, color: Color) =>
    add({
      ...base(id, { outTick: END }),
      type: 'path',
      path: constant(parseSvgPath(d).path),
      style: { fill: { color: constant(color), opacity: constant(1) } },
    } as SceneNode);
  const bar = (id: string, x0: number, x1: number, y: number, color: Color, at: number) =>
    add({
      ...base(id, { outTick: END }),
      type: 'path',
      path: constant(parseSvgPath(`M${x0} ${y} L${x1} ${y}`).path),
      style: { stroke: stroke(color, 16) },
      operators: [trim(`${id}.trim`, { start: constant(0), end: keyed(`${id}.te`, [[0, 0, 'hold'], [t(at), 0, OUT], [t(at + 0.5), 1, 'hold']] as never) })],
    } as SceneNode);
  const group = (id: string, children: string[], o: { opacity?: K[]; scale?: K<{ x: number; y: number; z: number }>[]; x?: number; y?: number } = {}) =>
    add({
      ...base(id, {
        outTick: END,
        x: o.x ?? 0,
        y: o.y ?? 0,
        opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined,
        scale: o.scale ? (keyed(`${id}.s`, o.scale as never) as never) : undefined,
      }),
      type: 'group',
      children,
      isolation: true,
    } as SceneNode);
  const rr = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y} L${x + w - r} ${y} C${x + w - r * 0.45} ${y} ${x + w} ${y + r * 0.45} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h - r * 0.45} ${x + w - r * 0.45} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x + r * 0.45} ${y + h} ${x} ${y + h - r * 0.45} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y + r * 0.45} ${x + r * 0.45} ${y} ${x + r} ${y} Z`;

  // ------------------------------------------------------------------ the first bubble
  const A = { x: 16, y: 24, w: 330, h: 150 };
  const aKids = [
    shape('a-body', rr(A.x, A.y, A.w, A.h, 38), field(0.2, 0)),
    shape('a-tail', `M${A.x + 40} ${A.y + A.h - 8} C${A.x + 34} ${A.y + A.h + 22} ${A.x + 16} ${A.y + A.h + 36} ${A.x + 2} ${A.y + A.h + 42} C${A.x + 40} ${A.y + A.h + 42} ${A.x + 74} ${A.y + A.h + 26} ${A.x + 90} ${A.y + A.h - 6} Z`, field(0.2, 0)),
  ];
  // typing: three dots pulse in turn, then give way to the message
  const dotY = A.y + A.h / 2;
  [0, 1, 2].forEach((n) => {
    const cx = A.x + 115 + n * 50;
    const pulse: K<{ x: number; y: number; z: number }>[] = [[0, { x: 0.7, y: 0.7, z: 1 }, 'hold']];
    for (let c = 0; c < 3; c++) {
      const s0 = TYPING[0] + c * 0.84 + n * 0.16;
      pulse.push([t(s0), { x: 0.7, y: 0.7, z: 1 }, INOUT], [t(s0 + 0.32), { x: 1.05, y: 1.05, z: 1 }, INOUT], [t(s0 + 0.64), { x: 0.7, y: 0.7, z: 1 }, 'hold']);
    }
    aKids.push(add({
      ...base(`dot${n}`, {
        outTick: END,
        x: cx,
        y: dotY,
        scale: keyed(`dot${n}.s`, pulse as never) as never,
        opacity: keyed(`dot${n}.o`, fade(0, [t(TYPING[0] - 0.2), t(TYPING[0]), 1], [t(TYPING[1]), t(SAID), 0]) as never) as never,
      }),
      type: 'ellipse',
      size: constant({ width: 34, height: 34 }),
      style: { fill: { color: constant(field(1, 0)), opacity: constant(1) } },
    } as SceneNode));
  });
  // said: the message, as lines of full dots
  aKids.push(bar('a-l0', A.x + 46, A.x + A.w - 46, A.y + 50, field(1, 0), SAID));
  aKids.push(bar('a-l1', A.x + 46, A.x + A.w - 96, A.y + 80, field(1, 0), SAID + 0.15));
  aKids.push(bar('a-l2', A.x + 46, A.x + 150, A.y + 110, field(1, 0), SAID + 0.3));
  group('a', aKids, { opacity: fade(0, [t(0.1), t(0.5), 1], [t(RESET[0]), t(RESET[0] + 0.45), 0]) });

  // ------------------------------------------------------------------ the answer
  const B = { x: 192, y: 210, w: 300, h: 112 };
  const bKids = [
    shape('b-body', rr(B.x, B.y, B.w, B.h, 34), field(0.24, 1)),
    shape('b-tail', `M${B.x + B.w - 42} ${B.y + B.h - 8} C${B.x + B.w - 36} ${B.y + B.h + 18} ${B.x + B.w - 18} ${B.y + B.h + 30} ${B.x + B.w - 2} ${B.y + B.h + 36} C${B.x + B.w - 40} ${B.y + B.h + 36} ${B.x + B.w - 74} ${B.y + B.h + 22} ${B.x + B.w - 90} ${B.y + B.h - 6} Z`, field(0.24, 1)),
    bar('b-l0', B.x + 42, B.x + B.w - 42, B.y + 42, field(1, 1), ANSWER + 0.35),
    bar('b-l1', B.x + 42, B.x + 170, B.y + 72, field(1, 1), ANSWER + 0.5),
  ];
  // it pops in from its tail: the inner group puts the tail's tip at the origin, the outer one
  // sits there and scales
  const tip = { x: B.x + B.w, y: B.y + B.h + 36 };
  group('b-inner', bKids, { x: -tip.x, y: -tip.y });
  group('b', ['b-inner'], {
    x: tip.x,
    y: tip.y,
    scale: [[0, { x: 0.86, y: 0.86, z: 1 }, 'hold'], [t(ANSWER), { x: 0.86, y: 0.86, z: 1 }, OUT], [t(ANSWER + 0.5), { x: 1, y: 1, z: 1 }, 'hold']],
    opacity: fade(0, [t(ANSWER), t(ANSWER + 0.3), 1], [t(RESET[0]), t(RESET[0] + 0.45), 0]),
  });
  group('src', ['a', 'b']);

  add({
    ...base('talk', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'src',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 7, value: keyed('talk.phase', [[0, 0, 'linear'], [END, Math.PI * 2]]) },
      { id: 'ink', name: 'ink', valueType: 'color', value: constant(ink) },
      { id: 'glint', name: 'glint', valueType: 'color', value: constant(glint) },
    ],
  } as SceneNode);

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-talk-mark-${dark ? 'dark' : 'light'}`,
    name: 'ContentOS conversation, halftone',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['talk'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

function hexA(h: string, a: number): Color {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}

const OUTDIR = 'public/scene/talk-mark';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/talk-mark', { recursive: true });
for (const dark of [false, true]) {
  const doc = build(dark);
  const name = dark ? 'dark' : 'light';
  writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
  writeFileSync(`animations/out/talk-mark/${name}.json`, JSON.stringify(doc));
  console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16));
}
