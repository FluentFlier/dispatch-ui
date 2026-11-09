/**
 * The plane mark as a halftone: a reusable background for the landing sections.
 *
 * Art direction
 *   mode      one object: the brand mark, alone, made of the diagram's own dot language
 *   verb      breathe: a slow band of light crosses the mark, swelling the dots it passes
 *   geometry  a square grid of round dots; dot size follows the mark's tone, so the
 *             ink outline is densest and each colour field reads as its own grey
 *   palette   ink dots (light) / pale dots (dark), the passing band tinted cobalt / periwinkle
 *   scale     1000 x 1000, shown large and faint behind a section
 *
 *   pnpm tsx animations/dither-plane.ts   (writes public/scene/dither-plane/{light,dark}.json)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  hex,
  keyed,
  validateAnimationDocument,
  withComputedRevision,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';

const S = 1000;
const END = t(9);

const SKSL = `
uniform shader inputImage;
uniform float phase;
uniform half4 ink;
uniform half4 glint;
uniform float2 renderScale;

half4 main(float2 p) {
  float s = renderScale.x;
  float2 u = p / s;
  float CELL = 11.0;
  float2 cell = floor(u / CELL);
  float2 cc = (cell + 0.5) * CELL;
  half4 src = unpremul(inputImage.eval(cc * s));
  if (src.a < 0.02) return half4(0.0);
  float lum = dot(src.rgb, half3(0.299, 0.587, 0.114));
  // fills keep a floor of tone so every part of the mark reads; the outline is densest
  float tone = (0.26 + clamp(1.0 - lum, 0.0, 1.0) * 0.74) * src.a;
  // a slow band of light crossing the mark on the diagonal
  float wv = sin(dot(cc, float2(0.0058, -0.0041)) - phase);
  float crest = smoothstep(0.6, 1.0, wv);
  float r = CELL * 0.5 * sqrt(tone) * (0.8 + 0.34 * crest);
  float d = length(u - cc);
  float cov = 1.0 - smoothstep(r - 0.7, r + 0.5, d);
  half3 col = mix(ink.rgb, glint.rgb, crest * 0.85);
  return half4(col * cov, cov);
}
`;

function build(dark: boolean) {
  const nodes: Record<string, SceneNode> = {
    mark: {
      ...base('mark', { outTick: END, x: S / 2, y: S / 2 }),
      type: 'image',
      assetId: 'plane',
      size: constant({ width: S, height: S }),
      fit: 'contain',
    } as SceneNode,
    dots: {
      ...base('dots', { outTick: END }),
      type: 'effect',
      effect: 'custom-sksl',
      inputId: 'mark',
      implementation: SKSL,
      capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
      parameters: [
        { id: 'phase', name: 'phase', valueType: 'number', minimum: 0, maximum: 7, value: keyed('dots.phase', [[0, 0, 'linear'], [END, Math.PI * 2]]) },
        { id: 'ink', name: 'ink', valueType: 'color', value: constant(dark ? hex('#E4ECF0') : hex('#101114')) },
        { id: 'glint', name: 'glint', valueType: 'color', value: constant(dark ? hex('#6CC6EB') : hex('#2F5BEA')) },
      ],
    } as SceneNode,
  };
  const doc = withComputedRevision({
    version: ANIMATION_DOCUMENT_VERSION,
    id: `contentos-dither-plane-${dark ? 'dark' : 'light'}`,
    name: 'ContentOS plane, halftone',
    canvas: { width: S, height: S, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 0 } },
    timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
    assets: { plane: { id: 'plane', type: 'image', uri: 'plane.png', width: 512, height: 512, mimeType: 'image/png' } },
    rootCompositionId: 'main',
    components: {},
    compositions: { main: { id: 'main', name: 'Main', width: S, height: S, durationTicks: END, nodes, rootNodeIds: ['dots'] } },
    markers: [],
    design: { tokens: { looping: true } },
    capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
  } as never);
  assertValidAnimationDocument(doc);
  const diags = validateAnimationDocument(doc).diagnostics;
  if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
  return doc;
}

const OUT = 'public/scene/dither-plane';
mkdirSync(OUT, { recursive: true });
mkdirSync('animations/out/dither-plane', { recursive: true });
for (const dark of [false, true]) {
  const doc = build(dark);
  const name = dark ? 'dark' : 'light';
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(doc));
  writeFileSync(`animations/out/dither-plane/${name}.json`, JSON.stringify(doc));
  console.log('wrote', name, (doc as { revision: string }).revision);
}
