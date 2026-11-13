/**
 * The FAQ's mark: questions become an answer, in the cells of the theme toggle.
 *
 * Art direction
 *   verb      disperse and reform: three dithered question marks hold, then every dot scatters on its
 *             own path and lands as one paper plane, lit; the plane holds, then scatters back into the
 *             questions (the toggle's sun-to-moon move, here questions-to-plane)
 *   geometry  round dots on one square grid; dot size is presence, so the edges of each shape dither
 *             into smaller dots and the plane's vermilion fold reads lighter than its blue one
 *   palette   the questions in ink (pale on dark), the plane in cobalt / sea cyan
 *   scale     480 x 400 under the heading on desktop; narrow 390 x 212, the phone strip above the
 *             heading, the same drawing at 0.66
 *
 *   pnpm tsx animations/ask-mark.ts   (writes public/scene/ask-mark/{light,dark}[-narrow].json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
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
import { FPS, INOUT, OUT, TPS, t } from './lib/kit';
import { MARK } from './lib/mark';

const END = t(9.4);
const TO_PLANE = 1.2; // the questions start to stream into the plane
const TO_ASK = 7.0; // the plane starts to stream back into the questions
const LEG = 0.4; // each half of a dot's one curved trip (out, then in), no stop between
const LAG = 0.42; // the most a dot waits before it leaves
// the flight, once the plane has formed, until just before it streams back
const FLIGHT = { start: 2.6, end: 6.85 } as const;
// one trip in two legs whose speeds meet in the middle: it speeds up into the curve, then eases in
const ACCEL = { x1: 0.45, y1: 0, x2: 0.8, y2: 0.5 };
const LAND = { x1: 0.2, y1: 0.5, x2: 0.5, y2: 1 };

const UNIT = 7; // the grid, in drawing units
const DOT = 6.2; // a full dot's diameter

type P = [number, number];

// ------------------------------------------------------------------ shapes
// presence (0..1) of a shape at a point in its own units; soft edges give the dithered rim

function bezier(p0: P, p1: P, p2: P, p3: P, n = 40): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i += 1) {
    const s = i / n;
    const a = (1 - s) ** 3;
    const b = 3 * (1 - s) ** 2 * s;
    const c = 3 * (1 - s) * s ** 2;
    const d = s ** 3;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}
const segDist = (p: P, a: P, b: P) => {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const k = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / (abx * abx + aby * aby || 1)));
  return Math.hypot(p[0] - a[0] - abx * k, p[1] - a[1] - aby * k);
};
const soft = (d: number, edge: number) => Math.max(0, Math.min(1, 0.5 - d / edge));

// the question mark: an arc and stem (half-width 15) and its dot, about 190 units tall
const Q_LINE = [...bezier([-44, -44], [-44, -92], [44, -96], [44, -46]), ...bezier([44, -46], [44, -10], [0, -8], [0, 28]).slice(1)];
function askAt(p: P): number {
  let d = Infinity;
  for (let i = 1; i < Q_LINE.length; i += 1) d = Math.min(d, segDist(p, Q_LINE[i - 1], Q_LINE[i]));
  const stroke = soft(d - 15, 14);
  const dot = soft(Math.hypot(p[0], p[1] - 74) - 17, 14);
  return Math.max(stroke, dot);
}

// the plane, pointing up and right
const triDist = (p: P, a: P, b: P, c: P) => {
  const side = (u: P, v: P) => (v[0] - u[0]) * (p[1] - u[1]) - (v[1] - u[1]) * (p[0] - u[0]);
  const s1 = side(a, b);
  const s2 = side(b, c);
  const s3 = side(c, a);
  const inside = (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0);
  const e = Math.min(segDist(p, a, b), segDist(p, b, c), segDist(p, c, a));
  return inside ? -e : e;
};
// the mark (public/brand/mark.svg, centred and scaled to 0.115): the blue fold full, the vermilion
// fold lighter, so the crease between them reads in dots
const NOSE_PT: P = [96.1, -96.7];
const LEFT_PT: P = [-96.4, -17.7];
const FOLD_PT: P = [-17, 16.1];
const TAIL_PT: P = [16.8, 96.5];
function planeAt(p: P): number {
  const blue = soft(triDist(p, NOSE_PT, LEFT_PT, FOLD_PT), 12);
  const red = soft(triDist(p, NOSE_PT, FOLD_PT, TAIL_PT), 12) * 0.72;
  return Math.max(blue, red);
}

// the shapes placed in the drawing (centred on 0, 0): three questions of different sizes, one plane
const QUESTIONS = [
  { x: -118, y: -36, s: 0.8 },
  { x: 98, y: -92, s: 0.6 },
  { x: 116, y: 86, s: 0.5 },
];
const PLANE = { x: 0, y: 4, s: 1.15 };

type Cell = { x: number; y: number; v: number };
function sample(at: (p: P) => number, place: { x: number; y: number; s: number }): Cell[] {
  const cells: Cell[] = [];
  const reach = 130 * place.s;
  const x0 = Math.floor((place.x - reach) / UNIT);
  const x1 = Math.ceil((place.x + reach) / UNIT);
  const y0 = Math.floor((place.y - reach) / UNIT);
  const y1 = Math.ceil((place.y + reach) / UNIT);
  for (let gy = y0; gy <= y1; gy += 1)
    for (let gx = x0; gx <= x1; gx += 1) {
      const x = gx * UNIT;
      const y = gy * UNIT;
      const v = at([(x - place.x) / place.s, (y - place.y) / place.s]);
      if (v > 0.12) cells.push({ x, y, v });
    }
  return cells;
}

const ASKS = QUESTIONS.flatMap((q) => sample(askAt, q));
const PLANES = sample(planeAt, PLANE);

// pair dots by angle around the middle, so each travels a short, readable path (as the toggle does)
const byAngle = (c: Cell) => Math.atan2(c.y, c.x);
const A = [...ASKS].sort((a, b) => byAngle(a) - byAngle(b));
const B = [...PLANES].sort((a, b) => byAngle(a) - byAngle(b));
const N = Math.max(A.length, B.length);
const pick = (list: Cell[], i: number) => list[Math.floor((i * list.length) / N)];

function build(dark: boolean, narrow: boolean) {
  const W = narrow ? 390 : 480;
  const H = narrow ? 212 : 400;
  const k = narrow ? 0.66 : 1;
  const hexA = (h: string, al: number): Color => {
    const n = Number.parseInt(h.slice(1), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: al };
  };
  // solid, as the toggle's cells are: dots that share a cell never stack into a darker spot. The grey
  // is the page ink mixed into the ground (light #faf9f6, dark #080f14)
  const ink = dark ? hexA('#7D888F', 1) : hexA('#8B8C92', 1);
  const lit = hexA(dark ? MARK.lit.dark : MARK.lit.light, 1);

  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const nodes: Record<string, SceneNode> = {};
  const ids: string[] = [];
  const pos = (x: number, y: number) => ({ x, y, z: 0 });
  const size = (v: number) => {
    const d = DOT * Math.sqrt(v);
    return { width: d, height: d };
  };

  for (let i = 0; i < N; i += 1) {
    const a = pick(A, i);
    const b = pick(B, i);
    // one curved trip per dot, never a stop: the bend is to one side of the straight line between
    // its two places, and each dot leaves at its own moment
    const bend = (rand() < 0.5 ? -1 : 1) * (10 + rand() * 22);
    const mid = (u: Cell, w: Cell) => {
      const dx = w.x - u.x;
      const dy = w.y - u.y;
      const l = Math.hypot(dx, dy) || 1;
      return pos((u.x + w.x) / 2 - (dy / l) * bend, (u.y + w.y) / 2 + (dx / l) * bend);
    };
    const go = (from: Cell, to: Cell, at: number) => [
      [t(at), pos(from.x, from.y), ACCEL],
      [t(at + LEG), mid(from, to), LAND],
      [t(at + 2 * LEG), pos(to.x, to.y), 'hold'],
    ];
    const s0 = TO_PLANE + rand() * LAG;
    const s1 = TO_ASK + rand() * LAG;
    const id = `d${i}`;
    nodes[id] = {
      ...base(id, {
        outTick: END,
        position: keyed(`${id}.p`, [[0, pos(a.x, a.y), 'hold'], ...go(a, b, s0), ...go(b, a, s1), [END, pos(a.x, a.y)]] as never) as never,
      }),
      type: 'ellipse',
      size: keyed(`${id}.s`, [
        [0, size(a.v), 'hold'],
        [t(s0), size(a.v), INOUT],
        [t(s0 + 2 * LEG), size(b.v), 'hold'],
        [t(s1), size(b.v), INOUT],
        [t(s1 + 2 * LEG), size(a.v), 'hold'],
        [END, size(a.v)],
      ] as never) as never,
      style: {
        fill: {
          // ink while it is a question, lit in the plane; the colour turns over the whole trip, so
          // nothing ever sits as a cloud of the other colour
          color: keyed(`${id}.c`, [
            [0, ink, 'hold'],
            [t(s0), ink, INOUT],
            [t(s0 + 2 * LEG), lit, 'hold'],
            [t(s1), lit, INOUT],
            [t(s1 + 2 * LEG), ink, 'hold'],
            [END, ink],
          ] as never) as never,
          opacity: constant(1),
        },
      },
    } as SceneNode;
    ids.push(id);
  }

  // ------------------------------------------------------------- the flight
  // Seen from a chase camera: the plane stays near the middle at full size while the air moves past.
  // It drops a little off the formation, picks up speed and pulls up into a long climb, eases over
  // the top and settles back (a paper plane's phugoid: the slow up-and-down a glider really flies).
  // The nose pitches with the path, a beat ahead of it, and the wings flex a touch as it banks.
  // One function of time drives the plane and its wake, so the two always agree.
  const v3 = (x: number, y: number, z = 0) => ({ x, y, z });
  const T0 = FLIGHT.start;
  const T1 = FLIGHT.end;
  const smooth = (x: number) => {
    const c = Math.max(0, Math.min(1, x));
    return c * c * (3 - 2 * c);
  };
  const env = (u: number) => smooth(u / 0.2) * smooth((1 - u) / 0.22);
  const CYCLES = 1.25;
  const lift = (u: number) => env(u) * 36 * Math.sin(2 * Math.PI * CYCLES * u); // + is down
  const surge = (u: number) => env(u) * 22 * Math.sin(2 * Math.PI * CYCLES * u - 0.55);
  const AIRSPEED = 1050; // drawing units per unit of u: sets how far the nose pitches
  const flightAt = (sec: number) => {
    const u = Math.max(0, Math.min(1, (sec - T0) / (T1 - T0)));
    const h = 0.004;
    const lead = Math.min(1, u + 0.035); // the nose leads the path
    const dy = (lift(Math.min(1, lead + h)) - lift(Math.max(0, lead - h))) / (2 * h);
    return {
      x: surge(u),
      y: lift(u),
      rot: (Math.atan(dy / AIRSPEED) * 180) / Math.PI,
      sy: 1 - 0.08 * env(u) * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2.5 * u)),
    };
  };
  const STEP = 1 / 24;
  const samples: number[] = [];
  for (let s = T0; s < T1 - 1e-6; s += STEP) samples.push(s);
  samples.push(T1);
  nodes.flight = {
    ...base('flight', {
      outTick: END,
      position: keyed('flight.p', [
        [0, v3(0, 0), 'hold'],
        ...samples.map((s, j) => [t(s), v3(flightAt(s).x, flightAt(s).y), j === samples.length - 1 ? 'hold' : 'linear']),
        [END, v3(0, 0)],
      ] as never) as never,
      rotation: keyed('flight.r', [
        [0, v3(0, 0, 0), 'hold'],
        ...samples.map((s, j) => [t(s), v3(0, 0, flightAt(s).rot), j === samples.length - 1 ? 'hold' : 'linear']),
        [END, v3(0, 0, 0)],
      ] as never) as never,
      scale: keyed('flight.s', [
        [0, v3(1, 1, 1), 'hold'],
        ...samples.map((s, j) => [t(s), v3(1, flightAt(s).sy, 1), j === samples.length - 1 ? 'hold' : 'linear']),
        [END, v3(1, 1, 1)],
      ] as never) as never,
    }),
    type: 'group',
    children: ids,
  } as SceneNode;

  // the wake: dots shed from the two wingtips and left behind in the air, drifting back along the
  // plane's line and fading, so it reads as moving forward while it holds the middle of the frame
  const TIPS = [
    { x: LEFT_PT[0] * PLANE.s + PLANE.x, y: LEFT_PT[1] * PLANE.s + PLANE.y },
    { x: TAIL_PT[0] * PLANE.s + PLANE.x, y: TAIL_PT[1] * PLANE.s + PLANE.y },
  ];
  const NOSE = (Math.atan2(NOSE_PT[1], NOSE_PT[0]) * 180) / Math.PI; // the nose's angle at rest
  const world = (sec: number, p: { x: number; y: number }) => {
    const f = flightAt(sec);
    const r = (f.rot * Math.PI) / 180;
    const px = p.x;
    const py = p.y * f.sy;
    return { x: f.x + px * Math.cos(r) - py * Math.sin(r), y: f.y + px * Math.sin(r) + py * Math.cos(r), rot: f.rot };
  };
  const trail: string[] = [];
  const EVERY = 0.045;
  const LIFE = 1.05;
  let w = 0;
  for (let s = T0 + 0.2; s < T1 - 0.5; s += EVERY, w += 1) {
    const tip = TIPS[w % 2];
    const at = world(s, tip);
    const back = ((NOSE + at.rot + 180) * Math.PI) / 180;
    const dist = 90 + rand() * 46;
    const spread = (rand() - 0.5) * 14;
    const end = v3(at.x + Math.cos(back) * dist - Math.sin(back) * spread, at.y + Math.sin(back) * dist + Math.cos(back) * spread);
    const u = (s - T0) / (T1 - T0);
    const strength = 0.95 * env(u);
    const id = `wake${w}`;
    nodes[id] = {
      ...base(id, {
        outTick: END,
        position: keyed(`${id}.p`, [
          [0, v3(at.x, at.y), 'hold'],
          [t(s), v3(at.x, at.y), OUT],
          [t(s + LIFE), end, 'hold'],
          [END, end],
        ] as never) as never,
      }),
      type: 'ellipse',
      size: keyed(`${id}.s`, [
        [0, { width: 5.4, height: 5.4 }, 'hold'],
        [t(s), { width: 5.4, height: 5.4 }, OUT],
        [t(s + LIFE), { width: 1.8, height: 1.8 }, 'hold'],
        [END, { width: 1.8, height: 1.8 }],
      ] as never) as never,
      style: {
        fill: {
          color: constant(lit),
          opacity: keyed(`${id}.o`, [
            [0, 0, 'hold'],
            [t(s) - 4, 0, 'linear'],
            [t(s), strength, OUT],
            [t(s + LIFE), 0, 'hold'],
            [END, 0],
          ] as never),
        },
      },
    } as SceneNode;
    trail.push(id);
  }

  // the whole drawing, centred on the canvas, drifting a few units up and back so it never sits dead
  const cx = W / 2;
  const cy = H / 2;
  nodes.all = {
    ...base('all', {
      outTick: END,
      scale: k,
      position: keyed('all.p', [
        [0, pos(cx, cy), INOUT],
        [t(2.35), pos(cx, cy - 4 * k), INOUT],
        [t(4.7), pos(cx, cy), INOUT],
        [t(7.05), pos(cx, cy - 4 * k), INOUT],
        [END, pos(cx, cy)],
      ] as never) as never,
    }),
    type: 'group',
    children: [...trail, 'flight'],
  } as SceneNode;

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-ask-mark-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: 'ContentOS questions to plane, dithered',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['all'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

const OUTDIR = 'public/scene/ask-mark';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/ask-mark', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/ask-mark/${name}.json`, JSON.stringify(doc));
    console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16), `${A.length} question dots, ${B.length} plane dots`);
  }
}
