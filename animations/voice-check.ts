/**
 * Act 1: the voice check. What ContentOS does to a draft before you ever see it.
 *
 * Art direction
 *   mode      one product surface: a LinkedIn draft beside its Voice QA rail (the app's own
 *             labels: Persona, Unique, Specific, So what, Pain, AI slop; pass at 8 of 10,
 *             AI slop at 3 or under; up to two rewrites)
 *   verb      check: the AI tells are flagged line by line, the scores fall short, the draft
 *             breaks up into dots (the plane mark's own halftone) and a rewrite takes its place
 *   geometry  the hero demo's window (warm ground, soft ring): the draft in a raised white card,
 *             Voice QA in a tinted column beside it; type large enough to read as writing
 *   palette   ink on white; apricot means it failed, green only for the one word that matters
 *             at the end, "Passed". The verdict uses the hero post card's status pills
 *   scale     wide 1200 x 404 under the section's heading; narrow 348 x 564 stacked
 *
 *   pnpm tsx animations/voice-check.ts   (writes public/scene/voice-check/*.json)
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
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
import { FPS, INOUT, OUT, TPS, fade, palette, scene, t, type K } from './lib/kit';

const END = t(11.2);

// the two drafts, broken by hand so the rag stays the same at both sizes
const DRAFT_1 = ["In today's fast-paced world,", 'founders must leverage content', 'to build trust. Here are five', 'game-changing lessons from', 'scaling our startup.'];
const DRAFT_2 = ['We lost 3 of our first 10', 'customers in month two.', 'All three told us the same', 'thing, and it was not the price.'];
// the tells the humanizer looks for (src/lib/humanizer.ts): [line, first char, end char] and the
// ink's left and right edge at 34 px, measured off a Clayzo render (its Geist kerns a touch tighter
// than the browser's, so advance widths overshoot)
const TELLS = [
  { line: 0, c0: 0, c1: 27, x0: 3.2, x1: 419.7 },
  { line: 1, c0: 14, c1: 22, x0: 235.9, x1: 363.4 },
  { line: 3, c0: 0, c1: 13, x0: 1.1, x1: 241.2 },
];
const CHECKS = ['Persona', 'Unique', 'Specific', 'So what', 'Pain', 'AI slop'];
const SCORE_1 = [5, 4, 3, 6, 5, 8];
const SCORE_2 = [9, 8, 9, 8, 9, 2];
const PASS_AT = [8, 8, 8, 8, 8, 3];

// beats (seconds)
const P1_IN = 0.35;
const FLAGS = [1.9, 2.75] as const;
const METERS_1 = 2.8;
const STATUS_1 = 3.3;
const DISSOLVE = [4.3, 5.3] as const;
const P2_IN = 5.4;
const METERS_2 = 7.1;
const STATUS_2 = 7.65;
const RESET = [10.4, 10.9] as const;

function layout(narrow: boolean) {
  if (!narrow) {
    return {
      W: 1200,
      H: 404,
      r: 22,
      card: { x: 16, y: 16, w: 748, h: 372, r: 16 },
      head: { icon: 30, ix: 40, iy: 38, x: 82, mid: 53, size: 13.5, right: 740, badge: { h: 30, ic: 20, text: 13 } },
      draft: { x: 44, b0: 122, lh: 46, size: 32, w: 700 },
      col: { x: 780, y: 16, w: 404, h: 372, r: 14 },
      rail: { x: 804, right: 1160, head: 48, size: 13.5, row0: 104, pitch: 40, track: [892, 1100] as const, status: 348 },
    };
  }
  return {
    W: 348,
    H: 564,
    r: 20,
    card: { x: 8, y: 8, w: 332, h: 216, r: 14 },
    head: { icon: 26, ix: 24, iy: 24, x: 60, mid: 37, size: 13, right: 324, badge: { h: 26, ic: 18, text: 12 } },
    draft: { x: 24, b0: 88, lh: 28, size: 20, w: 310 },
    col: { x: 8, y: 232, w: 332, h: 324, r: 12 },
    rail: { x: 24, right: 324, head: 262, size: 13, row0: 302, pitch: 36, track: [104, 256] as const, status: 526 },
  };
}

/** the hero demo window's own colours (src/components/site/demo/demo.css), light and dark */
function chrome(dark: boolean) {
  const c = (h: string, a = 1): Color => ({ ...hex(h), a });
  return dark
    ? {
        win: c('#0F1015'),
        winLine: c('#FFFFFF', 0.08),
        winHi: c('#FFFFFF', 0),
        card: c('#17181F'),
        cardLine: c('#FFFFFF', 0.07),
        shadow: c('#000000', 0.5),
        tint: c('#FFFFFF', 0.03),
        tintLine: c('#FFFFFF', 0.06),
        tag: c('#FFFFFF', 0.07),
        text: c('#ECECF1'),
        text2: c('#A3A5B3'),
        text3: c('#6F7181'),
        track: c('#FFFFFF', 0.08),
        pill: {
          apricot: { bg: c('#FFA774', 0.14), fg: c('#FFBE94'), icon: c('#F0804A') },
          ink: { bg: c('#FFFFFF', 0.08), fg: c('#A3A5B3'), icon: c('#6F7181') },
          blue: { bg: c('#94A1FF', 0.16), fg: c('#C3CAFF'), icon: c('#6F7FF5') },
          green: { bg: c('#4FD18B', 0.14), fg: c('#8EE6B4'), icon: c('#22A565') },
        },
      }
    : {
        win: c('#FCFBF9'),
        winLine: c('#101118', 0.09),
        winHi: c('#FFFFFF', 0.9),
        card: c('#FFFFFF'),
        cardLine: c('#101118', 0.07),
        shadow: c('#1E2850', 0.13),
        tint: c('#101118', 0.03),
        tintLine: c('#101118', 0.06),
        tag: c('#101118', 0.05),
        text: c('#16171B'),
        text2: c('#565863'),
        text3: c('#8C8E98'),
        track: c('#101118', 0.07),
        pill: {
          apricot: { bg: c('#F0804A', 0.13), fg: c('#B4521C'), icon: c('#F0804A') },
          ink: { bg: c('#101118', 0.07), fg: c('#4C4E58'), icon: c('#8C8E98') },
          blue: { bg: c('#2F5BEA', 0.1), fg: c('#2445C4'), icon: c('#2F5BEA') },
          green: { bg: c('#22A565', 0.12), fg: c('#157A49'), icon: c('#22A565') },
        },
      };
}

// widths of the pill labels, Geist 12 px / 550, measured in the browser
const PILL_W = { below: 93.5, rewriting: 54.6, passed: 42.2 };
// the draft card's badge, Geist 550 at 13 px (wide) and 12 px (narrow)
const BADGE_W = { hidden: [130.7, 120.7], waiting: [125.4, 115.7] };

// Geist's cap height is ~0.71 em; a text node's first baseline sits one line height below its y
const yFor = (capMid: number, size: number, lh: number) => capMid + size * 0.355 - lh;

const SKSL = `
uniform shader inputImage;
uniform float p;
uniform float x0;
uniform float span;
uniform float cell;
uniform float2 renderScale;

float hash(float2 c) { return fract(sin(dot(c, float2(12.9898, 78.233))) * 43758.5453); }

half4 main(float2 q) {
  float s = renderScale.x;
  float2 u = q / s;
  half4 crisp = inputImage.eval(q);
  float band = span * 0.42;
  float front = x0 - band + p * (span + band * 2.1);
  float2 c0 = floor(u / cell);
  float k = clamp((front - u.x + (hash(c0) - 0.5) * band * 0.45) / band, 0.0, 1.0);
  if (k <= 0.0) { return crisp; }
  // the dots lift a little as they go
  float2 v = u + float2(0.0, 10.0 * k * k);
  float2 c = floor(v / cell);
  float2 cc = (c + 0.5) * cell;
  // ink under the cell, from four taps, so thin strokes still make a dot
  float h = cell * 0.25;
  half4 t0 = inputImage.eval((cc + float2(-h, -h)) * s);
  half4 t1 = inputImage.eval((cc + float2(h, -h)) * s);
  half4 t2 = inputImage.eval((cc + float2(-h, h)) * s);
  half4 t3 = inputImage.eval((cc + float2(h, h)) * s);
  half4 sum = t0 + t1 + t2 + t3;
  float a = sum.a * 0.25;
  if (a < 0.02) { return mix(crisp, half4(0.0), half(smoothstep(0.0, 0.22, k))); }
  half3 rgb = sum.rgb / max(sum.a, 0.0001);
  float r = cell * 0.62 * sqrt(min(1.0, a * 1.8)) * (1.0 - k);
  float d = length(v - cc);
  // a dot under ~half a unit is gone, so nothing of the line is left behind
  float cov = (1.0 - smoothstep(r - 0.55, r + 0.45, d)) * smoothstep(0.25, 0.8, r);
  half4 dots = half4(rgb * cov, cov);
  return mix(crisp, dots, half(smoothstep(0.0, 0.22, k)));
}
`;

function build(dark: boolean, narrow: boolean) {
  const P = palette(dark);
  const C = chrome(dark);
  const L = layout(narrow);
  const S = scene(END);
  const { add, rect, image, group } = S;
  const roots: string[] = [];

  /** one line of type; `runsK` swaps its text over time (counters, labels) */
  const line = (
    id: string,
    o: {
      x: number;
      y: number;
      s: string;
      size: number;
      color: Color;
      lh?: number;
      weight?: number;
      mono?: boolean;
      align?: 'left' | 'right' | 'center';
      w?: number;
      opacity?: K[];
      animators?: unknown[];
      runsK?: [number, string][];
    },
  ) => {
    const run = (s: string) => [
      {
        text: s,
        fontFamily: o.mono ? 'Geist Mono' : 'Geist',
        fontSize: o.size,
        fontWeight: o.weight ?? 400,
        letterSpacing: 0,
        lineHeight: o.lh ?? Math.round(o.size * 1.4),
        color: o.color,
      },
    ];
    const w = o.w ?? 800;
    return add({
      ...base(id, { outTick: END, x: o.align === 'right' ? o.x - w : o.align === 'center' ? o.x - w / 2 : o.x, y: o.y, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined }),
      type: 'text',
      runs: o.runsK ? keyed(`${id}.r`, [[0, run(o.s), 'hold'], ...o.runsK.map(([tk, s]) => [tk, run(s), 'hold'])] as never) : constant(run(o.s)),
      box: { width: w, height: 200 },
      wrap: 'none',
      align: o.align ?? 'left',
      verticalAlign: 'top',
      ...(o.animators ? { animators: o.animators } : {}),
    } as SceneNode);
  };

  const pathNode = (id: string, d: string, o: { color: Color; width: number; opacity?: K[]; end?: K[] }) =>
    add({
      ...base(id, { outTick: END, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined }),
      type: 'path',
      path: constant(parseSvgPath(d).path),
      style: { stroke: stroke(o.color, o.width) },
      ...(o.end ? { operators: [trim(`${id}.trim`, { start: constant(0), end: keyed(`${id}.te`, o.end as never) })] } : {}),
    } as SceneNode);


  // ------------------------------------------------------------------ the window
  // the demo window: warm ground, a hairline ring with a lit inner edge (its drop shadow is CSS)
  rect('win', { x: 0.5, y: 0.5, w: L.W - 1, h: L.H - 1, r: L.r, color: C.win, line: C.winLine });
  rect('win-hi', { x: 1.5, y: 1.5, w: L.W - 3, h: L.H - 3, r: L.r - 1, line: C.winHi });
  // the draft sits in a raised white card, like the demo's post card
  const K0 = L.card;
  rect('card', { x: K0.x, y: K0.y, w: K0.w, h: K0.h, r: K0.r, color: C.card, line: C.cardLine });
  add({
    ...base('card-lift', { outTick: END }),
    type: 'effect',
    effect: 'drop-shadow',
    inputId: 'card',
    capability: { requires: [], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'blur', name: 'blur', valueType: 'number', minimum: 0, maximum: 100, value: constant(narrow ? 12 : 18) },
      { id: 'color', name: 'color', valueType: 'color', value: constant(C.shadow) },
      { id: 'offsetX', name: 'offsetX', valueType: 'number', minimum: -50, maximum: 50, value: constant(0) },
      { id: 'offsetY', name: 'offsetY', valueType: 'number', minimum: -50, maximum: 50, value: constant(narrow ? 5 : 8) },
    ],
  } as SceneNode);
  // Voice QA in a tinted column, like the demo's board columns
  const C0 = L.col;
  rect('col', { x: C0.x, y: C0.y, w: C0.w, h: C0.h, r: C0.r, color: C.tint, line: C.tintLine });
  const Hd = L.head;
  image('li', 'linkedin', { x: Hd.ix, y: Hd.iy, size: Hd.icon });
  line('title', { x: Hd.x, y: yFor(Hd.mid, Hd.size, 20), s: 'LinkedIn draft', size: Hd.size, lh: 20, weight: 550, color: C.text });
  roots.push('win', 'win-hi', 'card-lift', 'col', 'li', 'title');

  // ------------------------------------------------------------------ the drafts
  const D = L.draft;
  const k = D.size / 34;
  const lineY = (i: number) => D.b0 + i * D.lh - D.lh;

  /** words rise in one after another from `t0`; returns the last word's start (s) */
  const wordsIn = (lines: string[], t0: number, step: number) => {
    let n = 0;
    return lines.map((s) => {
      const count = s.split(/\s+/).filter(Boolean).length;
      const anims = Array.from({ length: count }, (_, j) => ({ i: j, at: t(t0 + (n + j) * step) }));
      n += count;
      return anims;
    });
  };

  const draftLines = (prefix: string, lines: string[], t0: number, step: number, extra: (i: number) => unknown[] = () => []) => {
    const timing = wordsIn(lines, t0, step);
    return lines.map((s, i) =>
      line(`${prefix}${i}`, {
        x: D.x,
        y: lineY(i),
        s,
        size: D.size,
        lh: D.lh,
        color: C.text,
        w: D.w,
        animators: [
          ...timing[i].map(({ i: j, at }) => ({
            id: `${prefix}${i}.w${j}`,
            selector: { start: j, end: j + 1, units: 'words' },
            opacity: keyed(`${prefix}${i}.w${j}.o`, [[0, 0, 'hold'], [at, 0, OUT], [at + t(0.32), 1, 'hold']] as never),
            position: keyed(`${prefix}${i}.w${j}.p`, [[0, { x: 0, y: 7 }, 'hold'], [at, { x: 0, y: 7 }, OUT], [at + t(0.42), { x: 0, y: 0 }, 'hold']] as never),
          })),
          ...extra(i),
        ],
      }),
    );
  };

  // pass 1, the tells turning apricot one line after another
  const flagAt = (i: number) => FLAGS[0] + ((FLAGS[1] - FLAGS[0]) * (i + 0.6)) / DRAFT_1.length;
  const p1 = draftLines('a', DRAFT_1, P1_IN, 0.055, (i) =>
    TELLS.filter((x) => x.line === i).map((x) => {
      const at = t(flagAt(i));
      return {
        id: `a${i}.tell`,
        selector: { start: x.c0, end: x.c1, units: 'characters' },
        fillColor: keyed(`a${i}.tell.c`, [[0, C.text, 'hold'], [at, C.text, OUT], [at + t(0.22), P.apricot, 'hold']] as never),
      };
    }),
  );
  const squiggles = TELLS.map((x, n) => {
    const at = t(flagAt(x.line)) + t(0.04);
    const x0 = D.x + x.x0 * k - 1;
    const x1 = D.x + x.x1 * k + 1;
    const y = D.b0 + x.line * D.lh + (narrow ? 5.5 : 8);
    const amp = narrow ? 1.6 : 2.1;
    // a whole number of half waves, so the line ends on the word's edge
    const halves = Math.max(2, Math.round((x1 - x0) / (narrow ? 3 : 3.8)));
    const half = (x1 - x0) / halves;
    let d = `M${x0.toFixed(2)} ${y}`;
    for (let h = 0; h < halves; h++) {
      const xx = x0 + h * half;
      const c = (h % 2 ? 1 : -1) * amp * 1.33;
      d += ` C${(xx + half * 0.35).toFixed(2)} ${(y + c).toFixed(2)} ${(xx + half * 0.65).toFixed(2)} ${(y + c).toFixed(2)} ${(xx + half).toFixed(2)} ${y}`;
    }
    return pathNode(`sq${n}`, d, { color: P.apricot, width: narrow ? 1.4 : 1.7, end: [[0, 0, 'hold'], [at, 0, OUT], [at + t(0.4), 1, 'hold']] });
  });
  group('p1', [...p1, ...squiggles]);
  // the rejected draft breaks up into the plane's halftone, left to right, and lifts away
  add({
    ...base('p1-dots', { outTick: END, opacity: keyed('p1-dots.o', [[0, 1, 'hold'], [t(DISSOLVE[1] - 0.12), 1, OUT], [t(DISSOLVE[1]), 0, 'hold']] as never) as never }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'p1',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'p', name: 'p', valueType: 'number', minimum: 0, maximum: 1, value: keyed('p1-dots.p', [[0, 0, 'hold'], [t(DISSOLVE[0]), 0, 'linear'], [t(DISSOLVE[1]), 1, 'hold']] as never) },
      { id: 'x0', name: 'x0', valueType: 'number', minimum: 0, maximum: 2000, value: constant(D.x) },
      { id: 'span', name: 'span', valueType: 'number', minimum: 0, maximum: 2000, value: constant(500 * k) },
      { id: 'cell', name: 'cell', valueType: 'number', minimum: 1, maximum: 20, value: constant(narrow ? 3.8 : 5.2) },
    ],
  } as SceneNode);
  roots.push('p1-dots');

  // pass 2, written once the first has gone; leaves at the reset
  const p2 = draftLines('b', DRAFT_2, P2_IN, 0.05);
  // gone until the loop's first frame, where every word starts at 0 again
  group('p2', p2, { opacity: fade(1, [t(RESET[0]), t(RESET[0] + 0.45), 0]) });
  roots.push('p2');


  // the draft's own state, as a badge in the card's top right corner: nobody has seen it until
  // it passes, then it waits for you
  const B = Hd.badge;
  const badge = (id: string, label: string, textW: number, tone: { bg: Color; fg: Color; icon: Color }, glyph: (cx: number, cy: number) => string[], op: K[]) => {
    const w = B.h + 1 + textW + (narrow ? 10 : 12);
    const x = Hd.right - w;
    const top = Hd.mid - B.h / 2;
    const cx = x + B.h / 2;
    rect(`${id}-bg`, { x, y: top, w, h: B.h, r: B.h / 2, color: tone.bg });
    add({
      ...base(`${id}-ic`, { outTick: END, x: cx, y: Hd.mid }),
      type: 'ellipse',
      size: constant({ width: B.ic, height: B.ic }),
      style: { fill: fill(tone.icon) },
    } as SceneNode);
    const kids = [`${id}-bg`, `${id}-ic`, ...glyph(cx, Hd.mid)];
    kids.push(line(`${id}-t`, { x: x + B.h + 1, y: yFor(Hd.mid, B.text, 17), s: label, size: B.text, lh: 17, weight: 550, color: tone.fg }));
    return group(id, kids, { opacity: op });
  };
  const sc = B.ic / 20;
  // a padlock: shackle stroked, body filled
  const lock = (id: string) => (cx: number, cy: number) => [
    pathNode(`${id}-sh`, `M${cx - 2.2 * sc} ${cy - 0.6 * sc} V${cy - 2.2 * sc} C${cx - 2.2 * sc} ${cy - 4.8 * sc} ${cx + 2.2 * sc} ${cy - 4.8 * sc} ${cx + 2.2 * sc} ${cy - 2.2 * sc} V${cy - 0.6 * sc}`, { color: hex('#FFFFFF'), width: 1.5 * sc }),
    rect(`${id}-bd`, { x: cx - 3.4 * sc, y: cy - 1 * sc, w: 6.8 * sc, h: 5 * sc, r: 1.2 * sc, color: hex('#FFFFFF') }),
  ];
  // a clock: two hands
  const clock = (id: string) => (cx: number, cy: number) => [
    pathNode(`${id}-hd`, `M${cx} ${cy - 4 * sc} V${cy} L${cx + 2.8 * sc} ${cy + 1.8 * sc}`, { color: hex('#FFFFFF'), width: 1.6 * sc }),
  ];
  const n = narrow ? 1 : 0;
  badge('bd-a', 'Not shown to you yet', BADGE_W.hidden[n], C.pill.ink, lock('bd-a'), fade(1, [t(STATUS_2), t(STATUS_2 + 0.25), 0], [t(RESET[0] + 0.2), t(RESET[0] + 0.5), 1]));
  badge('bd-b', 'Waiting for approval', BADGE_W.waiting[n], C.pill.blue, clock('bd-b'), fade(0, [t(STATUS_2 + 0.1), t(STATUS_2 + 0.4), 1], [t(RESET[0]), t(RESET[0] + 0.3), 0]));
  roots.push('bd-a', 'bd-b');

  // ------------------------------------------------------------------ Voice QA
  const R = L.rail;
  line('qa', { x: R.x, y: yFor(R.head, R.size, 20), s: 'Voice QA', size: R.size, lh: 20, weight: 550, color: C.text });
  // the pass number in the demo's small tag
  const TAG = { w: 58, h: 24 };
  rect('tag', { x: R.right - TAG.w, y: R.head - TAG.h / 2, w: TAG.w, h: TAG.h, r: 7, color: C.tag, line: C.tintLine });
  const tagY = yFor(R.head, 12, 16);
  const tagText = (id: string, s: string, op: K[]) => line(id, { x: R.right - TAG.w / 2, y: tagY, s, size: 12, lh: 16, weight: 450, color: C.text2, w: 120, align: 'center', opacity: op });
  tagText('pass-1', 'Pass 1', fade(1, [t(DISSOLVE[0] + 0.1), t(DISSOLVE[0] + 0.35), 0], [t(RESET[1]), t(RESET[1] + 0.2), 1]));
  tagText('pass-2', 'Pass 2', fade(0, [t(DISSOLVE[0] + 0.3), t(DISSOLVE[0] + 0.55), 1], [t(RESET[1] - 0.2), t(RESET[1]), 0]));
  roots.push('qa', 'tag', 'pass-1', 'pass-2');

  const [tx0, tx1] = R.track;
  const tw = tx1 - tx0;
  CHECKS.forEach((label, i) => {
    const cy = R.row0 + i * R.pitch;
    line(`l${i}`, { x: R.x, y: yFor(cy, R.size, 20), s: label, size: R.size, lh: 20, color: C.text2 });
    rect(`tr${i}`, { x: tx0, y: cy - 3, w: tw, h: 6, r: 3, color: C.track });
    // the pass mark for this check
    const tick = tx0 + (tw * PASS_AT[i]) / 10;
    rect(`tk${i}`, { x: tick - 0.75, y: cy - 8, w: 1.5, h: 16, r: 0.75, color: C.text3 });

    const bar = (id: string, v: number, color: Color, at: number, out: number) =>
      pathNode(id, `M${tx0 + 3} ${cy} H${tx0 + 3 + Math.max(0.01, (tw - 6) * (v / 10))}`, {
        color,
        width: 6,
        end: [
          [0, 0, 'hold'],
          [at, 0, OUT],
          [at + t(0.6), 1, 'hold'],
          [out, 1, INOUT],
          [out + t(0.4), 0, 'hold'],
        ],
        opacity: [[0, 0, 'hold'], [at, 0, 'hold'], [at + t(0.02), 1, 'hold'], [out + t(0.4), 1, 'hold'], [out + t(0.42), 0, 'hold']],
      });
    const a1 = t(METERS_1 + i * 0.07);
    const a2 = t(METERS_2 + i * 0.07);
    bar(`f1-${i}`, SCORE_1[i], P.apricot, a1, t(DISSOLVE[0]));
    bar(`f2-${i}`, SCORE_2[i], C.text, a2, t(RESET[0]));

    // the score counts up with its bar; a dash while there is none
    const count = (v: number, at: number): [number, string][] => Array.from({ length: v }, (_, j) => [at + t(((j + 1) / v) * 0.45), `${j + 1}/10`]);
    const nY = yFor(cy, R.size, 20);
    line(`n0-${i}`, { x: R.right, y: nY, s: '–', size: R.size, lh: 20, color: C.text3, align: 'right', w: 80, opacity: [[0, 1, 'hold'], [a1, 0, 'hold'], [t(DISSOLVE[0] + 0.4), 1, 'hold'], [a2, 0, 'hold'], [t(RESET[0] + 0.4), 1, 'hold']] });
    line(`n1-${i}`, { x: R.right, y: nY, s: '0/10', size: R.size, lh: 20, weight: 550, color: P.apricot, align: 'right', w: 80, runsK: count(SCORE_1[i], a1), opacity: [[0, 0, 'hold'], [a1, 1, 'hold'], [t(DISSOLVE[0]), 1, OUT], [t(DISSOLVE[0] + 0.3), 0, 'hold']] });
    line(`n2-${i}`, { x: R.right, y: nY, s: '0/10', size: R.size, lh: 20, weight: 550, color: C.text, align: 'right', w: 80, runsK: count(SCORE_2[i], a2), opacity: [[0, 0, 'hold'], [a2, 1, 'hold'], [t(RESET[0]), 1, OUT], [t(RESET[0] + 0.35), 0, 'hold']] });
    roots.push(`l${i}`, `tr${i}`, `f1-${i}`, `f2-${i}`, `tk${i}`, `n0-${i}`, `n1-${i}`, `n2-${i}`);
  });

  // the verdict, in the hero post card's status pill: a round icon, then the word
  const PH = 26;
  const pill = (id: string, label: string, textW: number, tone: { bg: Color; fg: Color; icon: Color }, glyph: string | null, a: number, b: number, pulse = false) => {
    const w = 26 + textW + 10;
    const top = R.status - PH / 2;
    rect(`${id}-bg`, { x: R.x, y: top, w, h: PH, r: PH / 2, color: tone.bg });
    add({
      ...base(`${id}-ic`, {
        outTick: END,
        x: R.x + 13,
        y: R.status,
        ...(pulse
          ? {
              opacity: keyed(`${id}-ic.o`, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [t(n * 0.5), n % 2 ? 0.5 : 1, { x1: 0.45, y1: 0, x2: 0.55, y2: 1 }]) as never) as never,
            }
          : {}),
      }),
      type: 'ellipse',
      size: constant({ width: 18, height: 18 }),
      style: { fill: fill(tone.icon) },
    } as SceneNode);
    const kids = [`${id}-bg`, `${id}-ic`];
    if (glyph) kids.push(pathNode(`${id}-gl`, glyph, { color: hex('#FFFFFF'), width: 1.7 }));
    kids.push(line(`${id}-t`, { x: R.x + 26, y: yFor(R.status, 12, 16), s: label, size: 12, lh: 16, weight: 550, color: tone.fg }));
    // in like the hero's pills: up 6 px as it fades in, the same on the way out
    return group(id, kids, {
      position: [[0, S.v3(0, 6), 'hold'], [t(a), S.v3(0, 6), OUT], [t(a + 0.42), S.v3(0, 0), 'hold'], [t(b), S.v3(0, 0), OUT], [t(b + 0.3), S.v3(0, -6), 'hold']],
      opacity: fade(0, [t(a), t(a + 0.3), 1], [t(b), t(b + 0.22), 0]),
    });
  };
  const ix = R.x + 13;
  const iy = R.status;
  const cross = `M${ix - 3} ${iy - 3} L${ix + 3} ${iy + 3} M${ix + 3} ${iy - 3} L${ix - 3} ${iy + 3}`;
  const check = `M${ix - 3.6} ${iy + 0.2} L${ix - 1.1} ${iy + 2.6} L${ix + 3.8} ${iy - 2.6}`;
  pill('st-1', 'Below threshold', PILL_W.below, C.pill.apricot, cross, STATUS_1, DISSOLVE[0]);
  pill('st-2', 'Rewriting', PILL_W.rewriting, C.pill.ink, null, DISSOLVE[0] + 0.25, METERS_2 + 0.35, true);
  pill('st-3', 'Passed', PILL_W.passed, C.pill.green, check, STATUS_2, RESET[0]);
  roots.push('st-1', 'st-2', 'st-3');

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-voice-check-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: `ContentOS voice check (${dark ? 'dark' : 'light'}${narrow ? ', narrow' : ''})`,
    canvas: { width: L.W, height: L.H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: { linkedin: { id: 'linkedin', type: 'image', uri: 'linkedin.png', width: 64, height: 64, mimeType: 'image/png' } },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: L.W, height: L.H, durationTicks: END, nodes: S.nodes, rootNodeIds: roots } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 800));
  return doc;
}

const OUTDIR = 'public/scene/voice-check';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/voice-check', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/voice-check/${name}.json`, JSON.stringify(doc));
    const c = (doc as { canvas: { width: number; height: number } }).canvas;
    console.log('wrote', name, `${c.width}x${c.height}`, (doc as { revision: string }).revision.slice(0, 16));
  }
}
copyFileSync('public/images/brands/linkedin.png', `${OUTDIR}/linkedin.png`);
copyFileSync('public/images/brands/linkedin.png', 'animations/out/voice-check/linkedin.png');
