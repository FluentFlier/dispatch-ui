/**
 * Act 3: starting conversations. How ContentOS reaches out to a lead, one approved step at a time.
 *
 * Art direction
 *   mode      no window this time: a lead's outreach as a vertical timeline of cards on the page
 *             itself (the app's own steps: comment, LinkedIn connection note held to 300
 *             characters, DM; stages Engaging, Connect sent, DM sent, Replied)
 *   verb      progress: each step's draft writes in, you approve it, it is
 *             sent or scheduled at a human time, the line moves to the next; then she replies
 *   geometry  a rail on the left with a node per step, cards to its right, one reply bubble
 *   palette   ink on white cards; cobalt for the line and anything scheduled, green for sent and
 *             replied; the approve button is the hero demo's dark metal
 *   scale     wide 600 x 640 beside the section's words; narrow 348 x ~740 stacked
 *
 *   pnpm tsx animations/outreach-thread.ts   (writes public/scene/outreach-thread/*.json)
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
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

const END = t(12.2);

// label widths, Geist 550, measured in the browser against /fonts/Geist-Variable.ttf
const W12: Record<string, number> = { Approve: 47.9, Sent: 26.8, 'Scheduled · Tue 10:14': 122.7, 'Scheduled · Fri 9:40': 114.6, Engaging: 53.3, 'Connect sent': 76.5, 'DM sent': 47.2, Replied: 43.5 };
const W11: Record<string, number> = { Approve: 43.9, Sent: 24.5, 'Scheduled · Tue 10:14': 112.5, 'Scheduled · Fri 9:40': 105, Engaging: 48.9, 'Connect sent': 70.2, 'DM sent': 43.3, Replied: 39.9 };

const NOTE = 'Hannah, loved your post on onboarding calls. I write about the same problem from the founder side and would like to stay in touch.';
type Step = {
  key: string;
  title: string;
  due: string;
  icon: 'comment' | 'linkedin';
  wide: string[];
  narrow: string[];
  /** the draft's one fact worth showing (the connection note's length against LinkedIn's limit) */
  meta: string;
  done: string;
  doneTone: 'green' | 'blue';
  at: number; // when the card arrives (s)
};
const STEPS: Step[] = [
  {
    key: 'c', title: 'Comment on her post', due: 'Today', icon: 'comment',
    wide: ['Running onboarding as one call changed everything for us too.', 'How did you pick your first ten customers?'],
    narrow: ['Running onboarding as one call changed', 'everything for us too. How did you pick', 'your first ten customers?'],
    meta: '', done: 'Sent', doneTone: 'green', at: 0.5,
  },
  {
    key: 'n', title: 'Connection note', due: 'Tue', icon: 'linkedin',
    wide: ['Hannah, loved your post on onboarding calls. I write about the same', 'problem from the founder side and would like to stay in touch.'],
    narrow: ['Hannah, loved your post on onboarding', 'calls. I write about the same problem', 'from the founder side and would like', 'to stay in touch.'],
    meta: `${NOTE.length} / 300`, done: 'Scheduled · Tue 10:14', doneTone: 'blue', at: 3.0,
  },
  {
    key: 'd', title: 'Direct message', due: 'Fri', icon: 'linkedin',
    wide: ['Congrats on the round. If it helps, I can share the onboarding', 'checklist we use for new customers.'],
    narrow: ['Congrats on the round. If it helps, I can', 'share the onboarding checklist we use', 'for new customers.'],
    meta: '', done: 'Scheduled · Fri 9:40', doneTone: 'blue', at: 5.6,
  },
];
const REPLY = { wide: ['That would help a lot. Free for a call Thursday?'], narrow: ['That would help a lot.', 'Free for a call Thursday?'], at: 8.2 };
const RESET = [11.3, 11.8] as const;
// a step is approved this long after its card arrives
const APPROVE_AFTER = 1.75;

function layout(narrow: boolean) {
  const g = narrow
    ? { W: 348, railX: 16, cardX: 36, textX: 52, right: 332, title: 13, body: 13.5, lh: 20, bodyTop: 54, foot: 22, gap: 14, headH: 74, btnH: 26, btnText: 11, pillText: 11, widths: W11, avatar: 34 }
    : { W: 600, railX: 30, cardX: 60, textX: 82, right: 576, title: 13.5, body: 14.5, lh: 22, bodyTop: 58, foot: 24, gap: 18, headH: 84, btnH: 28, btnText: 12, pillText: 12, widths: W12, avatar: 40 };
  let y = g.headH;
  const cards = STEPS.map((s) => {
    const lines = narrow ? s.narrow : s.wide;
    const h = g.bodyTop + (lines.length - 1) * g.lh + (narrow ? 44 : 48);
    const c = { y, h, lines };
    y += h + g.gap;
    return c;
  });
  const replyLines = narrow ? REPLY.narrow : REPLY.wide;
  const reply = { y: y + 4, h: 22 + replyLines.length * g.lh, lines: replyLines };
  return { ...g, cards, reply, H: reply.y + reply.h + 12 };
}

const BUBBLE = 'M4 5.5 C4 4.7 4.7 4 5.5 4 L18.5 4 C19.3 4 20 4.7 20 5.5 L20 14.5 C20 15.3 19.3 16 18.5 16 L9 16 L5 19.5 L5 16 L5.5 16 C4.7 16 4 15.3 4 14.5 Z';

function build(dark: boolean, narrow: boolean) {
  const C = chrome(dark);
  const L = layout(narrow);
  const S = scene(END);
  const { add, rect, group, image } = S;
  const { line, path, circle } = ui(S, END);
  const roots: string[] = [];

  /** a rounded label, right-aligned at `right` */
  const pill = (id: string, label: string, right: number, mid: number, tone: Tone) => {
    const w = L.widths[label] + (narrow ? 18 : 20);
    const h = L.btnH - 2;
    return [
      rect(`${id}-bg`, { x: right - w, y: mid - h / 2, w, h, r: h / 2, color: tone.bg }),
      line(`${id}-t`, { x: right - w / 2, y: yFor(mid, L.pillText, 16), s: label, size: L.pillText, lh: 16, weight: 550, color: tone.fg, align: 'center', w: 220 }),
    ];
  };
  const stepIn = (id: string, kids: string[], at: number, out = RESET[0]) =>
    group(id, kids, {
      position: [[0, S.v3(0, 8), 'hold'], [t(at), S.v3(0, 8), OUT], [t(at + 0.5), S.v3(0, 0), 'hold']],
      opacity: fade(0, [t(at), t(at + 0.35), 1], [t(out), t(out + 0.4), 0]),
    });

  // ------------------------------------------------------------------ who, and where it stands
  const hm = L.headH / 2 - 6;
  const av = L.avatar;
  const head = [
    circle('h-av', L.railX + (narrow ? 2 : 0), hm, av, dark ? { ...C.pill.apricot.bg, a: 0.3 } : { r: 0.988, g: 0.906, b: 0.855, a: 1 }),
    line('h-in', { x: L.railX + (narrow ? 2 : 0), y: yFor(hm, narrow ? 11.5 : 13, 16), s: 'HW', size: narrow ? 11.5 : 13, lh: 16, weight: 600, color: C.text2, align: 'center', w: 60 }),
    line('h-nm', { x: L.railX + av / 2 + (narrow ? 12 : 16), y: yFor(hm - 9, narrow ? 14 : 15, 21), s: 'Hannah Weiss', size: narrow ? 14 : 15, lh: 21, weight: 550, color: C.text }),
    line('h-rl', { x: L.railX + av / 2 + (narrow ? 12 : 16), y: yFor(hm + 9, 12.5, 18), s: 'Founder, Parcelry', size: 12.5, lh: 18, color: C.text2 }),
  ];
  stepIn('head', head, 0.15);
  roots.push('head');
  // the stage she is at, moving with each step
  const stages: [string, Tone, number, number][] = [
    ['Engaging', C.pill.ink, 0.15, STEPS[1].at + APPROVE_AFTER + 0.2],
    ['Connect sent', C.pill.blue, STEPS[1].at + APPROVE_AFTER + 0.2, STEPS[2].at + APPROVE_AFTER + 0.2],
    ['DM sent', C.pill.blue, STEPS[2].at + APPROVE_AFTER + 0.2, REPLY.at + 0.3],
    ['Replied', C.pill.green, REPLY.at + 0.3, RESET[0]],
  ];
  stages.forEach(([label, tone, a, b], n) => {
    group(`stage${n}`, pill(`st${n}`, label, L.right, hm, tone), {
      position: [[0, S.v3(0, 5), 'hold'], [t(a), S.v3(0, 5), OUT], [t(a + 0.4), S.v3(0, 0), 'hold']],
      opacity: fade(0, [t(a), t(a + 0.25), 1], [t(b), t(b + 0.2), 0]),
    });
    roots.push(`stage${n}`);
  });

  // ------------------------------------------------------------------ the rail
  const nodeY = [...L.cards.map((c) => c.y + (narrow ? 24 : 26)), L.reply.y + L.reply.h / 2];
  const railTop = nodeY[0];
  const railBot = nodeY[nodeY.length - 1];
  path('rail', `M${L.railX} ${railTop} L${L.railX} ${railBot}`, { stroke: C.track, width: 2 });
  // the line fills down to each step as the one before it is done
  const frac = (y: number) => (y - railTop) / (railBot - railTop);
  const fillK: K[] = [[0, 0, 'hold']];
  STEPS.forEach((s, i) => {
    const done = s.at + APPROVE_AFTER + 0.2;
    const next = nodeY[i + 1];
    fillK.push([t(done), frac(nodeY[i]), INOUT], [t(done + 0.6), frac(next), 'hold']);
  });
  fillK.push([t(RESET[0]), 1, OUT], [t(RESET[0] + 0.4), 1, 'hold']);
  path('rail-fill', `M${L.railX} ${railTop} L${L.railX} ${railBot}`, {
    stroke: C.pill.blue.icon, width: 2, end: fillK,
    opacity: [[0, 1, 'hold'], [t(RESET[0]), 1, OUT], [t(RESET[0] + 0.4), 0, 'hold'], [t(RESET[1] + 0.2), 0, 'hold'], [END, 1, 'hold']] as K[],
  });
  roots.push('rail', 'rail-fill');
  // a node per step: hollow until its step is reached, then filled
  nodeY.forEach((ny, i) => {
    const reach = i === 0 ? STEPS[0].at : i < STEPS.length ? STEPS[i - 1].at + APPROVE_AFTER + 0.8 : REPLY.at;
    const ring = add({
      ...base(`n${i}-ring`, { outTick: END, x: L.railX, y: ny }),
      type: 'ellipse',
      size: constant({ width: 12, height: 12 }),
      style: { fill: { color: constant(dark ? { r: 0.031, g: 0.059, b: 0.078, a: 1 } : { r: 0.98, g: 0.976, b: 0.965, a: 1 }), opacity: constant(1) }, stroke: { color: constant(C.text3), width: constant(1.5), opacity: constant(1), lineCap: 'round', lineJoin: 'round', miterLimit: 4 } },
    } as SceneNode);
    const dot = circle(`n${i}-dot`, L.railX, ny, 12, i === STEPS.length ? C.pill.green.icon : C.pill.blue.icon, fade(0, [t(reach), t(reach + 0.3), 1], [t(RESET[0]), t(RESET[0] + 0.4), 0]));
    roots.push(ring, dot);
  });

  // ------------------------------------------------------------------ the steps
  STEPS.forEach((s, i) => {
    const c = L.cards[i];
    const kids: string[] = [];
    const id = `s${s.key}`;
    const cardId = rect(`${id}-card`, { x: L.cardX, y: c.y, w: L.W - L.cardX - 2, h: c.h, r: narrow ? 12 : 14, color: C.card, line: C.cardLine });
    kids.push(add({
      ...base(`${id}-lift`, { outTick: END }),
      type: 'effect',
      effect: 'drop-shadow',
      inputId: cardId,
      capability: { requires: [], fallback: 'passthrough', maxTemporarySurfaces: 1 },
      parameters: [
        { id: 'blur', name: 'blur', valueType: 'number', minimum: 0, maximum: 100, value: constant(narrow ? 10 : 14) },
        { id: 'color', name: 'color', valueType: 'color', value: constant(C.shadow) },
        { id: 'offsetX', name: 'offsetX', valueType: 'number', minimum: -50, maximum: 50, value: constant(0) },
        { id: 'offsetY', name: 'offsetY', valueType: 'number', minimum: -50, maximum: 50, value: constant(narrow ? 4 : 6) },
      ],
    } as SceneNode));
    // title row: how, what, when
    const tm = c.y + (narrow ? 24 : 26);
    const ix = L.textX - (narrow ? 0 : 2);
    if (s.icon === 'comment') {
      const gs = 16 / 24;
      kids.push(path(`${id}-ic`, BUBBLE, { fill: C.text3, x: ix, y: tm - 8.5, scale: gs }));
    } else {
      kids.push(image(`${id}-ic`, 'linkedin', { x: ix, y: tm - 8, size: 16 }));
    }
    kids.push(line(`${id}-tt`, { x: ix + 24, y: yFor(tm, L.title, 20), s: s.title, size: L.title, lh: 20, weight: 550, color: C.text }));
    kids.push(line(`${id}-due`, { x: L.right, y: yFor(tm, 12.5, 18), s: s.due, size: 12.5, lh: 18, color: C.text3, align: 'right', w: 120 }));
    // the draft writes in, word by word
    let n = 0;
    c.lines.forEach((txt, li) => {
      const count = txt.split(/\s+/).filter(Boolean).length;
      const animators = Array.from({ length: count }, (_, j) => {
        const at = t(s.at + 0.3 + (n + j) * 0.035);
        return {
          id: `${id}-l${li}-w${j}`,
          selector: { start: j, end: j + 1, units: 'words' },
          opacity: keyed(`${id}-l${li}-w${j}.o`, [[0, 0, 'hold'], [at, 0, OUT], [at + t(0.28), 1, 'hold']] as never),
        };
      });
      n += count;
      kids.push(line(`${id}-l${li}`, { x: L.textX, y: yFor(c.y + L.bodyTop + li * L.lh, L.body, L.lh), s: txt, size: L.body, lh: L.lh, color: C.text, animators }));
    });
    // footer: the draft's own numbers, and the decision
    const fm = c.y + c.h - L.foot;
    if (s.meta) kids.push(line(`${id}-meta`, { x: L.textX, y: yFor(fm, 12, 16), s: s.meta, size: 12, lh: 16, color: C.text3, opacity: fade(0, [t(s.at + 0.9), t(s.at + 1.2), 1]) }));
    const press = s.at + APPROVE_AFTER;
    // Approve: the hero demo's dark metal button; it presses, then gives way to the result
    const bw = L.widths.Approve + (narrow ? 22 : 26);
    const btnBg: Color = dark ? { r: 0.95, g: 0.95, b: 0.96, a: 1 } : { r: 0.086, g: 0.09, b: 0.106, a: 1 };
    const btnFg: Color = dark ? { r: 0.067, g: 0.067, b: 0.078, a: 1 } : { r: 0.97, g: 0.97, b: 0.973, a: 1 };
    const btn = [
      rect(`${id}-btn-bg`, { x: -bw, y: -L.btnH / 2, w: bw, h: L.btnH, r: 8, color: btnBg }),
      line(`${id}-btn-t`, { x: -bw / 2, y: yFor(0, L.btnText + 1, 18), s: 'Approve', size: L.btnText + 1, lh: 18, weight: 550, color: btnFg, align: 'center', w: 120 }),
    ];
    kids.push(group(`${id}-btn`, btn, {
      position: [[0, S.v3(L.right, fm), 'hold']],
      scale: [[0, S.s3(1), 'hold'], [t(press), S.s3(1), OUT], [t(press + 0.1), S.s3(0.95), OUT], [t(press + 0.22), S.s3(1), 'hold']],
      opacity: fade(0, [t(s.at + 1.0), t(s.at + 1.3), 1], [t(press + 0.2), t(press + 0.35), 0]),
    }));
    kids.push(group(`${id}-done`, pill(`${id}-dn`, s.done, L.right, fm, s.doneTone === 'green' ? C.pill.green : C.pill.blue), {
      position: [[0, S.v3(0, 5), 'hold'], [t(press + 0.3), S.v3(0, 5), OUT], [t(press + 0.7), S.v3(0, 0), 'hold']],
      opacity: fade(0, [t(press + 0.3), t(press + 0.55), 1]),
    }));
    stepIn(id, kids, s.at);
    roots.push(id);
  });

  // ------------------------------------------------------------------ her reply
  const R = L.reply;
  const rk: string[] = [];
  const ra = 28;
  rk.push(circle('r-av', L.cardX + ra / 2, R.y + R.h / 2, ra, dark ? { ...C.pill.apricot.bg, a: 0.3 } : { r: 0.988, g: 0.906, b: 0.855, a: 1 }));
  rk.push(line('r-in', { x: L.cardX + ra / 2, y: yFor(R.y + R.h / 2, 10.5, 16), s: 'HW', size: 10.5, lh: 16, weight: 600, color: C.text2, align: 'center', w: 40 }));
  const bx = L.cardX + ra + 10;
  const bwide = narrow ? L.W - bx - 40 : 392;
  rk.push(rect('r-bub', { x: bx, y: R.y, w: bwide, h: R.h, r: 14, color: C.pill.green.bg }));
  R.lines.forEach((txt, li) => rk.push(line(`r-l${li}`, { x: bx + 14, y: yFor(R.y + 11 + L.lh / 2 + li * L.lh, L.body, L.lh), s: txt, size: L.body, lh: L.lh, color: C.text })));
  stepIn('reply', rk, REPLY.at);
  roots.push('reply');

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-outreach-thread-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: `ContentOS outreach thread (${dark ? 'dark' : 'light'}${narrow ? ', narrow' : ''})`,
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

const OUTDIR = 'public/scene/outreach-thread';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/outreach-thread', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/outreach-thread/${name}.json`, JSON.stringify(doc));
    const c = (doc as { canvas: { width: number; height: number } }).canvas;
    console.log('wrote', name, `${c.width}x${c.height}`, (doc as { revision: string }).revision.slice(0, 16));
  }
}
copyFileSync('public/images/brands/linkedin.png', `${OUTDIR}/linkedin.png`);
copyFileSync('public/images/brands/linkedin.png', 'animations/out/outreach-thread/linkedin.png');
