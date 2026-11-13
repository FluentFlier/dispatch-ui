/**
 * The hero demo's step switch: Write, Publish, Reply and Leads as one control, made the way the theme
 * toggle is made (animations/theme-toggle.ts) rather than looking like it. The toggle's idea is that
 * its icon is built from square cells, the same cell the ContentOS mark is drawn from, and the cells
 * scatter and re-form as the thumb crosses. Here the thumb carries the step's glyph in those cells:
 * a pen, the paper plane, a speech bubble, a person. Moving to another step, they come apart and
 * settle into the next one. While a step plays, its glyph fills in cell by cell, which is the
 * progress: no bar, no rim, no glow.
 *
 * Art direction
 *   verb      reform and fill
 *   geometry  a quiet recessed trough, a plastic thumb a quarter of it wide, a 9 x 9 cell glyph at the
 *             thumb's left; the label (DOM) sits beside it
 *   palette   day: warm grey trough, ivory thumb, charcoal cells. night: near-black trough, graphite
 *             thumb, ivory cells (the toggle's own)
 *   scale     wide 520 x 50, centred under the app window; narrow 360 x 46 for phones
 *
 * Inputs: `pos` (0 to 3) scrubs the timeline, whose three segments slide the thumb and re-form the
 * glyph from one step to the next (StepSwitch eases it on every change, so a click lands too);
 * `progress` (0 to 1) fills the current glyph's cells in turn.
 *
 *   pnpm tsx animations/step-switch.ts   (writes public/scene/step-switch/{light,dark}[-narrow].json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  hex,
  keyed,
  stateMachine,
  stroke,
  validateAnimationDocument,
  withComputedRevision,
  withInteraction,
  withStateMachine,
  type Color,
  type SceneNode,
  type Vec2,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';

const S = t(1); // one segment: step k to step k + 1
const END = 3 * S;
const LAST = END + 4; // one frame past the last key, so step 3 is drawn
const INOUT = { x1: 0.65, y1: 0, x2: 0.35, y2: 1 };
const OUT = { x1: 0.16, y1: 1, x2: 0.3, y2: 1 };

const PAL = {
  // day is the light page's own ivory (#FAF9F6), the way night is the dark page's near-black: the panel
  // reads as the site, not as grey, and the thumb is lifted off it by its edge and shadow
  day: { trough: hex('#FAF9F6'), edge: hex('#FFFFFF'), thumb: hex('#FFFFFF'), cell: hex('#1E1F24'), ring: hexA('#101114', 0.1) },
  night: { trough: hex('#0A1115'), edge: hex('#26313A'), thumb: hex('#222B31'), cell: hex('#EEE8DA'), ring: hexA('#FFFFFF', 0.07) },
};

export const LAYOUT = {
  wide: { W: 520, H: 50, pad: 5, troughR: 18, thumbR: 13, unit: 2.7, cell: 2.2, inset: 12, gap: 9 },
  narrow: { W: 360, H: 46, pad: 5, troughR: 16, thumbR: 12, unit: 2.3, cell: 1.9, inset: 8, gap: 6 },
};

// ------------------------------------------------------------------ glyphs, 9 x 9 cells round 0
type P = [number, number];
const draw = (rows: string[]) =>
  rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === '#' ? [[x - 4, y - 4] as P] : [])));
// write: a pencil on the diagonal
const pen = draw(['.......##', '......###', '.....###.', '....###..', '...###...', '..###....', '.##......', '##.......', '#........']);
// publish: a send arrow, notched like a paper plane
const plane = draw(['##.......', '####.....', '.#####...', '..######.', '...######', '..######.', '.#####...', '####.....', '##.......']);
// reply: a speech bubble with the three typing dots
const bubble = draw(['.........', '.#######.', '#.......#', '#.#.#.#.#', '#.......#', '.#######.', '..#......', '.#.......', '.........']);
// leads: a person
const person = draw(['...###...', '..#####..', '..#####..', '...###...', '.........', '..#####..', '.#######.', '#########', '#########']);

const GLYPHS = [pen, plane, bubble, person];
// pair cells by angle round the centre so each travels a short path, and so the fill sweeps round
const byAngle = (p: P) => Math.atan2(p[1] - 0.001, p[0] + 0.0001);
const SORTED = GLYPHS.map((g) => [...g].sort((a, b) => byAngle(a) - byAngle(b)));
const N = Math.max(...SORTED.map((g) => g.length));
const pick = (g: P[], i: number) => g[Math.floor((i * g.length) / N)];

function build(dark: boolean, narrow: boolean) {
  const L = narrow ? LAYOUT.narrow : LAYOUT.wide;
  const PCol = dark ? PAL.night : PAL.day;
  const tw = (L.W - 2 * L.pad) / 4;
  const th = L.H - 2 * L.pad;
  const xAt = (step: number) => L.pad + tw * (step + 0.5);
  const glyphX = -tw / 2 + L.inset + 4 * L.unit + L.cell / 2;
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const shade = (id: string, w: number, h: number, r: number, top: Color, bottom: Color, opacity: number) =>
    add({
      ...base(id, { outTick: LAST }),
      type: 'rect',
      size: constant({ width: w, height: h }),
      cornerRadius: constant(r),
      style: {
        gradientFill: {
          kind: 'linear',
          stops: constant([
            { position: 0, color: top },
            { position: 1, color: bottom },
          ]),
          start: constant({ x: 0, y: -h / 2 } as Vec2),
          end: constant({ x: 0, y: h / 2 } as Vec2),
          opacity: constant(opacity),
        },
      },
    } as SceneNode);
  const clear = { r: 0, g: 0, b: 0, a: 0 } as Color;
  const clearW = { r: 1, g: 1, b: 1, a: 0 } as Color;

  // ------------------------------------------------------------------ trough
  add({
    ...base('trough-base', { outTick: LAST }),
    type: 'rect',
    size: constant({ width: L.W - 2, height: L.H - 2 }),
    cornerRadius: constant(L.troughR),
    style: { fill: { color: constant(PCol.trough), opacity: constant(1) }, stroke: stroke(PCol.edge, 1.2, { opacity: 0.8 }) },
  } as SceneNode);
  shade('trough-shade', L.W - 2, L.H - 2, L.troughR, hex('#000000'), clear, dark ? 0.16 : 0.035);
  add({ ...base('trough', { outTick: LAST, x: L.W / 2, y: L.H / 2 }), type: 'group', children: ['trough-base', 'trough-shade'] } as SceneNode);

  // each step's glyph rests faintly in the trough, so every tab reads glyph then label; the thumb
  // covers it when it arrives
  const rest: string[] = [];
  GLYPHS.forEach((g, k) =>
    g.forEach(([x, y], i) =>
      rest.push(
        add({
          ...base(`rest-${k}-${i}`, { outTick: LAST, x: xAt(k) + glyphX + x * L.unit, y: L.H / 2 + y * L.unit }),
          type: 'rect',
          size: constant({ width: L.cell, height: L.cell }),
          cornerRadius: constant(L.cell * 0.24),
          style: { fill: { color: constant(PCol.cell), opacity: constant(dark ? 0.3 : 0.4) } },
        } as SceneNode),
      ),
    ),
  );
  add({ ...base('rest', { outTick: LAST }), type: 'group', children: rest } as SceneNode);

  // ------------------------------------------------------------------ thumb
  add({
    ...base('thumb-face', { outTick: LAST }),
    type: 'rect',
    size: constant({ width: tw, height: th }),
    cornerRadius: constant(L.thumbR),
    style: { fill: { color: constant(PCol.thumb), opacity: constant(1) }, stroke: stroke(PCol.ring, 1, { opacity: 1 }) },
  } as SceneNode);
  shade('thumb-sheen', tw - 2, th - 2, L.thumbR - 1, hex('#FFFFFF'), clearW, dark ? 0.16 : 0.55);
  shade('thumb-under', tw, th, L.thumbR, clear, hex('#000000'), dark ? 0.1 : 0.07);

  // the cells: each walks glyph k -> k + 1 in segment k, with its own lag and a sideways kick
  const cells: string[] = [];
  for (let i = 0; i < N; i += 1) {
    const pts = SORTED.map((g) => pick(g, i)).map(([x, y]) => ({ x: glyphX + x * L.unit, y: y * L.unit, z: 0 }));
    const keys: unknown[] = [[0, pts[0], 'hold']];
    for (let k = 0; k < 3; k += 1) {
      const a = pts[k];
      const b = pts[k + 1];
      const ang = rand() * Math.PI * 2;
      const kick = (1 + rand() * 2.2) * L.unit;
      const lag = Math.round(S * (0.02 + rand() * 0.18));
      const mid = { x: (a.x + b.x) / 2 + Math.cos(ang) * kick, y: (a.y + b.y) / 2 + Math.sin(ang) * kick, z: 0 };
      keys.push([k * S + lag, a, OUT], [k * S + lag + Math.round(S * 0.34), mid, INOUT], [k * S + lag + Math.round(S * 0.74), b, 'hold']);
    }
    keys.push([END, pts[3]]);
    const id = `cell-${i}`;
    cells.push(
      add({
        ...base(id, { outTick: LAST, position: keyed(`${id}.pos`, keys as never) as never }),
        type: 'rect',
        size: constant({ width: L.cell, height: L.cell }),
        cornerRadius: constant(L.cell * 0.24),
        style: { fill: { color: constant(PCol.cell), opacity: constant(1) } },
      } as SceneNode),
    );
  }
  add({ ...base('glyph', { outTick: LAST }), type: 'group', children: cells } as SceneNode);

  // the thumb slides step to step, one segment each (the page eases the scrub, so this is linear)
  const thumbKeys: unknown[] = [];
  for (let k = 0; k <= 3; k += 1) thumbKeys.push([k * S, { x: xAt(k), y: L.H / 2, z: 0 }, 'linear']);
  add({
    ...base('thumb', { outTick: LAST, position: keyed('thumb.pos', thumbKeys as never) as never }),
    type: 'group',
    children: ['thumb-face', 'thumb-under', 'thumb-sheen', 'glyph'],
  } as SceneNode);

  const scene = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-step-switch-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: 'ContentOS demo step switch',
    canvas: { width: L.W, height: L.H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: LAST, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: L.W, height: L.H, durationTicks: LAST, nodes, rootNodeIds: ['trough', 'rest', 'thumb'] } },
    markers: [],
    design: { tokens: { looping: false } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);

  const machine = stateMachine({ initial: 'move' }).state('move', { playback: 'scrub', scrubInput: 'pos' });
  const scrubbed = withStateMachine(scene, machine, {
    inputs: { pos: { kind: 'number', defaultValue: 0, minimum: 0, maximum: 3, label: 'Position' } as never },
  });
  // progress: the glyph's cells fill in turn, from faint to full, sweeping round
  const doc = withInteraction(scrubbed, [
    { input: { id: 'input-progress', name: 'progress', kind: 'number', defaultValue: 0, minimum: 0, maximum: 1, label: 'Progress' } },
    ...cells.map((id, i) => {
      const at = (i / N) * 0.9;
      return {
        id: `${id}-fill`,
        target: { kind: 'node-property', nodeId: id, property: 'fillOpacity' },
        blend: 'set',
        steps: [
          { id: `${id}.p`, op: 'input', input: 'progress' },
          { id: `${id}.m`, op: 'map-range', inputMinimum: at, inputMaximum: at + 0.1, outputMinimum: 0.22, outputMaximum: 1, clamp: true },
        ],
      };
    }),
  ] as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

function hexA(h: string, a: number): Color {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}

const OUTDIR = 'public/scene/step-switch';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/step-switch', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/step-switch/${name}.json`, JSON.stringify(doc));
    console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16), N, 'cells');
  }
}
