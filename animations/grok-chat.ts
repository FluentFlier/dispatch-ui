/**
 * /for/grok-bot, step 3 shown: asking Grok Bot for a post. Built like the landing's feature panels
 * (animations/grid-panels.ts): a crop of the painted sky, one real product window on it at true size,
 * cut by the panel's edge, and one thing that happens.
 *
 * Art direction
 *   ground    a painting of its own in the India backdrop's style: Ladakh, a monastery on a ridge under
 *             prayer flags (night painting at night), the hero's oil-paint pass baked in
 *   fragment  the app's surface: white (#1C1D20 at night), 1px line, radius 12, a close contact shadow;
 *             13 px Geist, 12 px meta; Grok Bot's face drawn as its disc and pill eyes
 *   verb      ask, work, answer: the request sits there; ContentOS's step spins and checks; the reply
 *             writes in word by word; the draft rises in and its words write in; it holds; it resets
 *   scale     600 x 420 beside the steps on desktop; 340 x 420 on phones
 *
 *   pnpm tsx animations/grok-chat.ts   (writes public/scene/grok-chat/{light,dark}[-narrow].json)
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
import { FPS, OUT, TPS, fade, scene, t } from './lib/kit';
import { ui, yFor } from './lib/window';

const END = t(8.4);
const DONE = 1.8; // ContentOS's step finishes
const REPLY = [2.05, 2.75] as const;
const DRAFT = 2.95; // the draft rises in
const BODY = [3.3, 4.6] as const; // its words write in
const RESET = 7.4;

const c = (h: string, a = 1): Color => ({ ...hex(h), a });
type V = { x: number; y: number; z: number };
const v = (x: number, y: number): V => ({ x, y, z: 0 });

function surface(dark: boolean) {
  return dark
    ? { frag: c('#1C1D20'), line: c('#FFFFFF', 0.1), ink: c('#ECEEF0'), ink2: c('#A9AEB5'), ink3: c('#7C828A'), tint: c('#FFFFFF', 0.06), shadow: c('#000000', 0.5), face: c('#ECEEF0'), eye: c('#1C1D20') }
    : { frag: c('#FFFFFF'), line: c('#101118', 0.12), ink: c('#16171B'), ink2: c('#55575F'), ink3: c('#8A8C94'), tint: c('#101118', 0.045), shadow: c('#1E2850', 0.2), face: c('#0E0F12'), eye: c('#FFFFFF') };
}

const CHECK = 'M20 6 9 17l-5-5';
const ASK_FULL = "Draft a LinkedIn post from this week's customer calls.";
const ASK_SHORT = "Draft a post from this week's calls.";
const BODY_LINES = {
  wide: ['Three founders told me the same thing this week: the post', "that got them a call was the one they almost didn't send."],
  narrow: ['Three founders told me the same thing', 'this week: the post that got them a call', "was the one they almost didn't send."],
};

function build(dark: boolean, n: boolean) {
  const W = n ? 340 : 600;
  const H = n ? 420 : 420;
  const S = scene(END);
  const U = ui(S, END);
  const P = surface(dark);

  /** a line of type whose cap middle sits at `mid`; `words` writes it in */
  const say = (id: string, x: number, mid: number, s: string, size: number, color: Color, o: { weight?: number; words?: [number, number, number] } = {}) => {
    const lh = Math.round(size * 1.45);
    const animators = o.words
      ? s.split(/\s+/).filter(Boolean).map((_, j, all) => {
          const [a0, a1, out] = o.words!;
          const at = t(a0 + ((a1 - a0) * j) / Math.max(1, all.length - 1));
          return { id: `${id}-w${j}`, selector: { start: j, end: j + 1, units: 'words' }, opacity: keyed(`${id}-w${j}.o`, [[0, 0, 'hold'], [at, 0, OUT], [at + t(0.24), 1, 'hold'], [t(out), 1, OUT], [t(out + 0.3), 0, 'hold']] as never) };
        })
      : undefined;
    return U.line(id, { x, y: yFor(mid, size, lh), s, size, color, lh, weight: o.weight, animators });
  };
  const frag = (id: string, x: number, y: number, w: number, h: number) => {
    const card = S.rect(`${id}-card`, { x, y, w, h, r: 12, color: P.frag, line: P.line });
    return S.add({
      ...base(id, { outTick: END }),
      type: 'effect',
      effect: 'drop-shadow',
      inputId: card,
      capability: { requires: [], fallback: 'passthrough', maxTemporarySurfaces: 1 },
      parameters: [
        { id: 'blur', name: 'blur', valueType: 'number', minimum: 0, maximum: 100, value: constant(28) },
        { id: 'color', name: 'color', valueType: 'color', value: constant(P.shadow) },
        { id: 'offsetX', name: 'offsetX', valueType: 'number', minimum: -50, maximum: 50, value: constant(0) },
        { id: 'offsetY', name: 'offsetY', valueType: 'number', minimum: -50, maximum: 50, value: constant(10) },
      ],
    } as SceneNode);
  };
  const dot = (id: string, x: number, y: number, d: number, color: Color) =>
    S.add({ ...base(id, { outTick: END, x, y }), type: 'ellipse', size: constant({ width: d, height: d }), style: { fill: fill(color) } } as SceneNode);
  const pill = (id: string, x: number, y: number, w: number, h: number, color: Color) =>
    S.add({ ...base(id, { outTick: END, x, y }), type: 'rect', size: constant({ width: w, height: h }), cornerRadius: constant(Math.min(w, h) / 2), style: { fill: fill(color) } } as SceneNode);

  const roots: string[] = [];
  roots.push(S.add({ ...base('ground', { outTick: END, x: W / 2, y: H / 2 }), type: 'image', assetId: 'ground', size: constant({ width: W, height: H }), fit: 'cover' } as SceneNode));

  // the window: desktop in 48, down 44, cut by the right and bottom edges; phone 16 in, cut by the bottom
  const X = n ? 16 : 48;
  const Y = n ? 16 : 44;
  const FW = n ? W - 32 : W - X + 20;
  const IN = n ? 16 : 22;
  const RIGHT = n ? X + FW - IN : W - 26;
  roots.push(frag('win', X, Y, FW, H));

  // the bar: Grok Bot's face (its disc and two pill eyes) and its name
  const FACE = 20;
  roots.push(dot('face', X + IN + FACE / 2, Y + 24, FACE, P.face));
  roots.push(pill('eye-l', X + IN + FACE / 2 - 3, Y + 24, 2.6, 6.2, P.eye));
  roots.push(pill('eye-r', X + IN + FACE / 2 + 3, Y + 24, 2.6, 6.2, P.eye));
  roots.push(say('name', X + IN + FACE + 10, Y + 24, 'Grok Bot', 13, P.ink, { weight: 520 }));
  roots.push(S.rect('rule', { x: X, y: Y + 48, w: FW, h: 1, color: P.line }));

  // the request, right-aligned
  const ask = n ? ASK_SHORT : ASK_FULL;
  const aw = n ? 232 : 360;
  const AY = Y + 66;
  roots.push(S.rect('ask', { x: RIGHT - aw, y: AY, w: aw, h: 38, r: 12, color: P.tint }));
  roots.push(say('ask-t', RIGHT - aw + 15, AY + 19, ask, 13, P.ink));

  // ContentOS's step: a spinner that resolves to a check
  const TY = AY + 56;
  const TW = n ? FW - 2 * IN : 300;
  roots.push(S.rect('tool', { x: X + IN, y: TY, w: TW, h: 36, r: 10, line: P.line }));
  roots.push(S.image('tool-mark', 'plane', { x: X + IN + 12, y: TY + 10, size: 16 }));
  roots.push(say('tool-n', X + IN + 36, TY + 18, 'ContentOS', 13, P.ink, { weight: 520 }));
  roots.push(say('tool-a', X + IN + 110, TY + 18, 'Create draft', 13, P.ink2));
  const sx = X + IN + TW - 20;
  const sy = TY + 18;
  const ring = Array.from({ length: 49 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 48) * Math.PI * 2;
    return `${i ? 'L' : 'M'}${(Math.cos(a) * 6).toFixed(2)} ${(Math.sin(a) * 6).toFixed(2)}`;
  }).join(' ');
  S.add({
    ...base('spin-arc', { outTick: END }),
    type: 'path',
    path: constant(parseSvgPath(ring).path),
    style: { stroke: stroke(P.ink3, 1.6) },
    operators: [trim('spin-arc.trim', { start: constant(0), end: constant(0.7) })],
  } as SceneNode);
  roots.push(
    S.add({
      ...base('spin', {
        outTick: END,
        x: sx,
        y: sy,
        rotation: keyed('spin.r', [[0, { x: 0, y: 0, z: 0 }, 'linear'], [END, { x: 0, y: 0, z: 360 * 8 }]] as never) as never,
        opacity: keyed('spin.o', fade(1, [t(DONE - 0.1), t(DONE + 0.05), 0], [t(RESET + 0.2), t(RESET + 0.4), 1]) as never) as never,
      }),
      type: 'group',
      children: ['spin-arc'],
    } as SceneNode),
  );
  roots.push(U.path('check', CHECK, { stroke: P.ink, width: 2.2, x: sx - 7, y: sy - 7, scale: 0.58, end: [[0, 0, 'hold'], [t(DONE), 0, OUT], [t(DONE + 0.3), 1, 'hold'], [t(RESET), 1, OUT], [t(RESET + 0.3), 0, 'hold']] }));

  // the answer, written in
  const RY = TY + 64;
  roots.push(say('reply', X + IN, RY, n ? "Done. It's in ContentOS as a draft." : "Done. It's in ContentOS as a draft, in your voice.", n ? 13.5 : 14, P.ink, { words: [REPLY[0], REPLY[1], RESET] }));

  // the draft: rises in under the answer, its words writing in
  const DY = RY + 26;
  const DW = n ? FW - 2 * IN : 430;
  const lines = n ? BODY_LINES.narrow : BODY_LINES.wide;
  const DH = 50 + lines.length * 19 + 30;
  const per = (BODY[1] - BODY[0]) / lines.length;
  roots.push(
    S.group('draft', [
      S.rect('draft-bg', { x: X + IN, y: DY, w: DW, h: DH, r: 10, line: P.line }),
      S.image('draft-mark', 'plane', { x: X + IN + 14, y: DY + 14, size: 15 }),
      say('draft-n', X + IN + 36, DY + 22, 'ContentOS draft', 13, P.ink, { weight: 520 }),
      ...lines.map((l, i) => say(`draft-l${i}`, X + IN + 14, DY + 50 + i * 19, l, 13, P.ink2, { words: [BODY[0] + per * i, BODY[0] + per * (i + 1), RESET] })),
      say('draft-s', X + IN + 14, DY + 50 + lines.length * 19 + 8, 'Waiting for your review', 12, P.ink3),
    ], {
      position: [[0, v(0, 10), 'hold'], [t(DRAFT), v(0, 10), OUT], [t(DRAFT + 0.5), v(0, 0), 'hold']],
      opacity: fade(0, [t(DRAFT), t(DRAFT + 0.35), 1], [t(RESET), t(RESET + 0.35), 0]),
    }),
  );

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-grok-chat-${dark ? 'dark' : 'light'}${n ? '-narrow' : ''}`,
    name: 'ContentOS in Grok Bot',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: {
      ground: { id: 'ground', type: 'image', uri: dark ? 'ground-night.jpg' : 'ground-day.jpg', width: 1200, height: 840, mimeType: 'image/jpeg' },
      plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 192, height: 192, mimeType: 'image/png' },
    },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes: S.nodes, rootNodeIds: roots } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

const PUB = 'public/scene/grok-chat';
const OUTD = 'animations/out/grok-chat';
mkdirSync(PUB, { recursive: true });
mkdirSync(OUTD, { recursive: true });
for (const n of [false, true])
  for (const dark of [false, true]) {
    const doc = build(dark, n);
    const file = `${dark ? 'dark' : 'light'}${n ? '-narrow' : ''}.json`;
    writeFileSync(`${PUB}/${file}`, JSON.stringify(doc));
    writeFileSync(`${OUTD}/${file}`, JSON.stringify(doc));
    console.log('wrote grok-chat', file, (doc as { revision: string }).revision.slice(0, 14));
  }
for (const [f, src] of [
  ['ground-day.jpg', 'animations/assets/panels/grok-chat-india-day-oil.jpg'],
  ['ground-night.jpg', 'animations/assets/panels/grok-chat-india-night-oil.jpg'],
  ['plane.png', 'public/brand/plane.png'],
]) {
  copyFileSync(src, `${PUB}/${f}`);
  copyFileSync(src, `${OUTD}/${f}`);
}
