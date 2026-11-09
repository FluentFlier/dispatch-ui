/**
 * Shared building blocks for the landing-page scenes (animations/act-*.ts).
 *
 * Every scene is built twice, light and dark, from one script: pass the palette in.
 * Text names the families Geist / Geist Mono; the page player supplies them
 * (familyFontLoader), the CLI resolves them from Google Fonts.
 */
import {
  base,
  constant,
  fill,
  hex,
  keyed,
  parseSvgPath,
  stroke,
  trim,
  type Color,
  type SceneNode,
} from '@clayzo/animation/authoring';

export const TPS = 240;
export const FPS = 60;
export const F = TPS / FPS;
/** seconds -> ticks, snapped to the 60 fps frame grid */
export const t = (sec: number) => Math.round((sec * TPS) / F) * F;

export const OUT = { x1: 0.23, y1: 1, x2: 0.32, y2: 1 };
export const INOUT = { x1: 0.65, y1: 0, x2: 0.35, y2: 1 };
export const GLIDE = { x1: 0.45, y1: 0, x2: 0.2, y2: 1 };
export const POP = { x1: 0.34, y1: 1.4, x2: 0.64, y2: 1 };
export const LINEAR = 'linear' as const;

export type Ease = object | 'hold' | 'linear';
export type K<T = number> = [number, T, Ease];

const rgba = (h: string, a: number): Color => ({ ...hex(h), a });

export type Palette = ReturnType<typeof palette>;
export function palette(dark: boolean) {
  return dark
    ? {
        dark: true,
        card: rgba('#1B1D2E', 0.92),
        cardLine: rgba('#FFFFFF', 0.09),
        tint: rgba('#FFFFFF', 0.05),
        ink: hex('#F1F1F5'),
        ink2: hex('#B6B8C6'),
        ink3: hex('#7D8092'),
        line: rgba('#FFFFFF', 0.16),
        skeleton: rgba('#FFFFFF', 0.08),
        core: hex('#F4F4F7'),
        coreInk: hex('#121318'),
        coreInk2: rgba('#121318', 0.62),
        coreLine: rgba('#121318', 0.1),
        blue: hex('#94A1FF'),
        blueSoft: rgba('#94A1FF', 0.16),
        apricot: hex('#FFA774'),
        apricotSoft: rgba('#FFA774', 0.16),
        green: hex('#4FD18B'),
        greenSoft: rgba('#4FD18B', 0.14),
      }
    : {
        dark: false,
        card: hex('#FFFFFF'),
        cardLine: rgba('#101118', 0.09),
        tint: rgba('#101118', 0.035),
        ink: hex('#101114'),
        ink2: hex('#4C4E57'),
        ink3: hex('#8A8C96'),
        line: rgba('#101118', 0.22),
        skeleton: rgba('#101118', 0.07),
        core: hex('#16171B'),
        coreInk: hex('#F6F6F8'),
        coreInk2: rgba('#F6F6F8', 0.62),
        coreLine: rgba('#FFFFFF', 0.1),
        blue: hex('#2F5BEA'),
        blueSoft: rgba('#2F5BEA', 0.1),
        apricot: hex('#F0804A'),
        apricotSoft: rgba('#F0804A', 0.12),
        green: hex('#22A565'),
        greenSoft: rgba('#22A565', 0.12),
      };
}

/** A tiny scene builder: nodes in a map, helpers that add and return ids. */
export function scene(END: number) {
  const nodes: Record<string, SceneNode> = {};
  const add = (n: SceneNode) => {
    nodes[n.id] = n;
    return n.id;
  };
  const v3 = (x: number, y: number) => ({ x, y, z: 0 });
  const s3 = (k: number) => ({ x: k, y: k, z: 1 });

  type Box = { x: number; y: number; w: number; h: number };
  const rect = (
    id: string,
    o: Box & { r?: number; color?: Color; colorK?: K<Color>[]; fo?: K[]; line?: Color; lineW?: number; lo?: K[]; dash?: number[] },
  ) =>
    add({
      ...base(id, { outTick: END, x: o.x + o.w / 2, y: o.y + o.h / 2 }),
      type: 'rect',
      size: constant({ width: o.w, height: o.h }),
      cornerRadius: constant(o.r ?? 0),
      style: {
        ...(o.color || o.colorK
          ? { fill: fill(o.colorK ? keyed(`${id}.c`, o.colorK as never) : (o.color as Color), o.fo ? keyed(`${id}.fo`, o.fo as never) : 1) }
          : {}),
        ...(o.line
          ? { stroke: stroke(o.line, o.lineW ?? 1, { ...(o.lo ? { opacity: keyed(`${id}.lo`, o.lo as never) } : {}), ...(o.dash ? { dash: o.dash } : {}) }) }
          : {}),
      },
    } as SceneNode);

  const text = (
    id: string,
    o: {
      x: number;
      y: number;
      s: string;
      size: number;
      color: Color;
      weight?: number;
      mono?: boolean;
      w?: number;
      lh?: number;
      align?: 'left' | 'center' | 'right';
      wrap?: boolean;
      opacity?: K[];
      position?: K<{ x: number; y: number; z: number }>[];
    },
  ) =>
    add({
      ...(o.position
        ? base(id, { outTick: END, position: keyed(`${id}.p`, o.position as never), opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined })
        : base(id, { outTick: END, x: o.x, y: o.y, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined })),
      type: 'text',
      runs: constant([
        {
          text: o.s,
          fontFamily: o.mono ? 'Geist Mono' : 'Geist',
          fontSize: o.size,
          fontWeight: o.weight ?? (o.mono ? 450 : 400),
          letterSpacing: 0,
          lineHeight: o.lh ?? Math.round(o.size * 1.4),
          color: o.color,
        },
      ]),
      box: { width: o.w ?? 600, height: 200 },
      wrap: o.wrap ? 'word' : 'none',
      align: o.align ?? 'left',
      verticalAlign: 'top',
    } as SceneNode);

  const image = (id: string, asset: string, o: { x: number; y: number; size: number; opacity?: K[] }) =>
    add({
      ...base(id, { outTick: END, x: o.x + o.size / 2, y: o.y + o.size / 2, opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined }),
      type: 'image',
      assetId: asset,
      size: constant({ width: o.size, height: o.size }),
      fit: 'cover',
    } as SceneNode);

  const group = (id: string, children: string[], o: { x?: number; y?: number; opacity?: K[]; position?: K<{ x: number; y: number; z: number }>[]; scale?: K<{ x: number; y: number; z: number }>[]; clip?: string } = {}) =>
    add({
      ...(o.position
        ? base(id, {
            outTick: END,
            position: keyed(`${id}.p`, o.position as never),
            scale: o.scale ? (keyed(`${id}.s`, o.scale as never) as never) : undefined,
            opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined,
          })
        : base(id, {
            outTick: END,
            x: o.x ?? 0,
            y: o.y ?? 0,
            scale: o.scale ? (keyed(`${id}.s`, o.scale as never) as never) : undefined,
            opacity: o.opacity ? (keyed(`${id}.o`, o.opacity as never) as never) : undefined,
          })),
      type: 'group',
      children,
      isolation: true,
      ...(o.clip ? { clipPathId: o.clip } : {}),
    } as SceneNode);

  /** A path in local units, stroked; optional dash and a travelling trim. */
  const path = (
    id: string,
    d: string,
    o: { color: Color; width: number; dash?: number[]; opacity?: K[]; trim?: { start: K[]; end: K[] }; x?: number; y?: number; scale?: number; fillColor?: Color },
  ) =>
    add({
      ...base(id, { outTick: END, x: o.x ?? 0, y: o.y ?? 0, scale: o.scale ?? 1 }),
      type: 'path',
      path: constant(parseSvgPath(d).path),
      style: {
        ...(o.fillColor ? { fill: fill(o.fillColor) } : {}),
        stroke: stroke(o.color, o.width / (o.scale ?? 1), {
          ...(o.dash ? { dash: o.dash } : {}),
          ...(o.opacity ? { opacity: keyed(`${id}.o`, o.opacity as never) } : {}),
        }),
      },
      ...(o.trim
        ? { operators: [trim(`${id}.trim`, { start: keyed(`${id}.ts`, o.trim.start as never), end: keyed(`${id}.te`, o.trim.end as never) })] }
        : {}),
    } as SceneNode);

  return { nodes, add, rect, text, image, group, path, v3, s3 };
}

/** Opacity (or any number) that holds `from`, eases to `to` between t0 and t1, for each segment. */
export function fade(first: number, ...segs: [number, number, number][]): K[] {
  const k: K[] = [[0, first, 'hold']];
  let cur = first;
  for (const [t0, t1, to] of segs) {
    k.push([t0, cur, OUT]);
    k.push([t1, to, 'hold']);
    cur = to;
  }
  return k;
}

/** Lucide icons (24-unit grid). */
export const circ = (cx: number, cy: number, r: number) => {
  const k = 0.5523 * r;
  return `M${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} Z`;
};
export const ICON = {
  notes: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M16 17H8',
  // arcs redrawn as cubics (Clayzo flattens SVG arcs into straight lines)
  mic: 'M9 5C9 3.34 10.34 2 12 2C13.66 2 15 3.34 15 5V12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12Z M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10 M12 19V22',
  bookmark: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z',
  link: 'M9 17H7C4.24 17 2 14.76 2 12C2 9.24 4.24 7 7 7H9 M15 7H17C19.76 7 22 9.24 22 12C22 14.76 19.76 17 17 17H15 M8 12H16',
  check: 'M20 6 9 17l-5-5',
};
