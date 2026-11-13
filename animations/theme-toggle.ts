/**
 * ContentOS theme toggle.
 *
 * Art direction
 *   verb      slide and reform (the thumb crosses the trough; its cells scatter and settle)
 *   geometry  a recessed rounded trough, a rounded-square plastic thumb, square cells
 *             (the same cell the ContentOS mark is drawn from)
 *   palette   day: warm grey trough, ivory thumb, charcoal cells, amber rim
 *             night: near-black trough, graphite thumb, ivory cells, periwinkle rim
 *   scale     152 x 80 units, shown at 76 x 40 CSS px in the nav
 *   words     none
 *
 * States: `day` and `night`, entered through `toNight` / `toDay` segments when the
 * boolean input `dark` changes. Reversing mid-segment plays it backwards.
 *
 *   pnpm tsx animations/theme-toggle.ts
 *   pnpm clayzo package animations/out/theme-toggle.json public/scene/theme-toggle.clayzo
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  hex,
  keyed,
  marker,
  stateMachine,
  stroke,
  validateAnimationDocument,
  withComputedRevision,
  withStateMachine,
  type Color,
  type SceneNode,
  type Vec2,
} from '@clayzo/animation/authoring';

const W = 152;
const H = 80;
const TPS = 240;
const FPS = 60;
const F = TPS / FPS;
const snap = (t: number) => Math.round(t / F) * F;
const sec = (s: number) => snap(s * TPS);

const D = sec(0.86);
const END = 2 * D + F;

const SLIDE = { x1: 0.3, y1: 1.18, x2: 0.4, y2: 1 }; // a little overshoot
const OUT = { x1: 0.16, y1: 1, x2: 0.3, y2: 1 };
const INOUT = { x1: 0.65, y1: 0, x2: 0.35, y2: 1 };

const DAY_X = 112;
const NIGHT_X = 40;
const CY = 40;

const c = (h: string) => hex(h);
const PAL = {
  day: {
    trough: c('#E3E1DB'),
    thumb: c('#FAF9F6'),
    cell: c('#2A2A2F'),
    rim: c('#FFB23E'),
    edge: c('#FFFFFF'),
  },
  night: {
    trough: c('#0A1115'),
    thumb: c('#222B31'),
    cell: c('#EEE8DA'),
    rim: c('#6CC6EB'),
    edge: c('#26313A'),
  },
};

/** A track that goes day -> night over [0, D] and back over [D, 2D]. */
function swing<T>(id: string, day: T, night: T, ease: object | 'linear' = INOUT, a = 0, b = 1) {
  const t0 = snap(D * a);
  const t1 = snap(D * b);
  return keyed<T>(id, [
    [0, day, 'hold'],
    [t0, day, ease as never],
    [t1, night, 'hold'],
    [D, night, 'hold'],
    [D + t0, night, ease as never],
    [D + t1, day, 'hold'],
    [END, day],
  ]);
}

// ---------------------------------------------------------------------------
// Cell icons, in cell units around the thumb centre
// ---------------------------------------------------------------------------
type P = [number, number];
const sun: P[] = [];
for (let y = -3; y <= 3; y += 1) for (let x = -3; x <= 3; x += 1) if (x * x + y * y <= 5.3) sun.push([x, y]);
for (const [x, y] of [[4, 0], [5, 0], [-4, 0], [-5, 0], [0, 4], [0, 5], [0, -4], [0, -5], [3, 3], [-3, 3], [3, -3], [-3, -3]] as P[]) sun.push([x, y]);

const moon: P[] = [];
for (let y = -5; y <= 5; y += 1)
  for (let x = -5; x <= 5; x += 1) {
    const inDisk = x * x + y * y <= 16.5;
    const cut = (x - 2) ** 2 + (y + 1.4) ** 2 <= 10.5;
    if (inDisk && !cut) moon.push([x - 0.5, y + 0.5]);
  }
for (const [x, y] of [[4, -4], [4, -5], [4, -3], [3, -4], [5, -4]] as P[]) moon.push([x, y]);

// pair cells by angle so each travels a short, readable path
const byAngle = (p: P) => Math.atan2(p[1], p[0]);
const S = [...sun].sort((a, b) => byAngle(a) - byAngle(b));
const M = [...moon].sort((a, b) => byAngle(a) - byAngle(b));
const n = Math.max(S.length, M.length);
const pick = (list: P[], i: number) => list[Math.floor((i * list.length) / n)];

const UNIT = 3.5;
const CELL = 2.9;
let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const nodes: Record<string, SceneNode> = {};
const cellIds: string[] = [];
for (let i = 0; i < n; i += 1) {
  const s = pick(S, i);
  const m = pick(M, i);
  const sx = s[0] * UNIT;
  const sy = s[1] * UNIT;
  const mx = m[0] * UNIT;
  const my = m[1] * UNIT;
  const ang = rand() * Math.PI * 2;
  const kick = 5 + rand() * 9;
  const mid = (ax: number, ay: number, bx: number, by: number) => ({
    x: (ax + bx) / 2 + Math.cos(ang) * kick,
    y: (ay + by) / 2 + Math.sin(ang) * kick,
    z: 0,
  });
  const lag = snap(D * (0.04 + rand() * 0.16));
  const p = (x: number, y: number) => ({ x, y, z: 0 });
  const id = `cell-${i}`;
  nodes[id] = {
    ...base(id, {
      outTick: END,
      position: keyed(`${id}.pos`, [
        [0, p(sx, sy), 'hold'],
        [lag, p(sx, sy), OUT],
        [lag + snap(D * 0.32), mid(sx, sy, mx, my), INOUT],
        [lag + snap(D * 0.72), p(mx, my), 'hold'],
        [D + lag, p(mx, my), OUT],
        [D + lag + snap(D * 0.32), mid(mx, my, sx, sy), INOUT],
        [D + lag + snap(D * 0.72), p(sx, sy), 'hold'],
        [END, p(sx, sy)],
      ]),
    }),
    type: 'rect',
    size: constant({ width: CELL, height: CELL }),
    cornerRadius: constant(0.7),
    style: {
      fill: {
        color: swing<Color>(`${id}.col`, PAL.day.cell, PAL.night.cell, INOUT, 0.25, 0.7),
        opacity: constant(1),
      },
    },
  } as SceneNode;
  cellIds.push(id);
}

// ---------------------------------------------------------------------------
// Trough, glow, thumb, rim
// ---------------------------------------------------------------------------
const grad = (top: Color, bot: Color) => [
  { position: 0, color: top },
  { position: 1, color: bot },
];

const shade = (id: string, w: number, h: number, r: number, top: Color, bottom: Color, opacity: ReturnType<typeof keyed<number>> | ReturnType<typeof constant<number>>): SceneNode =>
  ({
    ...base(id, { outTick: END }),
    type: 'rect',
    size: constant({ width: w, height: h }),
    cornerRadius: constant(r),
    style: {
      gradientFill: {
        kind: 'linear',
        stops: constant(grad(top, bottom)),
        start: constant({ x: 0, y: -h / 2 } as Vec2),
        end: constant({ x: 0, y: h / 2 } as Vec2),
        opacity,
      },
    },
  }) as SceneNode;

nodes['trough-base'] = {
  ...base('trough-base', { outTick: END }),
  type: 'rect',
  size: constant({ width: W - 4, height: H - 4 }),
  cornerRadius: constant(26),
  style: {
    fill: { color: swing<Color>('trough.col', PAL.day.trough, PAL.night.trough, INOUT, 0.15, 0.85), opacity: constant(1) },
    stroke: stroke(swing<Color>('trough.edge', PAL.day.edge, PAL.night.edge, INOUT, 0.15, 0.85), 1.2, { opacity: 0.8 }),
  },
} as SceneNode;
// inset: darker toward the top edge, in both themes
nodes['trough-shade'] = shade('trough-shade', W - 4, H - 4, 26, hex('#000000'), { r: 0, g: 0, b: 0, a: 0 } as Color, constant(0.16));
nodes.trough = {
  ...base('trough', { outTick: END, x: W / 2, y: CY }),
  type: 'group',
  children: ['trough-base', 'trough-shade'],
} as SceneNode;

const thumbX = keyed<{ x: number; y: number; z: number }>('thumb.x', [
  [0, { x: DAY_X, y: CY, z: 0 }, 'hold'],
  [snap(D * 0.02), { x: DAY_X, y: CY, z: 0 }, SLIDE],
  [snap(D * 0.8), { x: NIGHT_X, y: CY, z: 0 }, 'hold'],
  [D, { x: NIGHT_X, y: CY, z: 0 }, 'hold'],
  [D + snap(D * 0.02), { x: NIGHT_X, y: CY, z: 0 }, SLIDE],
  [D + snap(D * 0.8), { x: DAY_X, y: CY, z: 0 }, 'hold'],
  [END, { x: DAY_X, y: CY, z: 0 }],
]);

// rim glow: concentric soft strokes (no blur layer, so nothing beneath gets cut out)
const glowIds: string[] = [];
[
  [71, 23, 5, 0.1],
  [69, 22, 4, 0.16],
  [66.5, 21, 3, 0.26],
].forEach(([size, r, w, op], i) => {
  const id = `glow-${i}`;
  nodes[id] = {
    ...base(id, { outTick: END }),
    type: 'rect',
    size: constant({ width: size, height: size }),
    cornerRadius: constant(r),
    style: { stroke: stroke(swing<Color>(`${id}.col`, PAL.day.rim, PAL.night.rim, INOUT, 0.3, 0.75), w, { opacity: op }) },
  } as SceneNode;
  glowIds.push(id);
});

nodes['thumb-face'] = {
  ...base('thumb-face', { outTick: END }),
  type: 'rect',
  size: constant({ width: 64, height: 64 }),
  cornerRadius: constant(20),
  style: { fill: { color: swing<Color>('thumb.col', PAL.day.thumb, PAL.night.thumb, INOUT, 0.2, 0.8), opacity: constant(1) } },
} as SceneNode;
// plastic sheen: light from above
nodes['thumb-sheen'] = shade(
  'thumb-sheen',
  62,
  62,
  19,
  hex('#FFFFFF'),
  { r: 1, g: 1, b: 1, a: 0 } as Color,
  swing<number>('sheen.op', 0.55, 0.16, INOUT, 0.2, 0.8),
);
nodes['thumb-under'] = shade('thumb-under', 64, 64, 20, { r: 0, g: 0, b: 0, a: 0 } as Color, hex('#000000'), constant(0.1));
nodes['thumb-rim'] = {
  ...base('thumb-rim', { outTick: END }),
  type: 'rect',
  size: constant({ width: 63, height: 63 }),
  cornerRadius: constant(19.5),
  style: {
    stroke: stroke(swing<Color>('rim.col', PAL.day.rim, PAL.night.rim, INOUT, 0.3, 0.75), 1.6, {
      opacity: keyed('rim.op', [
        [0, 0.9, INOUT],
        [snap(D * 0.45), 1, INOUT],
        [D, 0.9, INOUT],
        [D + snap(D * 0.45), 1, INOUT],
        [END, 0.9],
      ]),
    }),
  },
} as SceneNode;
nodes.icon = {
  ...base('icon', { outTick: END }),
  type: 'group',
  children: cellIds,
} as SceneNode;
nodes.thumb = {
  ...base('thumb', { outTick: END, position: thumbX }),
  type: 'group',
  children: [...glowIds, 'thumb-face', 'thumb-under', 'thumb-sheen', 'thumb-rim', 'icon'],
} as SceneNode;

const scene = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-theme-toggle',
  name: 'ContentOS theme toggle',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: hex('#00000000') },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
  assets: {},
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['trough', 'thumb'] } },
  markers: [
    marker('day', 0),
    marker('toNight', 0, { durationTicks: D }),
    marker('night', D),
    marker('toDay', D, { durationTicks: D }),
    marker('dayEnd', 2 * D),
  ],
  design: { tokens: { looping: false } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
});

const machine = stateMachine({ initial: 'day' })
  .state('day', { marker: 'day', playback: 'once' })
  .state('night', { marker: 'night', playback: 'once' })
  .when('day', 'night', { input: 'dark', operator: 'eq', value: true }, { viaMarker: 'toNight' } as never)
  .when('night', 'day', { input: 'dark', operator: 'eq', value: false }, { viaMarker: 'toDay' } as never);

const document = withStateMachine(scene, machine, { inputs: { dark: 'boolean' } });

assertValidAnimationDocument(document);
const diags = validateAnimationDocument(document).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 800));
mkdirSync('animations/out', { recursive: true });
writeFileSync('animations/out/theme-toggle.json', JSON.stringify(document));
console.log('wrote animations/out/theme-toggle.json', document.revision, n, 'cells');
