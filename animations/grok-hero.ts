/**
 * The hero of /for/grok-bot: Grok Bot meets the ContentOS plane, and the two become the page's title.
 *
 * Art direction (after xAI's own Grok Bot icon: a black sphere whose pill eyes sit on its surface,
 * sliding and narrowing as it turns, morphing between moods; three loading dots while it thinks)
 *   verb      notice and follow: Grok Bot pops in and opens its eyes, looks around, then
 *             tracks the ContentOS plane as it flies a tilted orbit around it (behind it and in front,
 *             turning edge-on at the far ends as it banks), round-eyed when it buzzes past, happy when
 *             it comes round. Then both settle into a lockup, plane X bot, over "ContentOS for Grok Bot",
 *             and stay.
 *   geometry  a sphere with two pill eyes projected on it; the plane is the brand's own illustration;
 *             its trail is dots in the plane's four colours, the way Grok's thinking rings orbit it
 *   palette   the bot ink (pale on dark) with ground-coloured eyes; the plane in its own colours
 *   scale     1200 x 600 on desktop, 390 x 560 on phones (the lockup wraps to two lines)
 *   words     ContentOS for Grok Bot, and the page's one line under it
 *
 * Playback: the intro plays once, then an idle segment loops (a blink, a glance at the plane), through
 * the document's state machine.
 *
 *   pnpm tsx animations/grok-hero.ts   (writes public/scene/grok-hero/{light,dark}[-narrow].json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  keyed,
  marker,
  stateMachine,
  validateAnimationDocument,
  withComputedRevision,
  withStateMachine,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';
import { MARK } from './lib/mark';

// ------------------------------------------------------------------ time
const INTRO = 7.8; // the intro ends on the lockup
const IDLE = 4; // then this loops
const TOTAL = INTRO + IDLE;
// the timeline was authored from three loading dots; the piece now opens on the bot popping in, so
// it plays from S0 (every function below still reads authored time)
const S0 = 0.9;
const END = t(TOTAL - S0);
const ORB = [2.0, 6.0] as const; // the plane's orbit
// into the lockup, straight out of the orbit: the plane never stops until it lands
const LOCK = [6.0, 7.3] as const;
const STEP = 1 / 60; // sampled every frame, then thinned where a straight line between keys is exact
const FINE = 1 / 240; // the grid the smoothed channels are computed on

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const seg = (s: number, a: number, b: number) => clamp((s - a) / (b - a));
const smooth = (x: number) => x * x * (3 - 2 * x);
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const out = (x: number) => 1 - (1 - x) ** 3;
const backOut = (x: number) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
// a 0..1..0 bump centred on c, half-width w
const bump = (s: number, c: number, w: number) => {
  const k = 1 - Math.abs(s - c) / w;
  return k > 0 ? smooth(k) : 0;
};
// piecewise keyframes on numbers, eased between
function track(keys: [number, number][], s: number, ease = inOut) {
  if (s <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i += 1)
    if (s <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ease(seg(s, keys[i - 1][0], keys[i][0])));
  return keys[keys.length - 1][1];
}

// cubic Hermite from p0 (velocity m0) to p1 (velocity m1), all over one unit of u: the pieces of the
// plane's flight meet with the same speed and heading, so it never lurches or stops dead
type V2 = { x: number; y: number };
function hermite(p0: V2, m0: V2, p1: V2, m1: V2, u: number): V2 {
  const u2 = u * u;
  const u3 = u2 * u;
  const a = 2 * u3 - 3 * u2 + 1;
  const b = u3 - 2 * u2 + u;
  const c = -2 * u3 + 3 * u2;
  const d = u3 - u2;
  return { x: a * p0.x + b * m0.x + c * p1.x + d * m1.x, y: a * p0.y + b * m0.y + c * p1.y + d * m1.y };
}

// a channel over the intro, computed on a fine grid and softened with a Gaussian (sigma in seconds), so
// a heading flip becomes a roll; the idle segment, which loops, reads the function itself
function softened(f: (s: number) => number, sigma: number) {
  const n = Math.ceil((INTRO - S0) / FINE) + 1;
  const raw = Array.from({ length: n }, (_, i) => f(S0 + i * FINE));
  const r = Math.max(1, Math.round((3 * sigma) / FINE));
  const w = Array.from({ length: 2 * r + 1 }, (_, j) => Math.exp(-(((j - r) * FINE) ** 2) / (2 * sigma * sigma)));
  const sm = raw.map((_, i) => {
    let acc = 0;
    let ws = 0;
    for (let j = -r; j <= r; j += 1) {
      acc += raw[Math.min(n - 1, Math.max(0, i + j))] * w[j + r];
      ws += w[j + r];
    }
    return acc / ws;
  });
  return (s: number) => {
    if (s >= INTRO) return f(s);
    const x = (Math.max(s, S0) - S0) / FINE;
    const i = Math.min(n - 2, Math.floor(x));
    return lerp(sm[i], sm[i + 1], x - i);
  };
}

// a channel that follows its target on a critically damped spring (omega in rad/s), the way eyes
// trail what they watch; it hands back to the function itself over the intro's last quarter second
function sprung(f: (s: number) => number, omega: number) {
  const n = Math.ceil((INTRO - S0) / FINE) + 1;
  const out: number[] = [];
  let x = f(S0);
  let v = 0;
  for (let i = 0; i < n; i += 1) {
    const s = S0 + i * FINE;
    const a = omega * omega * (f(s) - x) - 2 * omega * v;
    v += a * FINE;
    x += v * FINE;
    out.push(lerp(x, f(s), smooth(seg(s, INTRO - 0.25, INTRO))));
  }
  return (s: number) => {
    if (s >= INTRO) return f(s);
    const k = (Math.max(s, S0) - S0) / FINE;
    const i = Math.min(n - 2, Math.floor(k));
    return lerp(out[i], out[i + 1], k - i);
  };
}

// ------------------------------------------------------------------ layout
// the plane's drawing fills 0.861 of its 512 image across, centred; the bot is its disc. The X sits
// at the centre with the same gap to each mark's drawn edge, so the lockup is centred as seen
const PLANE_INK = 0.861;
function lockup(cx: number, y: number, botD: number, planeS: number, gap: number, arm: number, line: number) {
  // the plane's mass sits left of its drawn edge (only a wingtip reaches it), so the X reads centred a
  // little left of the measured middle
  const optical = gap * 0.17;
  return { planeX: cx - gap - (planeS * PLANE_INK) / 2, planeY: y, planeS, botX: cx + gap + botD / 2, botY: y, botD, cx: cx - optical, arm, line };
}
function layout(narrow: boolean) {
  return narrow
    ? {
        W: 390, H: 560, cx: 195, cy: 250, D: 150, midD: 15,
        orbit: { A: 168, B: 54, tilt: -14 }, plane: 72,
        lock: lockup(195, 176, 74, 86, 30, 10, 2.8),
        title: { y: 248, size: 38, w: 340, lh: 42 }, trail: 7,
        sub: { y: 344, size: 19, w: 370, lh: 28, lines: ['Connect ContentOS to your Grok Bot.', 'It drafts posts in your voice, and', 'nothing publishes until you say so.'] },
      }
    : {
        W: 1200, H: 600, cx: 600, cy: 288, D: 236, midD: 23,
        orbit: { A: 340, B: 96, tilt: -13 }, plane: 118,
        lock: lockup(600, 212, 112, 132, 46, 15, 3.6),
        title: { y: 328, size: 64, w: 1100, lh: 72 }, trail: 9,
        sub: { y: 418, size: 19, w: 1100, lh: 30, lines: ['Connect ContentOS to your Grok Bot. It drafts posts', 'in your voice, and nothing publishes until you say so.'] },
      };
}

// ------------------------------------------------------------------ the plane's path
// the orbit runs from the left end, through the front (bottom), round the right end and the back
// (top), and ends behind the bot's left side, heading left and clear of it: it enters quick and eases
// off, so the landing carries straight on from it and curls round into the lockup without crossing
// the bot's face
const SWEEP = 1.8 * Math.PI;
const orbitPhi = (s: number) => {
  const u = seg(s, ORB[0], ORB[1]);
  const e = u + 0.75 * u * (1 - u);
  return Math.PI - SWEEP * e;
};

function build(dark: boolean, narrow: boolean) {
  const L = layout(narrow);
  const { W, H, cx, cy } = L;
  const k = narrow ? 0.62 : 1;

  const orbitAt = (phi: number) => {
    const lx = L.orbit.A * Math.cos(phi);
    const ly = L.orbit.B * Math.sin(phi);
    const r = (L.orbit.tilt * Math.PI) / 180;
    return { x: cx + lx * Math.cos(r) - ly * Math.sin(r), y: cy + lx * Math.sin(r) + ly * Math.cos(r), z: Math.sin(phi) };
  };
  const start = orbitAt(Math.PI);
  const frontEnd = orbitAt(orbitPhi(ORB[1]));
  // the orbit's velocity (px per second) where the swoop joins it and where the landing leaves it
  const orbitVel = (s: number) => {
    const e = 1e-3;
    const a = orbitAt(orbitPhi(s - e));
    const b = orbitAt(orbitPhi(s + e));
    return { x: (b.x - a.x) / (2 * e), y: (b.y - a.y) / (2 * e) };
  };
  const vIn = orbitVel(ORB[0] + 1e-3);
  const vOut = orbitVel(ORB[1] - 1e-3);
  const SWOOP = [1.3, ORB[0]] as const;
  const frontSize = L.plane * (0.84 + 0.28 * frontEnd.z);
  // where the plane is, its depth (+ in front of the bot) and size
  const planeAt = (s: number) => {
    if (s < ORB[0]) {
      // it glides in from off the left edge, rising a little, and meets the orbit's left end at the
      // orbit's own speed and heading
      const T = SWOOP[1] - SWOOP[0];
      const u = seg(s, SWOOP[0], SWOOP[1]);
      const p0 = { x: -L.plane, y: cy - 150 * k };
      const c = { x: start.x - 40 * k, y: cy - 190 * k };
      const q = hermite(p0, { x: 2 * (c.x - p0.x), y: 2 * (c.y - p0.y) }, start, { x: vIn.x * T, y: vIn.y * T }, u);
      return { x: q.x, y: q.y, z: 0, size: L.plane * 0.84 };
    }
    if (s < LOCK[0]) {
      const o = orbitAt(orbitPhi(s));
      return { ...o, size: L.plane * (0.84 + 0.28 * o.z) };
    }
    // into the lockup: it carries on out of the orbit, turns, and glides to rest left of the bot
    const T = LOCK[1] - LOCK[0];
    const u = seg(s, LOCK[0], LOCK[1]);
    const q = hermite(frontEnd, { x: vOut.x * T, y: vOut.y * T }, { x: L.lock.planeX, y: L.lock.planeY }, { x: 0, y: 0 }, u);
    let yy = q.y;
    if (s > INTRO) yy += 3 * k * Math.sin((2 * Math.PI * (s - INTRO)) / IDLE); // idle: a slow bob
    return { x: q.x, y: yy, z: 0.3, size: lerp(frontSize, L.lock.planeS, smooth(u)) };
  };
  // the plane's heading from its path; it banks edge-on where it moves straight up or down, and
  // mirrors when it heads left, the way an orbit seen from the side looks
  const rawPose = (s: number) => {
    const e = 1 / 60;
    const a = planeAt(Math.max(0, s - e));
    const b = planeAt(Math.min(TOTAL, s + e));
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const sp = Math.hypot(vx, vy);
    const p = planeAt(s);
    let rot = 0;
    let flip = 1;
    if (sp > 0.05) {
      const alpha = (Math.atan2(vy, Math.abs(vx)) * 180) / Math.PI;
      const level = clamp(alpha, -70, 70) + 37; // the drawing's nose sits 45° up; keep a little lift
      const side = vx >= 0 ? 1 : -1;
      flip = side * smooth(clamp(Math.abs(vx) / sp / 0.35));
      rot = side > 0 ? level : -level;
    }
    // landing in the lockup: settle to the logo's own pose
    const land = smooth(seg(s, LOCK[1] - 0.35, LOCK[1]));
    rot = lerp(rot, 0, land);
    flip = lerp(flip, 1, land);
    if (s > INTRO) rot = 2 * Math.sin((2 * Math.PI * (s - INTRO)) / IDLE);
    return { ...p, rot, flip };
  };
  // the heading and the mirror, softened: where the plane turns past vertical it rolls through
  // edge-on instead of snapping round
  const rotS = softened((s) => rawPose(s).rot, 0.07);
  const flipS = softened((s) => rawPose(s).flip, 0.05);
  const planePose = (s: number) => ({ ...planeAt(s), rot: rotS(s), flip: flipS(s) });

  // ------------------------------------------------------------------ the bot
  const surprise = (() => {
    // the moment the plane crosses the front of the bot
    for (let s = ORB[0]; s < ORB[1]; s += 0.01) if (orbitPhi(s) <= Math.PI / 2) return s;
    return 2.6;
  })();
  const body = (s: number) => {
    // the three thinking dots, the middle one is the bot; it pops to full size and eyes open
    const pulse = 0.22 * Math.max(0, Math.sin(2 * Math.PI * (s / 0.9) - 0.8)) * (1 - seg(s, 0.75, 0.9));
    let D = s < 0.9 ? L.midD * (1 + pulse) : lerp(L.midD, L.D, backOut(seg(s, 0.9, 1.4)));
    let x = cx;
    let y = cy;
    const lk = inOut(seg(s, LOCK[0], LOCK[1]));
    D = lerp(D, L.lock.botD, lk);
    x = lerp(x, L.lock.botX, lk);
    y = lerp(y, L.lock.botY, lk);
    if (s > INTRO) D *= 1 + 0.012 * Math.sin((2 * Math.PI * (s - INTRO)) / IDLE);
    // it leans a touch toward the plane while it watches, and stretches when startled
    const pp = planeAt(s);
    const watch = seg(s, ORB[0], ORB[0] + 0.4) * (1 - seg(s, ORB[1], LOCK[0] + 0.2));
    x += watch * clamp((pp.x - cx) / (L.orbit.A * 2), -1, 1) * 10 * k;
    const st = 0.05 * bump(s, surprise + 0.12, 0.3);
    return { x, y, D, sx: 1 - st * 0.6, sy: 1 + st };
  };

  // where the eyes look: scripted at first, then they follow the plane (a beat behind it)
  const rawLook = (s: number) => {
    const sy = track([[1.4, 0], [1.6, -0.6], [1.9, -0.6], [2.12, 0.5], [2.35, 0.3]], s);
    const sp = track([[1.4, 0], [1.6, 0.04], [1.9, 0.06], [2.12, -0.02], [2.35, 0]], s);
    const p = planeAt(Math.max(0, s - 0.1));
    const b = { x: cx, y: cy };
    // turning the eyes past 0.64 would slide one off the sphere's rim
    const fy = clamp((p.x - b.x) / (L.D * 1.25), -1, 1) * 0.64;
    const fp = clamp(-(p.y - b.y) / (L.D * 1.1), -1, 1) * 0.6 + 0.18 * smooth(clamp(0.5 - p.z * 2.5));
    const follow = smooth(seg(s, 2.15, 2.45)) * (1 - smooth(seg(s, LOCK[0], LOCK[0] + 0.3)));
    let Y = lerp(sy, fy, follow);
    let P = lerp(sp, fp, follow);
    // in the lockup it glances at the plane beside it, then faces front
    const lk = smooth(seg(s, LOCK[0], LOCK[0] + 0.3));
    Y = lerp(Y, track([[LOCK[0], -0.5], [LOCK[1] + 0.2, -0.5], [INTRO - 0.1, 0]], s), lk);
    P = lerp(P, track([[LOCK[0], 0.04], [INTRO - 0.1, 0]], s), lk);
    if (s > INTRO) {
      const i = s - INTRO;
      Y = track([[0, 0], [1.4, 0], [1.7, -0.55], [2.5, -0.55], [2.85, 0], [IDLE, 0]], i);
      P = track([[0, 0], [1.4, 0], [1.7, 0.05], [2.5, 0.05], [2.85, 0], [IDLE, 0]], i);
    }
    return { Y, P };
  };
  // the gaze trails its target on a spring, so the eyes glide and settle instead of stepping
  const lookY = sprung((s) => rawLook(s).Y, 15);
  const lookP = sprung((s) => rawLook(s).P, 15);
  const look = (s: number) => ({ Y: lookY(s), P: lookP(s) });

  // the eyes' shape, in units of the bot's diameter: tall pills; a dash when shut; round when
  // startled; a tilted squint when happy
  type Ex = { w: number; h: number; tilt: number };
  const PILL: Ex = { w: 0.125, h: 0.29, tilt: 0 };
  const DASH: Ex = { w: 0.17, h: 0.04, tilt: 0 };
  const ROUND: Ex = { w: 0.2, h: 0.2, tilt: 0 };
  const HAPPY: Ex = { w: 0.19, h: 0.075, tilt: 14 };
  const exKeys: [number, Ex][] = [
    [0, DASH], [1.25, DASH], [1.5, PILL],
    [surprise - 0.05, PILL], [surprise + 0.12, ROUND], [surprise + 0.75, ROUND], [surprise + 1.0, PILL],
    [5.75, PILL], [6.0, HAPPY], [6.95, HAPPY], [7.2, PILL],
  ];
  const expr = (s: number): Ex => {
    let e: Ex = exKeys[exKeys.length - 1][1];
    if (s <= exKeys[0][0]) e = exKeys[0][1];
    else
      for (let i = 1; i < exKeys.length; i += 1)
        if (s <= exKeys[i][0]) {
          const [a, ea] = exKeys[i - 1];
          const [b, eb] = exKeys[i];
          const m = inOut(seg(s, a, b));
          e = { w: lerp(ea.w, eb.w, m), h: lerp(ea.h, eb.h, m), tilt: lerp(ea.tilt, eb.tilt, m) };
          break;
        }
    // blinks
    const bl = Math.max(bump(s, 2.02, 0.1), bump(s, 4.7, 0.1), bump(s, INTRO + 1.0, 0.1), bump(s, INTRO + 3.3, 0.1));
    return { w: lerp(e.w, DASH.w, bl), h: lerp(e.h, DASH.h, bl), tilt: e.tilt * (1 - bl) };
  };
  const AZ = 0.34;
  const eye = (s: number, side: -1 | 1) => {
    const b = body(s);
    const { Y, P } = look(s);
    const e = expr(s);
    const R = b.D / 2;
    const az = side * AZ + Y;
    const el = P;
    const x = b.x + R * Math.sin(az) * Math.cos(el) * b.sx;
    const y = b.y - R * Math.sin(el) * 0.92 * b.sy;
    const fx = clamp(Math.cos(az), 0.2, 1);
    const fy = clamp(Math.cos(el), 0.4, 1);
    const open = smooth(seg(s, 1.0, 1.25)); // no eyes while it is still a dot
    const w = Math.max(0.01, e.w * b.D * fx * open);
    const h = Math.max(0.01, e.h * b.D * fy * open);
    return { x, y, w, h, r: Math.min(w, h) / 2, rot: -side * e.tilt };
  };

  // ------------------------------------------------------------------ nodes
  const hexA = (h: string, a = 1): Color => {
    const n = Number.parseInt(h.slice(1), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
  };
  const C = dark
    ? { bot: hexA('#EEF2F4'), eye: hexA('#080F14'), dots: hexA('#7D888F'), ink: hexA('#EEF2F4'), ink2: hexA('#A7B1B8') }
    : { bot: hexA('#0E0F12'), eye: hexA('#FAF9F6'), dots: hexA('#8B8D94'), ink: hexA('#101114'), ink2: hexA('#4C4E57') };
  // the trail runs through the mark's own colours, shading from one to the next along the path
  const stops = [MARK.upper, MARK.lower].flatMap((f) => (typeof f === 'string' ? [f] : [...f])).map((h) => hexA(h));
  const trailColour = (n: number): Color => {
    const x = ((n * 0.035) % stops.length + stops.length) % stops.length;
    const i = Math.floor(x);
    const a = stops[i];
    const b = stops[(i + 1) % stops.length];
    const m = smooth(x - i);
    return { r: lerp(a.r, b.r, m), g: lerp(a.g, b.g, m), b: lerp(a.b, b.b, m), a: 1 };
  };

  const times: number[] = [];
  for (let i = 0; i * STEP <= TOTAL - S0 + 1e-6; i += 1) times.push(Math.min(TOTAL - S0, i * STEP));
  const v3 = (x: number, y: number, z = 0) => ({ x, y, z });
  // every frame, then thinned: a key is dropped wherever the straight line between its neighbours
  // already passes within `tol` of it, so smooth motion stays exact and still stretches cost nothing
  const nums = (v: unknown): number[] =>
    typeof v === 'number' ? [v] : Object.values(v as Record<string, number>).filter((x) => typeof x === 'number');
  const sampled = <T>(id: string, f: (s: number) => T, tol = 0.02) => {
    const vals = times.map((s) => f(s + S0));
    const vec = vals.map(nums);
    const keep = [0];
    let anchor = 0;
    for (let j = 2; j < vals.length; j += 1) {
      let ok = true;
      for (let m = anchor + 1; m < j && ok; m += 1) {
        const q = (times[m] - times[anchor]) / (times[j] - times[anchor]);
        for (let c = 0; c < vec[m].length; c += 1)
          if (Math.abs(vec[anchor][c] + (vec[j][c] - vec[anchor][c]) * q - vec[m][c]) > tol) ok = false;
      }
      if (!ok) {
        keep.push(j - 1);
        anchor = j - 1;
      }
    }
    keep.push(vals.length - 1);
    return keyed(id, keep.map((i, n) => [t(times[i]), vals[i], n === keep.length - 1 ? 'hold' : 'linear']) as never) as never;
  };

  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => ((nodes[n.id] = n), n.id);

  const planeNode = (id: string, front: boolean) =>
    add({
      ...base(id, {
        outTick: END,
        position: sampled(`${id}.p`, (s) => {
          const p = planePose(s);
          return v3(p.x, p.y);
        }),
        rotation: sampled(`${id}.r`, (s) => v3(0, 0, planePose(s).rot)),
        scale: sampled(`${id}.s`, (s) => {
          const p = planePose(s);
          const visible = s >= 1.35;
          const sc = p.size / 512;
          return v3(visible ? sc * p.flip : 0.0001, visible ? sc : 0.0001, 1);
        }, 0.0001),
        opacity: keyed(
          `${id}.o`,
          times
            .map((s0) => {
              const s = s0 + S0;
              const inFront = s < ORB[0] || s > ORB[1] || planeAt(s).z >= 0;
              return [t(s0), (front ? inFront : !inFront) ? 1 : 0, 'hold'] as [number, number, string];
            })
            .filter((k, i, all) => i === 0 || i === all.length - 1 || k[1] !== all[i - 1][1]) as never,
        ) as never,
      }),
      type: 'image',
      assetId: 'plane',
      size: constant({ width: 512, height: 512 }),
      fit: 'contain',
    } as SceneNode);

  // the trail: dots in the plane's colours dropped behind it as it orbits, fading where they fell
  const trailBack: string[] = [];
  const trailFront: string[] = [];
  let n = 0;
  for (let s = ORB[0] - 0.4; s < ORB[1] - 0.1; s += 0.02, n += 1) {
    const p = planePose(s);
    const e = 1 / 60;
    const a = planeAt(s - e);
    const b2 = planeAt(s + e);
    const vx = b2.x - a.x;
    const vy = b2.y - a.y;
    const sp = Math.hypot(vx, vy) || 1;
    const tail = v3(p.x - (vx / sp) * p.size * 0.42, p.y - (vy / sp) * p.size * 0.42);
    const depth = 0.75 + 0.3 * p.z;
    const d0 = L.trail * depth;
    const id = `trail${n}`;
    const life = 0.72;
    add({
      ...base(id, { outTick: END, x: tail.x, y: tail.y }),
      type: 'ellipse',
      size: keyed(`${id}.s`, [
        [0, { width: d0, height: d0 }, 'hold'],
        [t(s - S0), { width: d0, height: d0 }, { x1: 0.3, y1: 0, x2: 0.7, y2: 1 }],
        [t(s - S0 + life), { width: d0 * 0.25, height: d0 * 0.25 }, 'hold'],
        [END, { width: d0 * 0.25, height: d0 * 0.25 }],
      ] as never) as never,
      style: {
        fill: {
          color: constant(trailColour(n)),
          opacity: keyed(`${id}.o`, [
            [0, 0, 'hold'],
            [t(s - S0) - 4, 0, 'linear'],
            [t(s - S0), 0.95, { x1: 0.4, y1: 0, x2: 0.8, y2: 1 }],
            [t(s - S0 + life), 0, 'hold'],
            [END, 0],
          ] as never),
        },
      },
    } as SceneNode);
    (p.z < 0 ? trailBack : trailFront).push(id);
  }

  const planeBack = planeNode('plane-back', false);
  const botBody = add({
    ...base('bot', { outTick: END, position: sampled('bot.p', (s) => v3(body(s).x, body(s).y)) }),
    type: 'ellipse',
    size: sampled('bot.s', (s) => {
      const b = body(s);
      return { width: b.D * b.sx, height: b.D * b.sy };
    }),
    style: { fill: fill(C.bot) },
  } as SceneNode);
  const eyes = ([-1, 1] as const).map((side, i) =>
    add({
      ...base(`eye${i}`, {
        outTick: END,
        position: sampled(`eye${i}.p`, (s) => {
          const e = eye(s, side);
          return v3(e.x, e.y);
        }),
        rotation: sampled(`eye${i}.r`, (s) => v3(0, 0, eye(s, side).rot)),
      }),
      type: 'rect',
      size: sampled(`eye${i}.s`, (s) => {
        const e = eye(s, side);
        return { width: e.w, height: e.h };
      }),
      cornerRadius: sampled(`eye${i}.cr`, (s) => eye(s, side).r),
      style: { fill: fill(C.eye) },
    } as SceneNode),
  );
  const planeFront = planeNode('plane-front', true);

  // the lockup's connector: an X, centred between the two marks, popping in as they settle
  const xBars = [45, -45].map((deg, i) =>
    add({
      ...base(`x${i}`, { outTick: END, rotation: deg }),
      type: 'rect',
      size: constant({ width: L.lock.arm * 2, height: L.lock.line }),
      cornerRadius: constant(L.lock.line / 2),
      style: { fill: fill(C.dots) },
    } as SceneNode),
  );
  const cross = add({
    ...base('x', {
      outTick: END,
      x: L.lock.cx,
      y: L.lock.botY,
      scale: sampled('x.s', (s) => {
        const pop = Math.max(0.0001, backOut(seg(s, 6.95, 7.35)));
        return v3(pop, pop, 1);
      }, 0.002),
      rotation: sampled('x.r', (s) => v3(0, 0, -90 * (1 - out(seg(s, 6.95, 7.45))))),
    }),
    type: 'group',
    children: xBars,
  } as SceneNode);

  // the title, rising into place under the marks
  const tl = L.title;
  const title = add({
    ...base('title', {
      outTick: END,
      position: sampled('title.p', (s) => v3(cx - tl.w / 2, tl.y + 18 * k * (1 - out(seg(s, 6.95, 7.7))))),
      opacity: sampled('title.o', (s) => out(seg(s, 6.95, 7.55)), 0.003),
    }),
    type: 'text',
    // each run sets its own line: one line on desktop, two on phones
    runs: constant(
      (narrow ? ['ContentOS for', 'Grok Bot'] : ['ContentOS for Grok Bot']).map((text) => ({
        text,
        fontFamily: 'Geist',
        fontSize: tl.size,
        fontWeight: 600,
        letterSpacing: -0.035 * tl.size,
        lineHeight: tl.lh,
        color: C.ink,
      })),
    ),
    box: { width: tl.w, height: tl.lh * 2.4 },
    wrap: 'none',
    align: 'center',
    verticalAlign: 'top',
  } as SceneNode);

  // the line under it, a beat later, in the page's secondary ink (each run its own line)
  const sb = L.sub;
  const sub = add({
    ...base('sub', {
      outTick: END,
      position: sampled('sub.p', (s) => v3(cx - sb.w / 2, sb.y + 14 * k * (1 - out(seg(s, 7.1, 7.75))))),
      opacity: sampled('sub.o', (s) => out(seg(s, 7.1, 7.7)), 0.003),
    }),
    type: 'text',
    runs: constant(
      sb.lines.map((text) => ({ text, fontFamily: 'Geist', fontSize: sb.size, fontWeight: 400, letterSpacing: -0.01 * sb.size, lineHeight: sb.lh, color: C.ink2 })),
    ),
    box: { width: sb.w, height: sb.lh * (sb.lines.length + 1) },
    wrap: 'none',
    align: 'center',
    verticalAlign: 'top',
  } as SceneNode);

  const roots = [...trailBack, planeBack, botBody, ...eyes, ...trailFront, planeFront, cross, title, sub];

  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-grok-hero-${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`,
    name: 'ContentOS for Grok Bot',
    canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: { plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' } },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: roots } },
    markers: [marker('intro', 0, { durationTicks: t(INTRO - S0) }), marker('idle', t(INTRO - S0), { durationTicks: END - t(INTRO - S0) })],
    design: { tokens: { looping: false } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  const machine = stateMachine({ initial: 'intro' })
    .state('intro', { marker: 'intro', playback: 'once' })
    .state('idle', { marker: 'idle', playback: 'loop' })
    .on('complete', 'intro', 'idle');
  const withMachine = withStateMachine(doc, machine);
  assertValidAnimationDocument(withMachine);
  const diags = validateAnimationDocument(withMachine).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return withMachine;
}

const OUTDIR = 'public/scene/grok-hero';
mkdirSync(OUTDIR, { recursive: true });
mkdirSync('animations/out/grok-hero', { recursive: true });
for (const narrow of [false, true]) {
  for (const dark of [false, true]) {
    const doc = build(dark, narrow);
    const name = `${dark ? 'dark' : 'light'}${narrow ? '-narrow' : ''}`;
    writeFileSync(`${OUTDIR}/${name}.json`, JSON.stringify(doc));
    writeFileSync(`animations/out/grok-hero/${name}.json`, JSON.stringify(doc));
    console.log('wrote', name, (doc as { revision: string }).revision.slice(0, 16), Object.keys((doc as never as { compositions: { main: { nodes: object } } }).compositions.main.nodes).length, 'nodes');
  }
}
