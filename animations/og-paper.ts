/**
 * The page's paper as a share-card ground: #faf9f6 with its navy grain (--cos-noise), 1200 x 630, one
 * still frame. Share cards that put a page's own scene on the paper (the Grok Bot page's card) lay
 * their scene over it.
 *
 *   pnpm tsx animations/og-paper.ts      (writes animations/out/og/paper.json)
 *   clayzo render-frame animations/out/og/paper.json <paper>.png --full-resolution
 */
import { writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  withComputedRevision,
  type SceneNode,
} from '@clayzo/animation/authoring';
import { FPS, TPS, t } from './lib/kit';

const W = 1200;
const H = 630;
const END = t(1 / FPS);

// the same grain as the share card's ground (animations/og-card.ts): fractal noise at 0.85 per px,
// drawn in toward 0.5 the way feTurbulence's sits, navy at 0.55 n - 0.24
const SKSL = `
uniform shader inputImage;
uniform float2 renderScale;

float noise2(float2 x) {
  float2 i = floor(x);
  float2 g = fract(x);
  float2 w = g * g * (3.0 - 2.0 * g);
  float a = fract(sin(dot(i, float2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + float2(1.0, 0.0), float2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + float2(0.0, 1.0), float2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + float2(1.0, 1.0), float2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

half4 main(float2 q) {
  float2 u = q / renderScale.x;
  float2 x = u * 0.85;
  float n = 0.5 * noise2(x) + 0.25 * noise2(x * 2.0 + 17.0) + 0.125 * noise2(x * 4.0 + 31.0);
  n = 0.5 + (n / 0.875 - 0.5) * 0.3;
  float a = clamp(0.55 * n - 0.24, 0.0, 1.0);
  return half4(mix(half3(0.980, 0.976, 0.965), half3(0.06, 0.17, 0.28), a), 1.0);
}
`;

const nodes: Record<string, SceneNode> = {
  ground: {
    ...base('ground', { outTick: END, x: W / 2, y: H / 2 }),
    type: 'rect',
    size: constant({ width: W, height: H }),
    cornerRadius: constant(0),
    style: { fill: fill({ r: 0.98, g: 0.976, b: 0.965, a: 1 }) },
  } as SceneNode,
  paper: {
    ...base('paper', { outTick: END }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'ground',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [],
  } as SceneNode,
};

const doc = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-og-paper',
  name: 'ContentOS paper',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0.98, g: 0.976, b: 0.965, a: 1 } },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: END, displayStartTick: 0 },
  assets: {},
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: END, nodes, rootNodeIds: ['paper'] } },
  markers: [],
  design: { tokens: { looping: false } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
} as never);
assertValidAnimationDocument(doc);
writeFileSync('animations/out/og/paper.json', JSON.stringify(doc));
console.log('wrote animations/out/og/paper.json');
