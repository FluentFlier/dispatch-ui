/**
 * The four boxes after Act 3: what else ContentOS does, one product fragment each, from the feature
 * handover v2 (live screens 3, 5, 17/18 and 20).
 *
 *   grid-autopilot  Autopilot: the account's toggle flips on, the next posts slide into "Coming up next"
 *   grid-agents     AI & API keys: the MCP URL types in, Copy flips to Copied, the one-click clients
 *                   light up (real Claude, Codex, Cursor and VS Code marks), publish/outreach stay opt-in
 *   grid-breakout   Analytics: the breakout tracker, a new post's "vs usual" bar running past 1x
 *   grid-tools      Accounts > Other tools: HubSpot, Apollo and Slack connect in turn, then a Slack lead signal
 *
 * Art direction
 *   mode      product fragments, not windows: the app's own cards and controls, large, on the box's surface
 *   palette   the app window's colours (lib/window.ts chrome), light and dark
 *   scale     440 x 280 each, shown from ~350 px (phones) to ~590 px (desktop), so type is 13 to 15 units
 *   loop      each plays its moment, holds, and resets quietly
 *
 *   pnpm tsx animations/grid-boxes.ts   (writes public/scene/grid-<name>/{light,dark}.json and the logo PNGs)
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
  stroke,
  validateAnimationDocument,
  withComputedRevision,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, INOUT, OUT, TPS, fade, scene, t, type K } from './lib/kit';
import { chrome, ui, yFor, type Chrome } from './lib/window';

const W = 440;
const H = 280;
const c = (h: string, a = 1): Color => ({ ...hex(h), a });

type Build = ReturnType<typeof scene> & ReturnType<typeof ui> & { C: Chrome; dark: boolean; END: number };
type Asset = { id: string; file: string; src: string };

function make(dark: boolean, END: number): Build {
  const S = scene(END);
  return { ...S, ...ui(S, END), C: chrome(dark), dark, END };
}

/** a card in the app's style */
function card(B: Build, id: string, x: number, y: number, w: number, h: number, o: { opacity?: K[]; r?: number } = {}) {
  return B.rect(id, { x, y, w, h, r: o.r ?? 14, color: B.C.card, line: B.C.cardLine, lineW: 1, ...(o.opacity ? { fo: o.opacity } : {}) });
}

/** a type line whose cap middle sits at `mid` */
function say(B: Build, id: string, x: number, mid: number, s: string, size: number, color: Color, o: { weight?: number; opacity?: K[]; align?: 'left' | 'right' | 'center'; w?: number; mono?: boolean } = {}) {
  const lh = Math.round(size * 1.4);
  if (o.mono) {
    const w = o.w ?? 600;
    const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    return B.text(id, { x: x0, y: yFor(mid, size, lh), s, size, color, mono: true, lh, opacity: o.opacity, w, align: o.align });
  }
  return B.line(id, { x, y: yFor(mid, size, lh), s, size, color, lh, weight: o.weight, opacity: o.opacity, align: o.align, w: o.w });
}

/** a white app-icon tile holding a brand mark, so the marks keep their own colours in both themes */
function tile(B: Build, id: string, asset: string, x: number, y: number, size: number, opacity?: K[]) {
  const pad = Math.round(size * 0.18);
  const bg = B.rect(`${id}-bg`, { x: 0, y: 0, w: size, h: size, r: size * 0.26, color: c('#FFFFFF'), line: B.dark ? c('#FFFFFF', 0) : c('#101118', 0.08), lineW: 1 });
  // TODO(apollo): no Apollo.io mark in simple-icons or the SVG Logos set; a letter until the brand file is supplied
  const im = asset === 'apollo' ? say(B, `${id}-im`, size / 2, size / 2, 'A', size * 0.5, c('#16171B'), { weight: 650, align: 'center', w: size }) : B.image(`${id}-im`, asset, { x: pad, y: pad, size: size - 2 * pad });
  return B.group(id, [bg, im], { x, y, opacity });
}

/** keyed rect (position and size animate), for fills, wipes and knobs */
function krect(B: Build, id: string, o: { pos: K<{ x: number; y: number; z: number }>[]; size: K<{ width: number; height: number }>[]; r: number; color: Color | K<Color>[]; opacity?: K[] }) {
  return B.add({
    ...base(id, { outTick: B.END, position: keyed(`${id}.p`, o.pos as never) as never, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined }),
    type: 'rect',
    size: keyed(`${id}.s`, o.size as never),
    cornerRadius: constant(o.r),
    style: { fill: fill(Array.isArray(o.color) ? keyed(`${id}.c`, o.color as never) : o.color, 1) },
  } as SceneNode);
}

const ICON_CHECK = 'M20 6 9 17l-5-5';

// --------------------------------------------------------------------------------------------- autopilot
function autopilot(dark: boolean) {
  const END = t(8.4);
  const B = make(dark, END);
  const { C } = B;
  const ON = 1.2;
  const OFF = 7.4;
  const roots: string[] = [];

  // the account card
  roots.push(card(B, 'acct', 16, 16, 408, 92));
  roots.push(B.image('who', 'maya', { x: 34, y: 34, size: 36 }));
  roots.push(say(B, 'name', 82, 44, 'Maya Chen', 15, C.text, { weight: 560 }));
  roots.push(say(B, 'when', 82, 64, 'Every day · 9:00 AM', 13, C.text2));
  roots.push(say(B, 'paused', 34, 90, 'Paused. Nothing publishes while this is off.', 12.5, C.text3, { opacity: fade(1, [t(ON), t(ON + 0.25), 0], [t(OFF), t(OFF + 0.3), 1]) }));
  roots.push(say(B, 'onair', 34, 90, 'On. Posting in your voice, on your schedule.', 12.5, C.pill.green.fg, { opacity: fade(0, [t(ON + 0.15), t(ON + 0.4), 1], [t(OFF), t(OFF + 0.25), 0]) }));

  // the switch
  const trackOff = dark ? c('#FFFFFF', 0.14) : c('#101118', 0.14);
  const trackOn = C.pill.blue.icon;
  roots.push(
    krect(B, 'sw-track', {
      pos: [[0, { x: 384, y: 50, z: 0 }, 'hold']],
      size: [[0, { width: 44, height: 26 }, 'hold']],
      r: 13,
      color: [[0, trackOff, 'hold'], [t(ON), trackOff, OUT], [t(ON + 0.3), trackOn, 'hold'], [t(OFF), trackOn, OUT], [t(OFF + 0.3), trackOff, 'hold']] as never,
    }),
  );
  roots.push(
    krect(B, 'sw-knob', {
      pos: [[0, { x: 375, y: 50, z: 0 }, 'hold'], [t(ON), { x: 375, y: 50, z: 0 }, INOUT], [t(ON + 0.32), { x: 393, y: 50, z: 0 }, 'hold'], [t(OFF), { x: 393, y: 50, z: 0 }, INOUT], [t(OFF + 0.32), { x: 375, y: 50, z: 0 }, 'hold']],
      size: [[0, { width: 20, height: 20 }, 'hold']],
      r: 10,
      color: c('#FFFFFF'),
    }),
  );

  // coming up next
  roots.push(say(B, 'next', 20, 132, 'Coming up next', 13, C.text3, { weight: 500, opacity: fade(0.5, [t(ON + 0.2), t(ON + 0.5), 1], [t(OFF), t(OFF + 0.3), 0.5]) }));
  const posts = [
    { day: 'Tue', s: 'We almost lost Northwind in week two.', logo: 'linkedin' },
    { day: 'Wed', s: 'What our first AE taught us.', logo: 'x' },
    { day: 'Thu', s: 'One onboarding call, not six.', logo: 'linkedin' },
  ];
  posts.forEach((p, i) => {
    const y = 150 + i * 42;
    const at = ON + 0.55 + i * 0.32;
    const kids = [
      card(B, `p${i}-bg`, 0, 0, 408, 36, { r: 10 }),
      tile(B, `p${i}-logo`, p.logo, 10, 8, 20),
      say(B, `p${i}-day`, 38, 18, `${p.day} 9:00`, 12, C.text3, { mono: true }),
      say(B, `p${i}-s`, 112, 18, p.s, 13.5, C.text),
    ];
    roots.push(
      B.group(`p${i}`, kids, {
        position: [[0, { x: 16, y: y + 14, z: 0 }, 'hold'], [t(at), { x: 16, y: y + 14, z: 0 }, OUT], [t(at + 0.5), { x: 16, y, z: 0 }, 'hold']],
        opacity: fade(0, [t(at), t(at + 0.4), 1], [t(OFF - 0.2 + i * 0.05), t(OFF + 0.2 + i * 0.05), 0]),
      }),
    );
  });
  const assets: Asset[] = [
    { id: 'maya', file: 'maya.webp', src: 'public/people/maya.webp' },
    { id: 'linkedin', file: 'linkedin.png', src: 'public/images/brands/linkedin.png' },
    { id: 'x', file: 'x.png', src: 'public/images/brands/x.png' },
  ];
  return finish('grid-autopilot', dark, B, roots, assets);
}

// --------------------------------------------------------------------------------------------- agents
function agents(dark: boolean) {
  const END = t(8.4);
  const B = make(dark, END);
  const { C } = B;
  const TYPE = [0.5, 1.9] as const;
  const COPY = 2.3;
  const OFF = 7.5;
  const roots: string[] = [];
  const reset = (v: number): [number, number, number] => [t(OFF), t(OFF + 0.35), v];

  // the box's own title names it, so the fragment starts at the field (and sits centred: DY up)
  const DY = 28;

  // the URL field: the address types in behind a wipe
  const field = dark ? c('#18222A') : c('#F4F3EF');
  roots.push(B.rect('url-bg', { x: 16, y: 68, w: 300, h: 42, r: 10, color: field, line: C.tintLine, lineW: 1 }));
  roots.push(say(B, 'url', 32, 89, 'https://trycos.ai/api/mcp', 13.5, C.text, { mono: true }));
  const textW = 220;
  roots.push(
    krect(B, 'url-wipe', {
      pos: [[0, { x: 32 + textW / 2 + 2, y: 89, z: 0 }, 'hold'], [t(TYPE[0]), { x: 32 + textW / 2 + 2, y: 89, z: 0 }, 'linear'], [t(TYPE[1]), { x: 32 + textW + 2 + 1, y: 89, z: 0 }, 'hold'], [t(OFF + 0.35), { x: 32 + textW + 3, y: 89, z: 0 }, 'hold'], [t(OFF + 0.4), { x: 32 + textW / 2 + 2, y: 89, z: 0 }, 'hold']],
      size: [[0, { width: textW + 4, height: 24 }, 'hold'], [t(TYPE[0]), { width: textW + 4, height: 24 }, 'linear'], [t(TYPE[1]), { width: 0, height: 24 }, 'hold'], [t(OFF + 0.35), { width: 0, height: 24 }, 'hold'], [t(OFF + 0.4), { width: textW + 4, height: 24 }, 'hold']],
      r: 0,
      color: field,
    }),
  );
  // the copy button
  roots.push(B.rect('copy-bg', { x: 326, y: 68, w: 98, h: 42, r: 10, color: C.text }));
  roots.push(say(B, 'copy', 375, 89, 'Copy', 13.5, dark ? c('#0C1317') : c('#FFFFFF'), { weight: 520, align: 'center', w: 98, opacity: fade(1, [t(COPY), t(COPY + 0.2), 0], [t(OFF), t(OFF + 0.3), 1]) }));
  roots.push(say(B, 'copied', 383, 89, 'Copied', 13.5, dark ? c('#0C1317') : c('#FFFFFF'), { weight: 520, align: 'center', w: 98, opacity: fade(0, [t(COPY + 0.1), t(COPY + 0.3), 1], reset(0)) }));
  roots.push(B.path('copied-tick', ICON_CHECK, { stroke: dark ? c('#0C1317') : c('#FFFFFF'), width: 2.4, x: 339, y: 82, scale: 0.6, opacity: fade(0, [t(COPY + 0.1), t(COPY + 0.3), 1], reset(0)) }));

  // one-click clients
  roots.push(say(B, 'one', 20, 136, 'Add it in one click', 13, C.text3, { weight: 500 }));
  const clients = [
    { id: 'claude', name: 'Claude' },
    { id: 'codex', name: 'Codex' },
    { id: 'cursor', name: 'Cursor' },
    { id: 'vscode', name: 'VS Code' },
  ];
  clients.forEach((k, i) => {
    const x = 16 + i * 103;
    const at = COPY + 0.5 + i * 0.28;
    const lit = fade(0.42, [t(at), t(at + 0.35), 1], reset(0.42));
    roots.push(B.rect(`c${i}-bg`, { x, y: 152, w: 100, h: 44, r: 11, color: C.card, line: C.cardLine, lineW: 1 }));
    roots.push(
      B.rect(`c${i}-ring`, { x, y: 152, w: 100, h: 44, r: 11, line: C.pill.blue.icon, lineW: 1.5, lo: fade(0, [t(at), t(at + 0.35), 0.9], reset(0)) }),
    );
    roots.push(tile(B, `c${i}-t`, k.id, x + 9, 162, 24, lit));
    roots.push(say(B, `c${i}-n`, x + 40, 174, k.name, 12.5, C.text, { weight: 500, opacity: lit }));
  });

  // scopes: read and write on, publish and outreach opt-in
  const scopes = [
    { s: 'Read', on: true },
    { s: 'Write', on: true },
    { s: 'Publish', on: false },
    { s: 'Outreach', on: false },
  ];
  scopes.forEach((k, i) => {
    const x = 20 + i * 100;
    roots.push(B.rect(`s${i}-box`, { x, y: 222, w: 16, h: 16, r: 4.5, ...(k.on ? { color: C.pill.blue.icon } : { line: C.text3, lineW: 1.4 }) }));
    if (k.on) roots.push(B.path(`s${i}-tick`, ICON_CHECK, { stroke: c('#FFFFFF'), width: 2.2, x: x + 2, y: 224, scale: 0.5 }));
    roots.push(say(B, `s${i}-n`, x + 24, 230, k.s, 13, k.on ? C.text : C.text3));
  });
  roots.push(say(B, 'optin', 20, 262, 'Publish and outreach are opt-in.', 12.5, C.text3));

  const assets: Asset[] = clients.map((k) => ({ id: k.id, file: `${k.id}.png`, src: `animations/assets/logos/${k.id}.png` }));
  return finish('grid-agents', dark, B, [B.group('all', roots, { x: 0, y: -DY })], assets);
}

// --------------------------------------------------------------------------------------------- breakout
function breakout(dark: boolean) {
  const END = t(8.4);
  const B = make(dark, END);
  const { C } = B;
  const RUN = [0.8, 3.0] as const;
  const OFF = 7.5;
  const roots: string[] = [];
  const reset = (v: number): [number, number, number] => [t(OFF), t(OFF + 0.35), v];

  // the box's own title names it; the rows sit centred (DY up)
  const DY = 24;

  const X0 = 20;
  const TW = 330; // the track, 0x to 4x
  const at = (r: number) => X0 + (TW * r) / 4;
  const rows = [
    { s: 'We almost lost Northwind in week two.', when: 'Today', r: 3.4, hot: true },
    { s: 'What our first AE taught us about discovery.', when: 'Oct 22', r: 1.2 },
    { s: 'Ship notes, week 44: replies got faster.', when: 'Oct 15', r: 0.8 },
  ];
  // the usual line, through every row
  roots.push(say(B, 'usual-l', at(1), 132, '1× usual', 11, C.text3, { mono: true, w: 80, align: 'center' }));
  rows.forEach((row, i) => {
    const y = 100 + i * 58;
    roots.push(say(B, `r${i}-s`, X0, y, row.s, 13.5, C.text, { weight: row.hot ? 520 : 400 }));
    if (!row.hot) roots.push(say(B, `r${i}-w`, 424, y, row.when, 12, C.text3, { mono: true, align: 'right', w: 80 }));
    roots.push(B.rect(`r${i}-track`, { x: X0, y: y + 16, w: TW, h: 8, r: 4, color: C.track }));
    roots.push(B.rect(`r${i}-usual`, { x: at(1) - 0.75, y: y + 11, w: 1.5, h: 18, r: 0.75, color: C.text3 }));
    const full = (TW * row.r) / 4;
    const tone = row.hot ? C.pill.blue.icon : C.text3;
    const g0 = row.hot ? RUN[0] : 0.2 + i * 0.12;
    const g1 = row.hot ? RUN[1] : g0 + 0.7;
    roots.push(
      krect(B, `r${i}-bar`, {
        pos: [[0, { x: X0 + 2, y: y + 20, z: 0 }, 'hold'], [t(g0), { x: X0 + 2, y: y + 20, z: 0 }, row.hot ? INOUT : OUT], [t(g1), { x: X0 + full / 2, y: y + 20, z: 0 }, 'hold'], [t(OFF), { x: X0 + full / 2, y: y + 20, z: 0 }, OUT], [t(OFF + 0.4), { x: X0 + 2, y: y + 20, z: 0 }, 'hold']],
        size: [[0, { width: 4, height: 8 }, 'hold'], [t(g0), { width: 4, height: 8 }, row.hot ? INOUT : OUT], [t(g1), { width: full, height: 8 }, 'hold'], [t(OFF), { width: full, height: 8 }, OUT], [t(OFF + 0.4), { width: 4, height: 8 }, 'hold']],
        r: 4,
        color: tone,
      }),
    );
    if (row.hot) {
      // the multiple counts up beside the track as the bar runs
      const steps = ['1.0×', '1.6×', '2.2×', '2.8×', '3.4×'];
      steps.forEach((v, k) => {
        const a = RUN[0] + ((RUN[1] - RUN[0]) * k) / (steps.length - 1);
        const b = k < steps.length - 1 ? RUN[0] + ((RUN[1] - RUN[0]) * (k + 1)) / (steps.length - 1) : OFF;
        roots.push(say(B, `r${i}-v${k}`, 424, y + 20, v, 14, C.pill.blue.fg, { weight: 600, align: 'right', w: 60, opacity: [[0, 0, 'hold'], [t(a), 0, 'linear'], [t(a + 0.05), 1, 'hold'], [t(b), 1, 'linear'], [t(b + 0.05), 0, 'hold']] }));
      });
      const pillAt = RUN[0] + (RUN[1] - RUN[0]) * 0.55;
      roots.push(
        B.group(`r${i}-break`, [B.rect(`r${i}-pbg`, { x: 0, y: 0, w: 98, h: 22, r: 11, color: C.pill.green.bg }), say(B, `r${i}-pt`, 49, 11, 'Breaking out', 11.5, C.pill.green.fg, { weight: 560, align: 'center', w: 98 })], {
          position: [[0, { x: 326, y: y - 11, z: 0 }, 'hold']],
          opacity: fade(0, [t(pillAt), t(pillAt + 0.3), 1], reset(0)),
        }),
      );
    } else {
      roots.push(say(B, `r${i}-v`, 424, y + 20, `${row.r.toFixed(1)}×`, 14, C.text2, { weight: 560, align: 'right', w: 60, opacity: fade(0, [t(g1 - 0.2), t(g1), 1]) }));
    }
  });
  return finish('grid-breakout', dark, B, [B.group('all', roots, { x: 0, y: -DY })], []);
}

// --------------------------------------------------------------------------------------------- tools
function tools(dark: boolean) {
  const END = t(9);
  const B = make(dark, END);
  const { C } = B;
  const OFF = 8.1;
  const roots: string[] = [];
  const reset = (v: number): [number, number, number] => [t(OFF), t(OFF + 0.35), v];

  // the box's own title names it; the rows sit centred (DY up)
  const DY = 30;
  const list = [
    { id: 'hubspot', name: 'HubSpot', what: 'CRM contacts stay in sync', at: 0.9 },
    { id: 'apollo', name: 'Apollo', what: 'Prospect research', at: 1.6 },
    { id: 'slack', name: 'Slack', what: 'New lead signals', at: 2.3 },
  ];
  list.forEach((k, i) => {
    const y = 66 + i * 48;
    roots.push(card(B, `t${i}-bg`, 16, y, 408, 42, { r: 11 }));
    roots.push(tile(B, `t${i}-t`, k.id, 26, y + 8, 26));
    roots.push(say(B, `t${i}-n`, 62, y + 21, k.name, 14, C.text, { weight: 560 }));
    roots.push(say(B, `t${i}-w`, 136, y + 21, k.what, 13, C.text2));
    // Connect, then Connected
    const conn = fade(1, [t(k.at), t(k.at + 0.2), 0], reset(1));
    const done = fade(0, [t(k.at + 0.1), t(k.at + 0.35), 1], reset(0));
    roots.push(B.rect(`t${i}-cb`, { x: 330, y: y + 8, w: 84, h: 26, r: 8, color: C.text, fo: conn }));
    roots.push(say(B, `t${i}-c`, 372, y + 21, 'Connect', 12.5, dark ? c('#0C1317') : c('#FFFFFF'), { weight: 520, align: 'center', w: 84, opacity: conn }));
    roots.push(B.rect(`t${i}-db`, { x: 312, y: y + 8, w: 102, h: 26, r: 13, color: C.pill.green.bg, fo: done }));
    roots.push(B.path(`t${i}-dk`, ICON_CHECK, { stroke: C.pill.green.icon, width: 2.4, x: 321, y: y + 14, scale: 0.55, opacity: done }));
    roots.push(say(B, `t${i}-d`, 339, y + 21, 'Connected', 12.5, C.pill.green.fg, { weight: 560, opacity: done }));
  });

  // a lead signal arrives in Slack
  const SIG = 3.2;
  const msg = [
    card(B, 'm-bg', 0, 0, 408, 66, { r: 12 }),
    tile(B, 'm-t', 'slack', 12, 12, 26),
    say(B, 'm-who', 48, 22, 'ContentOS', 13, C.text, { weight: 600 }),
    say(B, 'm-app', 120, 22, 'APP', 10.5, C.text3, { weight: 600 }),
    say(B, 'm-s', 48, 44, 'Lead signal: Hannah Weiss engaged twice this week.', 13, C.text2),
  ];
  roots.push(
    B.group('msg', msg, {
      position: [[0, { x: 16, y: 222, z: 0 }, 'hold'], [t(SIG), { x: 16, y: 222, z: 0 }, OUT], [t(SIG + 0.5), { x: 16, y: 208, z: 0 }, 'hold']],
      opacity: fade(0, [t(SIG), t(SIG + 0.4), 1], reset(0)),
    }),
  );
  const assets: Asset[] = [
    { id: 'hubspot', file: 'hubspot.png', src: 'animations/assets/logos/hubspot.png' },
    { id: 'slack', file: 'slack.png', src: 'animations/assets/logos/slack.png' },
  ];
  return finish('grid-tools', dark, B, [B.group('all', roots, { x: 0, y: -DY })], assets);
}

// --------------------------------------------------------------------------------------------- output
function finish(name: string, dark: boolean, B: Build, roots: string[], assets: Asset[]) {
  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-${name}-${dark ? 'dark' : 'light'}`,
    name: `ContentOS ${name}`,
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: B.END, displayStartTick: 0 },
    assets: Object.fromEntries(
      assets.map((a) => {
        const px = a.file === 'maya.webp' ? 160 : a.src.startsWith('public/images/brands') ? 64 : 128;
        return [a.id, { id: a.id, type: 'image', uri: a.file, width: px, height: px, mimeType: a.file.endsWith('.webp') ? 'image/webp' : 'image/png' }];
      }),
    ),
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: B.END, nodes: B.nodes, rootNodeIds: roots } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(name, JSON.stringify(diags).slice(0, 600));
  const pub = `public/scene/${name}`;
  const out = `animations/out/${name}`;
  mkdirSync(pub, { recursive: true });
  mkdirSync(out, { recursive: true });
  const file = dark ? 'dark.json' : 'light.json';
  writeFileSync(`${pub}/${file}`, JSON.stringify(doc));
  writeFileSync(`${out}/${file}`, JSON.stringify(doc));
  for (const a of assets) {
    copyFileSync(a.src, `${pub}/${a.file}`);
    copyFileSync(a.src, `${out}/${a.file}`);
  }
  console.log('wrote', name, file, (doc as { revision: string }).revision.slice(0, 14));
}

void stroke;
for (const dark of [false, true]) {
  autopilot(dark);
  agents(dark);
  breakout(dark);
  tools(dark);
}
