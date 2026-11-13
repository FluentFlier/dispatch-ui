/**
 * Act 2: finding customers. Who in your audience is worth talking to, and why.
 *
 * Art direction
 *   mode      one product surface in the hero demo's window: "People who engaged" with a post
 *             beside "Why them" (the app's own labels: ICP / Potential Lead / Community, signal
 *             chips Raised funding / New role / Joined accelerator, fit scores, Contact ready,
 *             a playbook's Why, Angle and next steps)
 *   verb      sort: the people arrive in the order they engaged, the words that match your
 *             ideal customer light up, each gets its bucket, then the list glides into fit
 *             order; the top lead opens with a reason and a plan
 *   geometry  a list card with hairline rows, a tinted column beside it; nothing but rows move
 *   palette   ink on white; cobalt marks what matches (the same "this one" colour as the
 *             hero), green for Potential Lead and Contact ready, community stays grey
 *   scale     wide 1200 x 440 under the section's heading; narrow 348 x 698 stacked
 *
 *   pnpm tsx animations/lead-sort.ts   (writes public/scene/lead-sort/*.json)
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
import { FPS, INOUT, OUT, TPS, fade, scene, t, type K } from './lib/kit';
import { chrome, ui, yFor, type Tone } from './lib/window';

const END = t(11.4);

type Bucket = 'ICP' | 'Potential Lead' | 'Community';
type Person = {
  name: string;
  initials: string;
  line: string;
  lineN: string;
  match: string[];
  bucket: Bucket;
  engaged: 'like' | 'comment';
  signal?: string;
  score?: string;
  avatar: 'blue' | 'apricot' | 'green' | 'sand' | 'ink';
};
// in the order they engaged with the post (newest first); a coined cast, nobody real
const PEOPLE: Person[] = [
  { name: 'Chloe Brennan', initials: 'CB', line: 'Brand designer and illustrator', lineN: 'Brand designer', match: [], bucket: 'Community', engaged: 'like', avatar: 'blue' },
  { name: 'Arjun Mehta', initials: 'AM', line: 'Head of Growth at Quillstack', lineN: 'Head of Growth, Quillstack', match: ['Head of Growth'], bucket: 'ICP', engaged: 'like', signal: 'New role', score: '0.78', avatar: 'green' },
  { name: 'Kenji Watanabe', initials: 'KW', line: 'Writer at The Weekly Build', lineN: 'Writer, The Weekly Build', match: [], bucket: 'Community', engaged: 'comment', avatar: 'ink' },
  { name: 'Hannah Weiss', initials: 'HW', line: 'Founder, Parcelry · B2B logistics software', lineN: 'Founder, Parcelry', match: ['Founder', 'B2B'], bucket: 'ICP', engaged: 'comment', signal: 'Raised funding', score: '0.91', avatar: 'apricot' },
  { name: 'Fatima Rahman', initials: 'FR', line: '“How do you run your onboarding calls?”', lineN: '“How do you onboard?”', match: ['How do you'], bucket: 'Potential Lead', engaged: 'comment', avatar: 'sand' },
  { name: 'Owen Gallagher', initials: 'OG', line: 'Co-founder at Ledgerline', lineN: 'Co-founder, Ledgerline', match: ['Co-founder'], bucket: 'ICP', engaged: 'like', signal: 'Joined accelerator', score: '0.84', avatar: 'blue' },
];
// fit order: the three ICP leads by score, the potential lead, then the community
const RANK = [3, 5, 1, 4, 2, 0];

// label widths, Geist 550, measured in the browser against /fonts/Geist-Variable.ttf
const W12: Record<string, number> = {
  ICP: 19.9, 'Potential Lead': 82.9, Community: 65.5, 'Raised funding': 85.9, 'Joined accelerator': 107.7, 'New role': 50.8,
  'Contact ready': 81.7, 'Sorted by fit': 71.9, 'Newest first': 72,
};
const W11: Record<string, number> = { ICP: 18.2, 'Potential Lead': 76, Community: 60 };

// beats (seconds)
const ROWS_IN = 0.3;
const MATCH = 1.5;
const BUCKET = 2.4;
const SORT = [3.4, 4.35] as const;
const SIGNALS = 4.5;
const SELECT = 5.3;
const WHY = 5.6;
const RESET = [10.6, 11.0] as const;

function layout(narrow: boolean) {
  if (!narrow) {
    return {
      W: 1200,
      H: 440,
      r: 22,
      list: { x: 16, y: 16, w: 748, h: 408, r: 16, title: { x: 40, mid: 50, size: 13.5 }, tagRight: 740 },
      row: { y0: 84, pitch: 54, x0: 24, x1: 740, av: 32, avX: 56, textX: 84, name: 14, sub: 12.5, pillRight: 680, pillH: 24, pillText: 12, scoreRight: 724 },
      why: {
        x: 780, y: 16, w: 404, h: 408, r: 14, left: 804, right: 1160, head: 50,
        av: { x: 822, y: 104, d: 36 }, nameX: 850, nameMid: 96, roleMid: 114, chipMid: 105,
        size: 14, label: 12,
        whyLabel: 150, whyLines: [172, 192], angleLabel: 226, angleLines: [248, 268], stepsLabel: 302, steps: [330, 360, 390],
        whyText: ['Commented on your onboarding post and', 'raised a seed round last week.'],
        angleText: ['Ask how Parcelry runs its first', 'customer onboarding calls.'],
      },
    };
  }
  return {
    W: 348,
    H: 698,
    r: 20,
    list: { x: 8, y: 8, w: 332, h: 340, r: 14, title: { x: 22, mid: 36, size: 13 }, tagRight: 326 },
    row: { y0: 64, pitch: 46, x0: 14, x1: 334, av: 28, avX: 37, textX: 60, name: 13, sub: 11.5, pillRight: 318, pillH: 22, pillText: 11, scoreRight: 0 },
    why: {
      x: 8, y: 356, w: 332, h: 334, r: 12, left: 22, right: 326, head: 382,
      av: { x: 38, y: 422, d: 32 }, nameX: 62, nameMid: 414, roleMid: 431, chipMid: 422,
      size: 13.5, label: 11.5,
      whyLabel: 462, whyLines: [482, 501], angleLabel: 530, angleLines: [550, 569], stepsLabel: 598, steps: [622, 648, 674],
      whyText: ['Commented on your onboarding post', 'and raised a seed round last week.'],
      angleText: ['Ask how Parcelry runs its first', 'customer onboarding calls.'],
    },
  };
}

// a heart and a speech bubble on a 24-unit grid, cubics only (Clayzo flattens SVG arcs)
const HEART = 'M12 20.5 C5 15.5 2.5 12 2.5 8.5 C2.5 5.5 4.8 3.5 7.4 3.5 C9.4 3.5 11 4.6 12 6.2 C13 4.6 14.6 3.5 16.6 3.5 C19.2 3.5 21.5 5.5 21.5 8.5 C21.5 12 19 15.5 12 20.5 Z';
const BUBBLE = 'M4 5.5 C4 4.7 4.7 4 5.5 4 L18.5 4 C19.3 4 20 4.7 20 5.5 L20 14.5 C20 15.3 19.3 16 18.5 16 L9 16 L5 19.5 L5 16 L5.5 16 C4.7 16 4 15.3 4 14.5 Z';

function build(dark: boolean, narrow: boolean) {
  const C = chrome(dark);
  const L = layout(narrow);
  const S = scene(END);
  const { add, rect, group } = S;
  const { line, path, circle } = ui(S, END);
  const roots: string[] = [];
  const white: Color = { r: 1, g: 1, b: 1, a: 1 };

  const avatarFill = (k: Person['avatar']): Color => {
    const c = (h: string, a = 1): Color => ({ ...chromeHex(h), a });
    const light = { blue: c('#E4ECFD'), apricot: c('#FCE7DA'), green: c('#DDF2E6'), sand: c('#F3EBDD'), ink: c('#ECEBF0') };
    const night = { blue: c('#6CC6EB', 0.18), apricot: c('#FFA774', 0.16), green: c('#4FD18B', 0.16), sand: c('#F0C88C', 0.14), ink: c('#FFFFFF', 0.08) };
    return (dark ? night : light)[k];
  };
  const toneOf = (b: Bucket): Tone => (b === 'ICP' ? C.pill.blue : b === 'Potential Lead' ? C.pill.green : C.pill.ink);

  /** a rounded label: background and centred text, right-aligned at `right` */
  const pill = (id: string, label: string, right: number, mid: number, h: number, size: number, widths: Record<string, number>, tone: Tone, fg?: Color) => {
    const w = widths[label] + (size < 12 ? 18 : 20);
    const bg = rect(`${id}-bg`, { x: right - w, y: mid - h / 2, w, h, r: h / 2, color: tone.bg });
    const tx = line(`${id}-t`, { x: right - w / 2, y: yFor(mid, size, Math.round(size * 1.4)), s: label, size, weight: 550, color: fg ?? tone.fg, align: 'center', w: 200 });
    return [bg, tx];
  };

  // ------------------------------------------------------------------ the window
  rect('win', { x: 0.5, y: 0.5, w: L.W - 1, h: L.H - 1, r: L.r, color: C.win, line: C.winLine });
  rect('win-hi', { x: 1.5, y: 1.5, w: L.W - 3, h: L.H - 3, r: L.r - 1, line: C.winHi });
  const LI = L.list;
  rect('list', { x: LI.x, y: LI.y, w: LI.w, h: LI.h, r: LI.r, color: C.card, line: C.cardLine });
  add({
    ...base('list-lift', { outTick: END }),
    type: 'effect',
    effect: 'drop-shadow',
    inputId: 'list',
    capability: { requires: [], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      { id: 'blur', name: 'blur', valueType: 'number', minimum: 0, maximum: 100, value: constant(narrow ? 12 : 18) },
      { id: 'color', name: 'color', valueType: 'color', value: constant(C.shadow) },
      { id: 'offsetX', name: 'offsetX', valueType: 'number', minimum: -50, maximum: 50, value: constant(0) },
      { id: 'offsetY', name: 'offsetY', valueType: 'number', minimum: -50, maximum: 50, value: constant(narrow ? 5 : 8) },
    ],
  } as SceneNode);
  const WY = L.why;
  rect('col', { x: WY.x, y: WY.y, w: WY.w, h: WY.h, r: WY.r, color: C.tint, line: C.tintLine });
  roots.push('win', 'win-hi', 'list-lift', 'col');

  // list header: the title and the order it is in
  line('title', { x: LI.title.x, y: yFor(LI.title.mid, LI.title.size, 20), s: 'People who engaged', size: LI.title.size, lh: 20, weight: 550, color: C.text });
  const TAG = { w: narrow ? 92 : 100, h: narrow ? 22 : 24 };
  rect('tag', { x: LI.tagRight - TAG.w, y: LI.title.mid - TAG.h / 2, w: TAG.w, h: TAG.h, r: 7, color: C.tag, line: C.tintLine });
  const tagSize = narrow ? 11.5 : 12;
  const tagY = yFor(LI.title.mid, tagSize, 16);
  line('tag-a', { x: LI.tagRight - TAG.w / 2, y: tagY, s: 'Newest first', size: tagSize, lh: 16, weight: 450, color: C.text2, align: 'center', w: 140, opacity: fade(1, [t(SORT[0]), t(SORT[0] + 0.25), 0], [t(RESET[1]), t(RESET[1] + 0.2), 1]) });
  line('tag-b', { x: LI.tagRight - TAG.w / 2, y: tagY, s: 'Sorted by fit', size: tagSize, lh: 16, weight: 450, color: C.text2, align: 'center', w: 140, opacity: fade(0, [t(SORT[0] + 0.2), t(SORT[0] + 0.45), 1], [t(RESET[0]), t(RESET[0] + 0.3), 0]) });
  roots.push('title', 'tag', 'tag-a', 'tag-b');

  // ------------------------------------------------------------------ the rows
  const R = L.row;
  const slotY = (k: number) => R.y0 + R.pitch / 2 + k * R.pitch;
  // hairlines between the slots; the rows move, the lines stay
  for (let k = 1; k < PEOPLE.length; k++) rect(`sep${k}`, { x: R.x0 + 16, y: R.y0 + k * R.pitch, w: R.x1 - R.x0 - 32, h: 1, color: C.cardLine });
  for (let k = 1; k < PEOPLE.length; k++) roots.push(`sep${k}`);


  const rowIds: string[] = [];
  PEOPLE.forEach((p, i) => {
    const rank = RANK.indexOf(i);
    const kids: string[] = [];
    const id = `r${i}`;
    // an opaque card under each row, so rows sliding past each other never show text through
    // text; the lead the list settles on is picked out in it
    const pickBg: Color = dark ? { r: 0.134, g: 0.217, b: 0.256, a: 1 } : { r: 0.918, g: 0.936, b: 0.992, a: 1 };
    kids.push(rect(`${id}-bg`, {
      x: R.x0, y: -R.pitch / 2 + 2, w: R.x1 - R.x0, h: R.pitch - 4, r: 10,
      colorK: rank === 0
        ? [[0, C.card, 'hold'], [t(SELECT), C.card, OUT], [t(SELECT + 0.35), pickBg, 'hold'], [t(RESET[0]), pickBg, 'hold'], [t(RESET[1]), C.card, 'hold']]
        : [[0, C.card, 'hold']],
    }));
    // avatar, its initials, and how they engaged
    kids.push(circle(`${id}-av`, R.avX, 0, R.av, avatarFill(p.avatar)));
    kids.push(line(`${id}-in`, { x: R.avX, y: yFor(0, narrow ? 10.5 : 11.5, 16), s: p.initials, size: narrow ? 10.5 : 11.5, lh: 16, weight: 600, color: C.text2, align: 'center', w: 60 }));
    const bd = narrow ? 14 : 16;
    const bx = R.avX + R.av * 0.36;
    const by = R.av * 0.36;
    kids.push(circle(`${id}-bdr`, bx, by, bd + 3, C.card));
    kids.push(circle(`${id}-bd`, bx, by, bd, p.engaged === 'like' ? C.pill.blue.icon : C.pill.green.icon));
    const gs = (bd * 0.6) / 24;
    kids.push(path(`${id}-gl`, p.engaged === 'like' ? HEART : BUBBLE, { fill: white, x: bx - 12 * gs, y: by - 12 * gs + 0.4, scale: gs }));
    // name and headline; the words that match your ideal customer turn cobalt
    kids.push(line(`${id}-nm`, { x: R.textX, y: yFor(narrow ? -7.5 : -8, R.name, 20), s: p.name, size: R.name, lh: 20, weight: 550, color: C.text }));
    const sub = narrow ? p.lineN : p.line;
    const at = t(MATCH + i * 0.14);
    const animators = p.match
      .map((m) => sub.indexOf(m))
      .filter((c0) => c0 >= 0)
      .map((c0, n) => ({
        id: `${id}-m${n}`,
        selector: { start: c0, end: c0 + p.match[n].length, units: 'characters' },
        fillColor: keyed(`${id}-m${n}.c`, [[0, C.text2, 'hold'], [at, C.text2, OUT], [at + t(0.3), C.pill.blue.fg, 'hold'], [t(RESET[1]), C.pill.blue.fg, 'hold'], [t(RESET[1] + 0.02), C.text2, 'hold']] as never),
      }));
    kids.push(line(`${id}-hl`, { x: R.textX, y: yFor(narrow ? 8.5 : 10, R.sub, 18), s: sub, size: R.sub, lh: 18, color: C.text2, animators }));

    // its bucket, in place as soon as the match is read
    const ba = BUCKET + i * 0.1;
    const bucket = pill(`${id}-bk`, p.bucket, R.pillRight, 0, R.pillH, R.pillText, narrow ? W11 : W12, toneOf(p.bucket));
    kids.push(group(`${id}-bkg`, bucket, { position: [[0, S.v3(0, 5), 'hold'], [t(ba), S.v3(0, 5), OUT], [t(ba + 0.4), S.v3(0, 0), 'hold']], opacity: fade(0, [t(ba), t(ba + 0.25), 1]) }));

    // ICP leads gain their signal and fit score once the list is in order (wide only: the
    // phone keeps rows to name, headline and bucket)
    if (!narrow && p.signal && p.score) {
      const sa = SIGNALS + RANK.slice(0, 3).indexOf(i) * 0.14;
      const bw = W12[p.bucket] + 20;
      const chip = pill(`${id}-sg`, p.signal, R.pillRight - bw - 8, 0, R.pillH, R.pillText, W12, C.pill.ink, C.text2);
      chip.push(line(`${id}-sc`, { x: R.scoreRight, y: yFor(0, 13, 18), s: p.score, size: 13, lh: 18, weight: 550, color: C.text, align: 'right', w: 60 }));
      kids.push(group(`${id}-sgg`, chip, { position: [[0, S.v3(6, 0), 'hold'], [t(sa), S.v3(6, 0), OUT], [t(sa + 0.4), S.v3(0, 0), 'hold']], opacity: fade(0, [t(sa), t(sa + 0.3), 1]) }));
    }

    // the row: in, then into its place by fit; the community steps back
    const y0 = slotY(i);
    const y1 = slotY(rank);
    const inAt = t(ROWS_IN + i * 0.07);
    const op: K[] = [[0, 0, 'hold'], [inAt, 0, OUT], [inAt + t(0.35), 1, 'hold']];
    if (p.bucket === 'Community') op.push([t(SORT[1] - 0.2), 1, OUT], [t(SORT[1] + 0.2), 0.45, 'hold'], [t(RESET[0]), 0.45, OUT]);
    else op.push([t(RESET[0]), 1, OUT]);
    op.push([t(RESET[0] + 0.35), 0, 'hold']);
    rowIds[rank] = group(id, kids, {
      position: [
        [0, S.v3(0, y0 + 6), 'hold'],
        [inAt, S.v3(0, y0 + 6), OUT],
        [inAt + t(0.4), S.v3(0, y0), 'hold'],
        [t(SORT[0]), S.v3(0, y0), INOUT],
        [t(SORT[1]), S.v3(0, y1), 'hold'],
      ],
      opacity: op,
    });
  });
  roots.push(...[...rowIds].reverse());

  // ------------------------------------------------------------------ why them
  line('why-title', { x: WY.left, y: yFor(WY.head, LI.title.size, 20), s: 'Why them', size: LI.title.size, lh: 20, weight: 550, color: C.text });
  roots.push('why-title');
  // until a lead is picked: the column's shape, nothing in it
  const skel = [
    [WY.av.y - 10, 150],
    [WY.whyLines[0], WY.w - 120],
    [WY.whyLines[1], WY.w - 170],
    [WY.angleLines[0], WY.w - 140],
    [WY.angleLines[1], WY.w - 200],
  ].map(([y, w], n) => rect(`sk${n}`, { x: WY.left, y: y - 4, w, h: 8, r: 4, color: C.track }));
  group('skel', skel, { opacity: fade(1, [t(WHY), t(WHY + 0.25), 0], [t(RESET[1]), t(RESET[1] + 0.3), 1]) });
  roots.push('skel');

  const lead = PEOPLE[RANK[0]];
  const step = (n: number, kids: string[], at: number) => {
    group(`w${n}`, kids, {
      position: [[0, S.v3(0, 6), 'hold'], [t(at), S.v3(0, 6), OUT], [t(at + 0.45), S.v3(0, 0), 'hold']],
      opacity: fade(0, [t(at), t(at + 0.3), 1], [t(RESET[0]), t(RESET[0] + 0.35), 0]),
    });
    roots.push(`w${n}`);
  };
  // who
  step(0, [
    circle('w-av', WY.av.x, WY.av.y, WY.av.d, avatarFill(lead.avatar)),
    line('w-in', { x: WY.av.x, y: yFor(WY.av.y, 12.5, 16), s: lead.initials, size: 12.5, lh: 16, weight: 600, color: C.text2, align: 'center', w: 60 }),
    line('w-nm', { x: WY.nameX, y: yFor(WY.nameMid, WY.size + 1, 21), s: lead.name, size: WY.size + 1, lh: 21, weight: 550, color: C.text }),
    line('w-rl', { x: WY.nameX, y: yFor(WY.roleMid, 12.5, 18), s: 'Founder, Parcelry', size: 12.5, lh: 18, color: C.text2 }),
    ...pill('w-sg', lead.signal ?? '', WY.right, WY.chipMid, narrow ? 22 : 24, narrow ? 11.5 : 12, W12, C.pill.ink, C.text2),
  ], WHY + 0.05);
  // reachable
  step(1, pill('w-ct', 'Contact ready', WY.right, WY.head, narrow ? 22 : 24, narrow ? 11.5 : 12, W12, C.pill.green), WHY + 0.3);
  // why, and the angle in
  const para = (key: string, label: string, mid: number, lines: string[], mids: number[]) => [
    line(`${key}-l`, { x: WY.left, y: yFor(mid, WY.label, 16), s: label, size: WY.label, lh: 16, weight: 500, color: C.text3 }),
    ...lines.map((s, n) => line(`${key}-${n}`, { x: WY.left, y: yFor(mids[n], WY.size, 20), s, size: WY.size, lh: 20, color: C.text })),
  ];
  step(2, para('w-why', 'Why', WY.whyLabel, WY.whyText, WY.whyLines), WHY + 0.25);
  step(3, para('w-ang', 'Angle', WY.angleLabel, WY.angleText, WY.angleLines), WHY + 0.45);
  // and what to do, in order
  step(4, [line('w-st', { x: WY.left, y: yFor(WY.stepsLabel, WY.label, 16), s: 'Next steps', size: WY.label, lh: 16, weight: 500, color: C.text3 })], WHY + 0.65);
  const STEPS = [
    ['Comment on her latest post', 'Today'],
    ['Connect on LinkedIn', 'In 2 days'],
    ['Send a DM', 'In 5 days'],
  ];
  STEPS.forEach(([label, due], n) => {
    const mid = WY.steps[n];
    const ring = add({
      ...base(`w-s${n}-ring`, { outTick: END, x: WY.left + 7, y: mid }),
      type: 'ellipse',
      size: constant({ width: 14, height: 14 }),
      style: { stroke: { color: constant(n === 0 ? C.pill.blue.icon : C.text3), width: constant(1.5), opacity: constant(1), lineCap: 'round', lineJoin: 'round', miterLimit: 4 } },
    } as SceneNode);
    step(5 + n, [
      ring,
      line(`w-s${n}-t`, { x: WY.left + 24, y: yFor(mid, WY.size, 20), s: label, size: WY.size, lh: 20, color: C.text }),
      line(`w-s${n}-d`, { x: WY.right, y: yFor(mid, 12.5, 18), s: due, size: 12.5, lh: 18, color: n === 0 ? C.pill.blue.fg : C.text3, align: 'right', w: 120 }),
    ], WHY + 0.8 + n * 0.15);
  });

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-lead-sort-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: `ContentOS lead sort (${dark ? 'dark' : 'light'}${narrow ? ', narrow' : ''})`,
    canvas: { width: L.W, height: L.H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {},
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

function chromeHex(h: string): Color {
  const n = Number.parseInt(h.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

const OUTDIR = 'public/scene/lead-sort';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/lead-sort', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/lead-sort/${name}.json`, JSON.stringify(doc));
    const c = (doc as { canvas: { width: number; height: number } }).canvas;
    console.log('wrote', name, `${c.width}x${c.height}`, (doc as { revision: string }).revision.slice(0, 16));
  }
}
