/**
 * The product window the landing sections share (Act 1's voice check, Act 2's lead sort): the hero
 * demo window's colours, and small builders for its type, pills and glyphs.
 */
import { base, constant, fill, hex, keyed, parseSvgPath, stroke, trim, type Color, type SceneNode } from '@clayzo/animation/authoring';
import type { K, scene } from './kit';

/** the hero demo window's own colours (src/components/site/demo/demo.css), light and dark */
export function chrome(dark: boolean) {
  const c = (h: string, a = 1): Color => ({ ...hex(h), a });
  return dark
    ? {
        win: c('#0C1317'),
        winLine: c('#FFFFFF', 0.08),
        winHi: c('#FFFFFF', 0),
        card: c('#141C21'),
        cardLine: c('#FFFFFF', 0.07),
        shadow: c('#000000', 0.5),
        tint: c('#FFFFFF', 0.03),
        tintLine: c('#FFFFFF', 0.06),
        tag: c('#FFFFFF', 0.07),
        text: c('#EBF0F2'),
        text2: c('#A1ABB2'),
        text3: c('#6B777F'),
        track: c('#FFFFFF', 0.08),
        pill: {
          apricot: { bg: c('#FFA774', 0.14), fg: c('#FFBE94'), icon: c('#F0804A') },
          ink: { bg: c('#FFFFFF', 0.08), fg: c('#A1ABB2'), icon: c('#6B777F') },
          blue: { bg: c('#6CC6EB', 0.16), fg: c('#B4E6F7'), icon: c('#2B9CCF') },
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
export type Chrome = ReturnType<typeof chrome>;
export type Tone = Chrome['pill']['ink'];

// Geist's cap height is ~0.71 em; a text node's first baseline sits one line height below its y
export const yFor = (capMid: number, size: number, lh: number) => capMid + size * 0.355 - lh;

/** Builders bound to one scene: type, stroked and filled paths, circles. */
export function ui(S: ReturnType<typeof scene>, END: number) {
  const { add } = S;

  /** one line of type; `animators` move or recolour parts of it */
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
      align?: 'left' | 'right' | 'center';
      w?: number;
      opacity?: K[];
      animators?: unknown[];
    },
  ) => {
    const w = o.w ?? 800;
    return add({
      ...base(id, {
        outTick: END,
        x: o.align === 'right' ? o.x - w : o.align === 'center' ? o.x - w / 2 : o.x,
        y: o.y,
        opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined,
      }),
      type: 'text',
      runs: constant([
        { text: o.s, fontFamily: 'Geist', fontSize: o.size, fontWeight: o.weight ?? 400, letterSpacing: 0, lineHeight: o.lh ?? Math.round(o.size * 1.4), color: o.color },
      ]),
      box: { width: w, height: 200 },
      wrap: 'none',
      align: o.align ?? 'left',
      verticalAlign: 'top',
      ...(o.animators ? { animators: o.animators } : {}),
    } as SceneNode);
  };

  /** a path, stroked or filled; `end` draws it on */
  const path = (id: string, d: string, o: { stroke?: Color; width?: number; fill?: Color; opacity?: K[]; end?: K[]; x?: number; y?: number; scale?: number }) =>
    add({
      ...base(id, { outTick: END, x: o.x ?? 0, y: o.y ?? 0, scale: o.scale ?? 1, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined }),
      type: 'path',
      path: constant(parseSvgPath(d).path),
      style: {
        ...(o.fill ? { fill: fill(o.fill) } : {}),
        ...(o.stroke ? { stroke: stroke(o.stroke, o.width ?? 1.5) } : {}),
      },
      ...(o.end ? { operators: [trim(`${id}.trim`, { start: constant(0), end: keyed(`${id}.te`, o.end as never) })] } : {}),
    } as SceneNode);

  const circle = (id: string, cx: number, cy: number, d: number, color: Color, opacity?: K[]) =>
    add({
      ...base(id, { outTick: END, x: cx, y: cy, opacity: opacity ? (keyed(`${id}.o`, opacity as never) as never) : undefined }),
      type: 'ellipse',
      size: constant({ width: d, height: d }),
      style: { fill: fill(color) },
    } as SceneNode);

  return { line, path, circle };
}
