/**
 * The footer's wordmark (SiteFooter): ContentOS across the full width of the page, set in Geist like
 * the nav's wordmark (heavier, so every stroke is several planes thick), and drawn as a field of the brand's own paper plane, one plane per cell.
 *
 * Art direction
 *   mode      one object: the name, at full width, nothing else in the frame
 *   verb      take off: at rest every plane points where the mark points; a wave crosses the name and
 *             each plane loops the loop as it passes, catching the mark's own colours; on a desktop the
 *             planes near the cursor turn to fly away from it and grow
 *   geometry  the mark simplified to its three pieces (top wing, lower wing, tail), on a square grid;
 *             a cell on a letter's edge carries a smaller plane, so the letters keep their shape
 *   palette   ink at rest (pale on dark), the top wing full, the lower wing and tail lighter, like a
 *             fold; lit, the mark's blue, red and lilac
 *   scale     1440 x 248: the name spans 94 % of the width; phones get 390 x 72 with a finer grid
 *
 *   pnpm tsx animations/plane-wordmark.ts   (writes public/scene/plane-wordmark/{light,dark}[-narrow].json)
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

const LOOP = 7; // seconds: one wave across the name, then a rest
const END = t(LOOP);
// Geist 760 sets "ContentOS" 5.393 em wide; its ink runs from 0.273 em to 1.013 em below the line top
const EM_W = 5.393;
const INK_TOP = 0.273;
const INK_H = 0.74;
const INK_LEFT = 0.04; // the C's side bearing, in em

const SKSL = (W: number, H: number, CELL: number) => `
uniform shader inputImage;
uniform float2 focus;
uniform float strength;
uniform float phase;
uniform half4 ink;
uniform half4 blue;
uniform half4 red;
uniform half4 lilac;
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

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float CELL = ${CELL.toFixed(2)};
  float2 cc = (floor(u / CELL) + 0.5) * CELL;

  // how much of the cell is letter: four taps of the set word (drawn in red)
  float h = CELL * 0.25;
  float cov = 0.0;
  for (int k = 0; k < 4; k++) {
    float2 o = float2((k == 0 || k == 2) ? -h : h, k < 2 ? -h : h);
    half4 tp = inputImage.eval((cc + o) * s);
    cov += tp.a;
  }
  cov *= 0.25;
  if (cov < 0.2) { return half4(0.0); }

  // the wave: a slanted front crossing left to right once per loop; each plane turns a full circle
  // as it passes and lights up in the mark's colours
  float front = mix(${(-0.3 * W).toFixed(1)}, ${(1.53 * W).toFixed(1)}, phase);
  float lp = clamp((front - cc.x - (cc.y - ${(H / 2).toFixed(1)}) * 0.35) / ${(0.195 * W).toFixed(1)}, 0.0, 1.0);
  float eased = lp * lp * (3.0 - 2.0 * lp);
  float turn = 6.2831853 * eased;
  float glint = sin(3.14159265 * lp);

  // the cursor: nearby planes turn to fly away from it and grow
  float2 away = cc - focus / s;
  float near = strength * exp(-dot(away, away) / ${((CELL * 16) ** 2).toFixed(1)});
  float rest = -0.588;
  float dA = atan(away.y, away.x) - rest;
  dA = dA - 6.2831853 * floor((dA + 3.14159265) / 6.2831853);
  float th = turn + near * dA;

  float size = (0.62 + 0.38 * smoothstep(0.2, 0.75, cov)) * (1.0 + 0.4 * near + 0.14 * glint);
  float R = CELL * 0.5 * size;
  float2 v = (u - cc) / R;
  float c0 = cos(th);
  float s0 = sin(th);
  v = float2(c0 * v.x + s0 * v.y, -s0 * v.x + c0 * v.y);

  // the mark, centred on its cell: top wing, lower wing, tail
  float dTop = sdTri(v, float2(0.93, -0.62), float2(-0.95, -0.18), float2(-0.2, 0.18));
  float dLow = sdTri(v, float2(0.93, -0.62), float2(-0.2, 0.18), float2(-0.05, 0.8));
  float dTail = sdTri(v, float2(-0.45, 0.1), float2(-0.52, 0.62), float2(-0.2, 0.46));
  float px = 1.0 / (s * R);
  float aTop = smoothstep(px, -px, dTop);
  float aLow = smoothstep(px, -px, dLow) * (1.0 - aTop);
  float aTail = smoothstep(px, -px, dTail) * (1.0 - aTop) * (1.0 - aLow);

  float lit = clamp(max(glint, near), 0.0, 1.0);
  half3 cTop = mix(ink.rgb, blue.rgb, lit);
  half3 cLow = mix(ink.rgb, red.rgb, lit);
  half3 cTail = mix(ink.rgb, lilac.rgb, lit);
  float fTop = ink.a;
  float fLow = ink.a * mix(0.66, 1.0, lit);
  float fTail = ink.a * mix(0.42, 1.0, lit);

  half3 rgb = cTop * aTop * fTop + cLow * aLow * fLow + cTail * aTail * fTail;
  float a = aTop * fTop + aLow * fLow + aTail * fTail;
  return half4(rgb, a);
}
`;

const hexC = (h: string, a = 1): Color => {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
};

const PALETTE = {
  light: { ink: hexC('#101114'), blue: hexC('#2F5BEA'), red: hexC('#F0503C'), lilac: hexC('#B49CEB') },
  dark: { ink: hexC('#EEF2F4', 0.92), blue: hexC('#6CC6EB'), red: hexC('#FF7A5C'), lilac: hexC('#C7B6F2') },
};

function build(dark: boolean, phone: boolean) {
  const W = phone ? 390 : 1440;
  const SIZE = (W * 0.94) / EM_W;
  const MARGIN = phone ? 6 : 26; // above the letters' ink, room for planes to grow
  const H = Math.round(MARGIN + SIZE * INK_H + (phone ? 6 : 30));
  const CELL = phone ? 4.6 : 11.5;
  const P = dark ? PALETTE.dark : PALETTE.light;
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);

  add({
    ...base('word', { outTick: END, x: W * 0.03 - SIZE * INK_LEFT, y: MARGIN - SIZE * INK_TOP }),
    type: 'text',
    runs: constant([{ text: 'ContentOS', fontFamily: 'Geist', fontSize: SIZE, fontWeight: 760, letterSpacing: -SIZE / 30, lineHeight: SIZE, color: { r: 1, g: 0, b: 0, a: 1 } }]),
    box: { width: W * 1.1, height: SIZE * 1.2 },
    wrap: 'none',
    align: 'left',
    verticalAlign: 'top',
  } as SceneNode);
  add({
    ...base('planes', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'word',
    implementation: SKSL(W, H, CELL),
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'focus', name: 'focus', valueType: 'point', minimum: { x: -400, y: -400 }, maximum: { x: 1840, y: 700 }, value: constant({ x: W / 2, y: H / 2 }) },
      { id: 'strength', name: 'strength', valueType: 'number', minimum: 0, maximum: 1, value: constant(0) },
      { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 1, value: keyed('planes.phase', [[0, 0, 'linear'], [END, 1]]) },
      { id: 'ink', name: 'ink', valueType: 'color', value: constant(P.ink) },
      { id: 'blue', name: 'blue', valueType: 'color', value: constant(P.blue) },
      { id: 'red', name: 'red', valueType: 'color', value: constant(P.red) },
      { id: 'lilac', name: 'lilac', valueType: 'color', value: constant(P.lilac) },
    ],
  } as SceneNode);

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-plane-wordmark-${dark ? 'dark' : 'light'}${phone ? '-narrow' : ''}`,
    name: 'ContentOS wordmark in paper planes',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['planes'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);

  // the cursor: the planes' focus tracks it closely; the reaction opens as it arrives and settles
  // back when it leaves, so the planes return to the mark's heading
  const final = withInteraction(doc as never, [
    {
      id: 'planes-focus',
      target: { kind: 'effect-parameter', nodeId: 'planes', parameterId: 'focus' },
      blend: 'set',
      steps: [
        { id: 'ptr', op: 'pointer', space: 'composition' },
        { id: 'ease', op: 'damp', halfLife: 0.07 },
      ],
    },
    {
      id: 'planes-strength',
      target: { kind: 'effect-parameter', nodeId: 'planes', parameterId: 'strength' },
      blend: 'set',
      steps: [
        { id: 'in', op: 'pointer-state', field: 'inside' },
        { id: 'on', op: 'constant', value: 1 },
        { id: 'off', op: 'constant', value: 0 },
        { id: 'pick', op: 'select', inputs: ['in', 'on', 'off'] },
        { id: 'ease', op: 'damp', halfLife: 0.16 },
      ],
    },
  ] as never);
  assertValidAnimationDocument(final);
  const diags = validateAnimationDocument(final).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return { doc: final, W, H };
}

const pub = 'public/scene/plane-wordmark';
const out = 'animations/out/plane-wordmark';
for (const dir of [pub, out]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
for (const dark of [false, true]) {
  for (const phone of [false, true]) {
    const { doc, W, H } = build(dark, phone);
    const file = `${dark ? 'dark' : 'light'}${phone ? '-narrow' : ''}.json`;
    writeFileSync(`${pub}/${file}`, JSON.stringify(doc));
    writeFileSync(`${out}/${file}`, JSON.stringify(doc));
    console.log('wrote', file, `${W}x${H}`, (doc as { revision: string }).revision.slice(0, 16));
  }
}
