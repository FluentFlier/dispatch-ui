/**
 * The feature boxes after Act 3 (ActMore), rebuilt to the card bar (taste skill cards.md; x.ai's
 * cards): the card is barely there and its words are page text; each scene here is its panel, a lit
 * picture with one real product fragment on it at true size, cut by the panel's edge, and one thing
 * that moves. Features from the product handover v2 (screens 3, 5, 17/18, 20).
 *
 * Art direction (all four)
 *   ground    a crop of the hero's own painted sky; at night the night painting in the site's ocean
 *             grade (the hero shader's colour matrix, baked into the crop), then the hero's oil-paint
 *             pass baked over it (animations/paint-panels.ts)
 *   fragment  the app's own surface: white (#1C1D20 at night), 1px line, radius 12, a close contact
 *             shadow; 13 px text, 12 px meta; real marks on their own colours; on switches are ink
 *   verb      hold a readable still, then one change; hold it; reset quietly
 *   accent    once per fragment (the plane; the breaking post's bar; the lead's attachment bar)
 *   scale     wide 640 x 340 (agents, breakout), narrow 440 x 340 (autopilot, tools): the page's grid
 *             is 640fr / 440fr, so every panel is the same height
 *
 *   panel-agents     Claude: "Schedule the Northwind post for Tuesday morning"; the ContentOS step
 *                    resolves, the reply writes in, the scheduled post shows under it
 *   panel-autopilot  Maya's account: the switch goes on, the next posts line up under Coming up next
 *   panel-tools      Slack #leads: a lead signal arrives from ContentOS, synced to HubSpot
 *   panel-breakout   Analytics: the newest post's vs-usual bar runs to 3.4x
 *
 *   pnpm tsx animations/grid-panels.ts
 */
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
import { FPS, INOUT, OUT, TPS, fade, scene, t, type K } from './lib/kit';
import { ui, yFor } from './lib/window';

const DESK_H = 340;
const c = (h: string, a = 1): Color => ({ ...hex(h), a });
type V = { x: number; y: number; z: number };
const v = (x: number, y: number): V => ({ x, y, z: 0 });

/** the fragment's own surface: white, or one step off the dark card */
function surface(dark: boolean) {
  return dark
    ? { frag: c('#1C1D20'), line: c('#FFFFFF', 0.1), ink: c('#ECEEF0'), ink2: c('#A9AEB5'), ink3: c('#7C828A'), tint: c('#FFFFFF', 0.06), track: c('#FFFFFF', 0.1), shadow: c('#000000', 0.5), accent: c('#6CC6EB'), avatar: c('#4A3328'), on: c('#ECEEF0'), knob: c('#1C1D20') }
    : { frag: c('#FFFFFF'), line: c('#101118', 0.12), ink: c('#16171B'), ink2: c('#55575F'), ink3: c('#8A8C94'), tint: c('#101118', 0.045), track: c('#101118', 0.08), shadow: c('#1E2850', 0.2), accent: c('#2F5BEA'), avatar: c('#FCE7DA'), on: c('#16171B'), knob: c('#FFFFFF') };
}
type Surface = ReturnType<typeof surface>;

type Asset = { id: string; file: string; src: string; w: number; h: number };
const MARKS: Record<string, Asset> = {
  claude: { id: 'claude', file: 'claude.png', src: 'animations/assets/logos/claude.png', w: 128, h: 128 },
  plane: { id: 'plane', file: 'plane.webp', src: 'public/brand/plane.webp', w: 96, h: 96 },
  linkedin: { id: 'linkedin', file: 'linkedin.png', src: 'public/images/brands/linkedin.png', w: 64, h: 64 },
  x: { id: 'x', file: 'x.png', src: 'public/images/brands/x.png', w: 64, h: 64 },
  slack: { id: 'slack', file: 'slack.png', src: 'animations/assets/logos/slack.png', w: 128, h: 128 },
  hubspot: { id: 'hubspot', file: 'hubspot.png', src: 'animations/assets/logos/hubspot.png', w: 128, h: 128 },
};

// the painting crops' real sizes (animations/assets/panels, 2x the desktop panel)
const GROUND: Record<string, [number, number]> = { agents: [1280, 680], breakout: [1280, 680], autopilot: [880, 680], tools: [880, 680] };
// the phone composition: every panel one shape, its window centred, cut only by the bottom
const PHONE = { W: 320, H: 300 };

/** one panel, built for desktop (W x 340) and for phones (320 x 300, `-narrow`), light and dark */
function panel(name: string, Wd: number, END: number, marks: string[], draw: (k: Kit) => string[]) {
  const key = name.replace('panel-', '');
  for (const n of [false, true]) for (const dark of [false, true]) {
    const W = n ? PHONE.W : Wd;
    const H = n ? PHONE.H : DESK_H;
    const S = scene(END);
    const U = ui(S, END);
    const P = surface(dark);
    const kit = { ...makeKit(S, U, P, END, dark), n, W, H };
    const roots = [
      S.add({ ...base('ground', { outTick: END, x: W / 2, y: H / 2 }), type: 'image', assetId: 'ground', size: constant({ width: W, height: H }), fit: 'cover' } as SceneNode),
      ...draw(kit),
    ];
    const assets: Record<string, unknown> = {
      ground: { id: 'ground', type: 'image', uri: dark ? 'ground-night.jpg' : 'ground-day.jpg', width: GROUND[key][0], height: GROUND[key][1], mimeType: 'image/jpeg' },
    };
    for (const m of marks) {
      const a = MARKS[m];
      assets[a.id] = { id: a.id, type: 'image', uri: a.file, width: a.w, height: a.h, mimeType: a.file.endsWith('.webp') ? 'image/webp' : 'image/png' };
    }
    const doc = withComputedRevision({
      version: ANIMATION_DOCUMENT_VERSION,
      id: `contentos-${name}-${dark ? 'dark' : 'light'}${n ? '-narrow' : ''}`,
      name: `ContentOS ${name}`,
      canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
      timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
      assets,
      rootCompositionId: 'main',
      components: {},
      compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes: S.nodes, rootNodeIds: roots } },
      markers: [],
      design: { tokens: { looping: true } },
      capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
    } as never);
    assertValidAnimationDocument(doc);
    const diags = validateAnimationDocument(doc).diagnostics;
    if (diags.length) console.warn(name, JSON.stringify(diags).slice(0, 600));
    const file = `${dark ? 'dark' : 'light'}${n ? '-narrow' : ''}.json`;
    // the panel over the India backdrop, the site's only one
    const ipub = `public/scene/${name}-india`;
    const iout = `animations/out/${name}-india`;
    if (!dark && !n) {
      rmSync(ipub, { recursive: true, force: true });
      rmSync(iout, { recursive: true, force: true });
    }
    mkdirSync(ipub, { recursive: true });
    mkdirSync(iout, { recursive: true });
    writeFileSync(`${ipub}/${file}`, JSON.stringify(doc));
    writeFileSync(`${iout}/${file}`, JSON.stringify(doc));
    const ifiles: [string, string][] = [
      [dark ? 'ground-night.jpg' : 'ground-day.jpg', `animations/assets/panels/${key}-india-${dark ? 'night' : 'day'}-oil.jpg`],
      ...marks.map((m) => [MARKS[m].file, MARKS[m].src] as [string, string]),
    ];
    for (const [f, src] of ifiles) {
      copyFileSync(src, `${ipub}/${f}`);
      copyFileSync(src, `${iout}/${f}`);
    }
    console.log('wrote', name, file, (doc as { revision: string }).revision.slice(0, 14));
  }
}

type Kit = ReturnType<typeof makeKit> & { n: boolean; W: number; H: number };
function makeKit(S: ReturnType<typeof scene>, U: ReturnType<typeof ui>, P: Surface, END: number, dark: boolean) {
  /** a line of type whose cap middle sits at `mid`; `words` writes it in */
  const say = (id: string, x: number, mid: number, s: string, size: number, color: Color, o: { weight?: number; opacity?: K[]; words?: [number, number, number]; align?: 'left' | 'right' | 'center'; w?: number } = {}) => {
    const lh = Math.round(size * 1.45);
    const animators = o.words
      ? s.split(/\s+/).filter(Boolean).map((_, j, all) => {
          const [a0, a1, out] = o.words!;
          const at = t(a0 + ((a1 - a0) * j) / Math.max(1, all.length - 1));
          return { id: `${id}-w${j}`, selector: { start: j, end: j + 1, units: 'words' }, opacity: keyed(`${id}-w${j}.o`, [[0, 0, 'hold'], [at, 0, OUT], [at + t(0.24), 1, 'hold'], [t(out), 1, OUT], [t(out + 0.3), 0, 'hold']] as never) };
        })
      : undefined;
    return U.line(id, { x, y: yFor(mid, size, lh), s, size, color, lh, weight: o.weight, opacity: o.opacity, align: o.align, w: o.w, animators });
  };
  /** the fragment's card, cut by the panel where it runs past */
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
  /** a brand mark (the X mark gets a light tile at night so it stays black on white) */
  const mark = (id: string, asset: string, x: number, y: number, size: number) =>
    asset === 'x' && dark
      ? S.group(id, [S.rect(`${id}-bg`, { x: 0, y: 0, w: size, h: size, r: 3, color: c('#FFFFFF') }), S.image(`${id}-im`, 'x', { x: 2, y: 2, size: size - 4 })], { x, y })
      : S.image(id, asset, { x, y, size });
  /** steps in 8 units up with a fade at `at`, leaves at `out` */
  const stepIn = (id: string, kids: string[], at: number, out: number) =>
    S.group(id, kids, {
      position: [[0, v(0, 8), 'hold'], [t(at), v(0, 8), OUT], [t(at + 0.45), v(0, 0), 'hold']],
      opacity: fade(0, [t(at), t(at + 0.3), 1], [t(out), t(out + 0.35), 0]),
    });
  const rule = (id: string, x: number, y: number, w: number) => S.rect(id, { x, y, w, h: 1, color: P.line });
  /** a rect whose centre and size are keyed */
  const krect = (id: string, o: { pos: K<V>[]; size: K<{ width: number; height: number }>[]; r: number; color: Color | K<Color>[] }) =>
    S.add({
      ...base(id, { outTick: END, position: keyed(`${id}.p`, o.pos as never) as never }),
      type: 'rect',
      size: keyed(`${id}.s`, o.size as never),
      cornerRadius: constant(o.r),
      style: { fill: fill(Array.isArray(o.color) ? keyed(`${id}.c`, o.color as never) : o.color, 1) },
    } as SceneNode);
  const dot = (id: string, cx: number, cy: number, d: number, color: Color) =>
    S.add({ ...base(id, { outTick: END, x: cx, y: cy }), type: 'ellipse', size: constant({ width: d, height: d }), style: { fill: fill(color) } } as SceneNode);
  return { S, U, P, END, dark, say, frag, mark, stepIn, rule, krect, dot };
}

const CHECK = 'M20 6 9 17l-5-5';

// ------------------------------------------------------------------------------------------ agents
panel('panel-agents', 640, t(7.6), ['claude', 'plane', 'linkedin'], ({ S, U, P, END, say, frag, mark, rule, n, W, H }) => {
  const roots: string[] = [];
  // desktop: in 60, down 48, cut right and bottom; phone: centred, 18 in each side, cut by the bottom
  const X = n ? 18 : 60;
  const Y = n ? 18 : 48;
  const FW = n ? W - 36 : W;
  const IN = n ? 16 : 20;
  const R = X + FW - IN;
  // phone: the steps sit closer, so the scheduled post ends clear of the panel's bottom edge
  const ASK = n ? 60 : 68;
  const ASKH = n ? 34 : 38;
  const TOOL = n ? 106 : 124;
  const REPLY = n ? 56 : 64;
  const POST = n ? 78 : 92;
  const DONE = 1.7;
  const RESET = 6.7;
  roots.push(frag('win', X, Y, FW, H));
  roots.push(mark('cl', 'claude', X + 18, Y + 15, 18));
  roots.push(say('cl-n', X + 44, Y + 24, 'Claude', 13, P.ink, { weight: 520 }));
  roots.push(rule('rule', X, Y + 48, FW - (n ? 0 : X)));
  const ask = n ? 'Schedule the Northwind post.' : 'Schedule the Northwind post for Tuesday morning.';
  const aw = n ? 212 : 330;
  roots.push(S.rect('ask', { x: n ? R - aw : X + 202, y: Y + ASK, w: aw, h: ASKH, r: 12, color: P.tint }));
  roots.push(say('ask-t', (n ? R - aw : X + 202) + 16, Y + ASK + ASKH / 2, ask, 13, P.ink));
  const TY = Y + TOOL;
  const TW = n ? FW - 2 * IN : 316;
  roots.push(S.rect('tool', { x: X + IN, y: TY, w: TW, h: 36, r: 10, line: P.line }));
  roots.push(S.image('tool-mark', 'plane', { x: X + IN + 12, y: TY + 10, size: 16 }));
  roots.push(say('tool-n', X + IN + 36, TY + 18, 'ContentOS', 13, P.ink, { weight: 520 }));
  roots.push(say('tool-a', X + IN + 110, TY + 18, 'Schedule post', 13, P.ink2));
  const sx = X + IN + TW - 20;
  const sy = TY + 18;
  // trim draws chords between vertices, so the spinner's arc is sampled finely
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
        rotation: keyed('spin.r', [[0, { x: 0, y: 0, z: 0 }, 'linear'], [END, { x: 0, y: 0, z: 360 * 7 }]] as never) as never,
        opacity: keyed('spin.o', fade(1, [t(DONE - 0.1), t(DONE + 0.05), 0], [t(RESET + 0.2), t(RESET + 0.4), 1]) as never) as never,
      }),
      type: 'group',
      children: ['spin-arc'],
    } as SceneNode),
  );
  roots.push(U.path('check', CHECK, { stroke: P.ink, width: 2.2, x: sx - 7, y: sy - 7, scale: 0.58, end: [[0, 0, 'hold'], [t(DONE), 0, OUT], [t(DONE + 0.3), 1, 'hold'], [t(RESET), 1, OUT], [t(RESET + 0.3), 0, 'hold']] }));
  roots.push(say('reply', X + IN, TY + REPLY, n ? 'Done. Out Tuesday, 9:00 AM.' : 'Done. It goes out Tuesday at 9:00 AM on LinkedIn.', n ? 13.5 : 14, P.ink, { words: [DONE + 0.25, DONE + 1.0, RESET] }));
  const PY = TY + POST;
  roots.push(
    S.group('post', [
      S.rect('post-bg', { x: X + IN, y: PY, w: n ? TW : 400, h: n ? 64 : 120, r: 10, line: P.line }),
      mark('post-li', 'linkedin', X + IN + 14, PY + (n ? 13 : 14), 16),
      say('post-t', X + IN + 38, PY + (n ? 21 : 22), n ? 'We almost lost Northwind.' : 'We almost lost Northwind in week two.', 13, P.ink, { weight: 520 }),
      say('post-m', X + IN + 14, PY + (n ? 44 : 48), 'Scheduled · Tue 9:00 AM', 12, P.ink3),
    ], {
      position: [[0, v(0, 8), 'hold'], [t(DONE + 1.0), v(0, 8), OUT], [t(DONE + 1.5), v(0, 0), 'hold']],
      opacity: fade(0, [t(DONE + 1.0), t(DONE + 1.35), 1], [t(RESET), t(RESET + 0.3), 0]),
    }),
  );
  void R;
  return roots;
});

// ------------------------------------------------------------------------------------------ autopilot
panel('panel-autopilot', 440, t(7.6), ['linkedin', 'x'], ({ P, say, frag, mark, stepIn, rule, krect, dot, dark, n, W, H }) => {
  const roots: string[] = [];
  // centred on both: the window sits in the middle of the panel, cut only by the bottom
  const FW = n ? W - 36 : 352;
  const X = (W - FW) / 2;
  const Y = n ? 26 : 44;
  const IN = n ? 16 : 18;
  const R = X + FW - IN;
  const ON = 1.1;
  const OFF = 6.7;
  roots.push(frag('win', X, Y, FW, H));
  // the account
  roots.push(dot('av', X + IN + 15, Y + 33, 30, P.avatar));
  roots.push(say('av-i', X + IN + 15, Y + 33, 'MC', 11, P.ink2, { weight: 600, align: 'center', w: 40 }));
  roots.push(say('nm', X + IN + 40, Y + 25, 'Maya Chen', 13, P.ink, { weight: 520 }));
  roots.push(say('when', X + IN + 40, Y + 43, n ? 'Weekdays · 9:00 AM' : 'Every weekday · 9:00 AM', 12, P.ink3));
  // the switch: off is a tint, on is ink
  const track: K<Color>[] = [[0, P.track, 'hold'], [t(ON), P.track, OUT], [t(ON + 0.22), P.on, 'hold'], [t(OFF), P.on, OUT], [t(OFF + 0.22), P.track, 'hold']];
  roots.push(krect('sw', { pos: [[0, v(R - 18, Y + 33), 'hold']], size: [[0, { width: 36, height: 20 }, 'hold']], r: 10, color: track }));
  const a = v(R - 26, Y + 33);
  const b = v(R - 10, Y + 33);
  const knobOff = dark ? c('#ECEEF0') : P.knob;
  roots.push(
    krect('sw-k', {
      pos: [[0, a, 'hold'], [t(ON), a, INOUT], [t(ON + 0.22), b, 'hold'], [t(OFF), b, INOUT], [t(OFF + 0.22), a, 'hold']],
      size: [[0, { width: 16, height: 16 }, 'hold']],
      r: 8,
      color: [[0, knobOff, 'hold'], [t(ON), knobOff, OUT], [t(ON + 0.22), P.knob, 'hold'], [t(OFF), P.knob, OUT], [t(OFF + 0.22), knobOff, 'hold']],
    }),
  );
  roots.push(rule('rule', X, Y + 66, FW));
  // paused, then what is coming up
  roots.push(say('paused', X + IN, Y + 92, n ? 'Paused. Nothing publishes yet.' : 'Paused. Nothing publishes while this is off.', 12.5, P.ink3, { opacity: fade(1, [t(ON), t(ON + 0.2), 0], [t(OFF + 0.4), t(OFF + 0.7), 1]) }));
  roots.push(say('next', X + IN, Y + 92, 'Coming up next', 12, P.ink3, { weight: 520, opacity: fade(0, [t(ON + 0.2), t(ON + 0.45), 1], [t(OFF), t(OFF + 0.3), 0]) }));
  const posts = [
    { s: n ? 'Northwind, week two.' : 'We almost lost Northwind.', when: 'Tue 9:00', logo: 'linkedin' },
    { s: n ? 'Our first AE.' : 'What our first AE taught us.', when: 'Wed 9:00', logo: 'x' },
    { s: n ? 'One onboarding call.' : 'One onboarding call, not six.', when: 'Thu 9:00', logo: 'linkedin' },
    { s: 'Ship notes, week 44.', when: 'Fri 9:00', logo: 'x' },
  ].slice(0, n ? 3 : 4); // phones show three, all clear of the bottom edge
  posts.forEach((p, i) => {
    const y = Y + 110 + i * 46;
    const kids = [
      ...(i ? [rule(`p${i}-rule`, X + IN, y - 4, FW - 2 * IN)] : []),
      mark(`p${i}-lg`, p.logo, X + IN, y + 13, 16),
      say(`p${i}-s`, X + IN + 26, y + 21, p.s, 13, P.ink),
      say(`p${i}-w`, R, y + 21, p.when, 12, P.ink3, { align: 'right', w: 90 }),
    ];
    roots.push(stepIn(`p${i}`, kids, ON + 0.35 + i * 0.05, OFF - 0.1));
  });
  return roots;
});

// ------------------------------------------------------------------------------------------ tools
panel('panel-tools', 440, t(7.6), ['slack', 'plane', 'hubspot'], ({ S, P, say, frag, stepIn, rule, n, W, H }) => {
  const roots: string[] = [];
  const X = n ? 18 : 76;
  const Y = n ? 22 : 40;
  const FW = n ? W - 36 : 420;
  const AT = 1.2;
  const OUTT = 6.7;
  roots.push(frag('win', X, Y, FW, H));
  roots.push(S.image('sl', 'slack', { x: X + 16, y: Y + 14, size: 16 }));
  roots.push(say('ch', X + 40, Y + 22, '# leads', 13, P.ink, { weight: 560 }));
  roots.push(rule('rule', X, Y + 44, FW));
  // a message from ContentOS, as Slack shows an app's post
  const msg = (id: string, y: number, when: string, lines: [string, Color, number][]) => [
    S.rect(`${id}-av`, { x: X + 16, y, w: 30, h: 30, r: 7, color: c('#FFFFFF'), line: P.line }),
    S.image(`${id}-pl`, 'plane', { x: X + 22, y: y + 6, size: 18 }),
    say(`${id}-n`, X + 56, y + 8, 'ContentOS', 13, P.ink, { weight: 650 }),
    S.rect(`${id}-app`, { x: X + 128, y: y + 1, w: 30, h: 15, r: 3, color: P.tint }),
    say(`${id}-app-t`, X + 143, y + 8, 'APP', 9.5, P.ink2, { weight: 650, align: 'center', w: 30 }),
    say(`${id}-tm`, X + 166, y + 8, when, 12, P.ink3),
    ...lines.map(([s, col, wgt], i) => say(`${id}-l${i}`, X + 56, y + 29 + i * 20, s, 13, col, { weight: wgt })),
  ];
  roots.push(S.group('m1', msg('m1', Y + 60, 'Yesterday', [[n ? 'Owen accepted your connection.' : 'Owen Gallagher accepted your connection.', P.ink2, 400]])));
  const body: [string, Color, number][] = n
    ? [['New lead signal', P.ink, 650], ['Hannah Weiss commented on', P.ink, 400], ['two of your posts this week.', P.ink, 400]]
    : [['New lead signal', P.ink, 650], ['Hannah Weiss, Founder at Parcelry, commented', P.ink, 400], ['on two of your posts this week.', P.ink, 400]];
  const M2 = n ? 112 : 124;
  const m2 = msg('m2', Y + M2, '9:41 AM', body);
  // the attachment: synced to HubSpot; its bar is the one accent
  const ay = Y + M2 + 32 + body.length * 20;
  m2.push(S.rect('att-bar', { x: X + 56, y: ay, w: 3, h: 40, r: 1.5, color: P.accent }));
  m2.push(S.image('att-hs', 'hubspot', { x: X + 70, y: ay + 12, size: 16 }));
  m2.push(say('att-t', X + 94, ay + 20, n ? 'Added to HubSpot' : 'Added to HubSpot as a lead', 12.5, P.ink2));
  roots.push(stepIn('m2', m2, AT, OUTT));
  return roots;
});

// ------------------------------------------------------------------------------------------ breakout
panel('panel-breakout', 640, t(7.6), ['linkedin'], ({ P, say, frag, rule, krect, S, n, W, H }) => {
  const roots: string[] = [];
  // centred on both: the window sits in the middle of the panel, cut only by the bottom
  const FW = n ? W - 36 : 520;
  const X = (W - FW) / 2;
  const Y = n ? 26 : 40;
  const IN = n ? 16 : 20;
  const R = X + FW - IN;
  const RUN = [1.0, 2.4] as const;
  const OFF = 6.7;
  roots.push(frag('win', X, Y, FW, H));
  roots.push(say('h', X + IN, Y + 24, 'Analytics', 13, P.ink, { weight: 560 }));
  // platform tabs, LinkedIn chosen
  roots.push(S.rect('tab-on', { x: R - 150, y: Y + 12, w: 70, h: 24, r: 7, color: P.tint }));
  roots.push(say('tab-li', R - 115, Y + 24, 'LinkedIn', 12, P.ink, { weight: 520, align: 'center', w: 70 }));
  roots.push(say('tab-x', R - 64, Y + 24, 'X', 12, P.ink3, { align: 'center', w: 30 }));
  roots.push(say('tab-th', R - 22, Y + 24, 'Threads', 12, P.ink3, { align: 'center', w: 60 }));
  roots.push(rule('rule', X, Y + 48, FW));
  roots.push(say('bt', X + IN, Y + 72, 'Breakout tracker', 13, P.ink, { weight: 560 }));
  roots.push(say('bt2', X + IN, Y + 91, n ? 'Last 72 hours vs your usual post.' : 'Your last 72 hours against your usual post.', 12, P.ink3));
  const TX = X + IN;
  const TW = n ? FW - 2 * IN - 52 : 360;
  const rows = [
    { s: n ? 'We almost lost Northwind.' : 'We almost lost Northwind in week two.', r: 3.4, hot: true },
    { s: n ? 'Our first AE.' : 'What our first AE taught us.', r: 1.2 },
    { s: n ? 'One onboarding call.' : 'One onboarding call, not six.', r: 0.9 },
  ];
  rows.forEach((row, i) => {
    const y = Y + (n ? 112 : 118) + i * (n ? 52 : 58);
    roots.push(say(`r${i}-s`, TX, y, row.s, 13, P.ink, { weight: row.hot ? 520 : 400 }));
    roots.push(S.rect(`r${i}-tr`, { x: TX, y: y + 14, w: TW, h: 6, r: 3, color: P.track }));
    const full = (TW * row.r) / 4;
    if (row.hot) {
      roots.push(
        krect(`r${i}-bar`, {
          pos: [[0, v(TX + 9, y + 17), 'hold'], [t(RUN[0]), v(TX + 9, y + 17), INOUT], [t(RUN[1]), v(TX + full / 2, y + 17), 'hold'], [t(OFF), v(TX + full / 2, y + 17), OUT], [t(OFF + 0.4), v(TX + 9, y + 17), 'hold']],
          size: [[0, { width: 18, height: 6 }, 'hold'], [t(RUN[0]), { width: 18, height: 6 }, INOUT], [t(RUN[1]), { width: full, height: 6 }, 'hold'], [t(OFF), { width: full, height: 6 }, OUT], [t(OFF + 0.4), { width: 18, height: 6 }, 'hold']],
          r: 3,
          color: P.accent,
        }),
      );
      // the multiple counts up with the bar
      const steps = ['0.2×', '1.0×', '1.8×', '2.6×', '3.4×'];
      steps.forEach((s, k) => {
        const a = RUN[0] + ((RUN[1] - RUN[0]) * k) / (steps.length - 1);
        const b = k < steps.length - 1 ? RUN[0] + ((RUN[1] - RUN[0]) * (k + 1)) / (steps.length - 1) : OFF + 0.2;
        const op: K[] =
          k === 0
            ? [[0, 1, 'hold'], [t(b), 1, 'linear'], [t(b + 0.03), 0, 'hold'], [t(OFF + 0.2), 0, 'linear'], [t(OFF + 0.25), 1, 'hold']]
            : [[0, 0, 'hold'], [t(a), 0, 'linear'], [t(a + 0.03), 1, 'hold'], [t(b), 1, 'linear'], [t(b + 0.03), 0, 'hold']];
        roots.push(say(`r${i}-v${k}`, R, y + 9, s, 14, P.accent, { weight: 620, align: 'right', w: 80, opacity: op }));
      });
    } else {
      roots.push(S.rect(`r${i}-bar`, { x: TX, y: y + 14, w: full, h: 6, r: 3, color: P.ink3 }));
      roots.push(say(`r${i}-v`, R, y + 9, `${row.r.toFixed(1)}×`, 14, P.ink2, { weight: 560, align: 'right', w: 80 }));
    }
    // the usual mark on each track
    roots.push(S.rect(`r${i}-u`, { x: TX + TW / 4 - 0.75, y: y + 10, w: 1.5, h: 14, r: 0.75, color: P.ink3 }));
  });
  return roots;
});
