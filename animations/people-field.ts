/**
 * Act 2's background: your audience as a halftone crowd, and the buyers in it.
 *
 * Art direction
 *   mode      a crowd of people (head and shoulders), three rows deep, in the same dot language
 *             as Act 1's plane
 *   verb      pick out: a slow band of light passes over everyone; one at a time a few people
 *             turn cobalt (the colour the matched words take in the window below), then settle
 *   geometry  a square dot grid; dot size is presence, so the back rows are fainter and every
 *             person is shaded top to bottom; a thin gap keeps each silhouette its own
 *   palette   ink dots, faint (pale on dark); the picked ones cobalt / sea cyan, near full
 *   scale     1000 x 700 beside the desktop heading; 390 x 190 as a strip above it on phones
 *
 *   pnpm tsx animations/people-field.ts   (writes public/scene/people-field/*.json)
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
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, OUT, TPS, t, type K } from './lib/kit';

const END = t(12);
// the marker colour the shader reads as empty: each person's halo is drawn in it, so whoever
// stands in front cuts a clean gap out of whoever stands behind
const GAP: Color = { r: 0, g: 1, b: 0, a: 1 };

type Person = { x: number; by: number; h: number; tone: number };
type RowSpec = { n: number; x0: number; step: number; h: number; by: number; tone: number };
// a crowd, not a grid: three loose rows, each person a little off the line and their own size
function crowd(rows: RowSpec[], jitter: number): Person[][] {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return rows.map((r) =>
    Array.from({ length: r.n }, (_, i) => ({
      x: r.x0 + i * r.step + (rnd() - 0.5) * r.step * 0.34,
      by: r.by + (rnd() - 0.5) * jitter,
      h: r.h * (0.9 + rnd() * 0.18),
      tone: r.tone * (0.88 + rnd() * 0.12),
    })),
  );
}
// wide: the field beside the desktop heading; narrow: a strip above the heading on phones
function layout(narrow: boolean) {
  return narrow
    ? {
        // two rows fit a strip this shallow; three hid the buyers behind each other
        W: 390, H: 190, cell: 5.4, gap: 4, edgeX: 38, edgeY: 16,
        rows: crowd([
          { n: 5, x0: 38, step: 78, h: 80, by: 98, tone: 0.5 },
          { n: 4, x0: 52, step: 96, h: 116, by: 190, tone: 1 },
        ], 8),
        buyers: [[1, 1], [0, 3], [1, 2]] as [number, number][],
      }
    : {
        W: 1000, H: 700, cell: 9, gap: 7, edgeX: 110, edgeY: 70,
        rows: crowd([
          { n: 6, x0: 95, step: 168, h: 158, by: 292, tone: 0.42 },
          { n: 6, x0: 30, step: 182, h: 206, by: 470, tone: 0.68 },
          { n: 5, x0: 120, step: 205, h: 262, by: 700, tone: 1 },
        ], 22),
        buyers: [[2, 1], [1, 4], [0, 2]] as [number, number][],
      };
}

const sksl = (L: ReturnType<typeof layout>) => `
uniform shader inputImage;
uniform float phase;
uniform half4 ink;
uniform half4 glint;
uniform float2 renderScale;

float gapOf(half4 c) { return step(0.5, c.a) * step(0.5, c.g); }

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  float CELL = ${L.cell.toFixed(2)};
  float2 cell = floor(u / CELL);
  float2 cc = (cell + 0.5) * CELL;
  // the source is drawn opaque, one meaning per channel: red is presence (the shading), blue is
  // how lit a buyer is, green marks the gap around each person
  half4 mid = unpremul(inputImage.eval(cc * s));
  if (mid.a < 0.02 || gapOf(mid) > 0.5) { return half4(0.0); }
  float h = CELL * 0.25;
  float a = 0.0;
  float w = 0.0;
  float litSum = 0.0;
  for (int k = 0; k < 4; k++) {
    float2 o = float2((k == 0 || k == 2) ? -h : h, k < 2 ? -h : h);
    half4 tp = unpremul(inputImage.eval((cc + o) * s));
    float keep = (1.0 - gapOf(tp)) * tp.a;
    w += keep;
    a += tp.r * keep;
    litSum += tp.b * keep;
  }
  float lit = clamp(litSum / max(w, 0.0001), 0.0, 1.0);
  a *= 0.25;
  // a slow band of light across the crowd
  float wv = sin(dot(cc, float2(0.006, -0.0042)) - phase);
  float crest = smoothstep(0.6, 1.0, wv);
  float r = CELL * 0.5 * sqrt(a) * (0.82 + 0.3 * crest);
  float d = length(u - cc);
  float cov = 1.0 - smoothstep(r - 0.6, r + 0.5, d);
  float edge = smoothstep(0.0, ${L.edgeX.toFixed(1)}, u.x) * smoothstep(${L.W.toFixed(1)}, ${(L.W - L.edgeX).toFixed(1)}, u.x) * smoothstep(0.0, ${L.edgeY.toFixed(1)}, u.y);
  float strength = mix(ink.a, glint.a, lit) * edge;
  half3 col = mix(ink.rgb, glint.rgb, lit);
  return half4(col * strength * cov, strength * cov);
}
`;

function build(dark: boolean, narrow: boolean) {
  const L = layout(narrow);
  const { W, H } = L;
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
  const ink: Color = dark ? hexA('#E4ECF0', 0.17) : hexA('#101114', 0.19);
  const glint: Color = dark ? hexA('#6CC6EB', 0.95) : hexA('#2F5BEA', 0.92);
  // what each figure carries in blue: 0 for anyone, 1 for a lit buyer (the shader adds the colour)
  const inkRgb: Color = { r: 0, g: 0, b: 0, a: 1 };
  const glintRgb: Color = { r: 0, g: 0, b: 1, a: 1 };

  // a person: shoulders as a dome, a head above; shaded from full at the top to half below
  const shoulders = (h: number) =>
    `M${-0.46 * h} 0 C${-0.46 * h} ${-0.2 * h} ${-0.34 * h} ${-0.4 * h} 0 ${-0.42 * h} C${0.34 * h} ${-0.4 * h} ${0.46 * h} ${-0.2 * h} ${0.46 * h} 0 Z`;
  const shade = (key: string, c: Color, tone: number, y0: number, y1: number, opacity?: K[]) => ({
    gradientFill: {
      kind: 'linear',
      stops: constant([
        { position: 0, color: { r: tone, g: 0, b: c.b, a: 1 } },
        { position: 1, color: { r: tone * 0.5, g: 0, b: c.b, a: 1 } },
      ]),
      start: constant({ x: 0, y: y0 }),
      end: constant({ x: 0, y: y1 }),
      opacity: opacity ? keyed(`${key}.go`, opacity as never) : constant(1),
    },
  });
  const person = (id: string, x: number, by: number, h: number, c: Color, tone: number, opacity?: K[]) => {
    const hr = 0.17 * h;
    const hy = -0.64 * h;
    return [
      add({
        ...base(`${id}-b`, { outTick: END, x, y: by }),
        type: 'path',
        path: constant(parseSvgPath(shoulders(h)).path),
        style: shade(`${id}-b`, c, tone, -0.42 * h, 0, opacity),
      } as SceneNode),
      add({
        ...base(`${id}-h`, { outTick: END, x, y: by + hy }),
        type: 'ellipse',
        size: constant({ width: hr * 2, height: hr * 2 }),
        style: shade(`${id}-h`, c, tone, -hr, hr * 1.4, opacity),
      } as SceneNode),
    ];
  };
  const halo = (id: string, x: number, by: number, h: number) => {
    const gap = L.gap;
    const hr = 0.17 * h;
    return [
      add({
        ...base(`${id}-gb`, { outTick: END, x, y: by }),
        type: 'path',
        path: constant(parseSvgPath(shoulders(h)).path),
        style: { fill: { color: constant(GAP), opacity: constant(1) }, stroke: stroke(GAP, gap * 2) },
      } as SceneNode),
      add({
        ...base(`${id}-gh`, { outTick: END, x, y: by - 0.64 * h }),
        type: 'ellipse',
        size: constant({ width: (hr + gap) * 2, height: (hr + gap) * 2 }),
        style: { fill: { color: constant(GAP), opacity: constant(1) } },
      } as SceneNode),
    ];
  };

  const kids: string[] = [];
  L.rows.forEach((row, ri) => {
    row.forEach(({ x, by, h, tone }, pi) => {
      const id = `p${ri}-${pi}`;
      kids.push(...halo(id, x, by, h));
      const b = L.buyers.findIndex(([r, i]) => r === ri && i === pi);
      const a = 1 + b * 3.6;
      // a buyer's lit self is drawn opaque over them and faded in and out
      kids.push(...person(id, x, by, h, inkRgb, tone));
      if (b >= 0) {
        kids.push(...person(`${id}-lit`, x, by, h, glintRgb, tone, [
          [0, 0, 'hold'],
          [t(a), 0, OUT],
          [t(a + 0.6), 1, 'hold'],
          [t(a + 2.6), 1, OUT],
          [t(a + 3.4), 0, 'hold'],
        ]));
      }
    });
  });
  add({ ...base('crowd-src', { outTick: END }), type: 'group', children: kids, isolation: true } as SceneNode);
  add({
    ...base('crowd', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'crowd-src',
    implementation: sksl(L),
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 7, value: keyed('crowd.phase', [[0, 0, 'linear'], [END, Math.PI * 2]]) },
      { id: 'ink', name: 'ink', valueType: 'color', value: constant(ink) },
      { id: 'glint', name: 'glint', valueType: 'color', value: constant(glint) },
    ],
  } as SceneNode);

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-people-field-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: 'ContentOS audience, halftone people',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['crowd'] } },
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

const OUTDIR = 'public/scene/people-field';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/people-field', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/people-field/${name}.json`, JSON.stringify(doc));
    console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16));
  }
}
