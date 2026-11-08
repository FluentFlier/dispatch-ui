/**
 * ContentOS hero background: a halftone field that answers the cursor.
 *
 * Art direction
 *   verb      swell (dots grow and warm toward the cursor, a slow light wave crosses the field)
 *   geometry  one round dot per 16-unit cell
 *   palette   page ground (transparent), grey dots, ink and one blue near the cursor
 *   scale     full bleed behind the hero, quiet enough to sit under type
 *   words     none
 *
 *   pnpm tsx animations/hero-dots.ts
 *   pnpm clayzo package animations/out/hero-dots.json public/scene/hero-dots.clayzo --poster 0
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  fill,
  hex,
  keyed,
  pointerFieldMacro,
  validateAnimationDocument,
  withComputedRevision,
  withInteraction,
  type SceneNode,
  type Vec2,
} from '@clayzo/animation/authoring';

const W = 1920;
const H = 1080;
const TPS = 240;
const FPS = 60;
const LOOP = 14 * TPS; // 14 s, a multiple of the 4-tick frame

const SKSL = `
uniform shader inputImage;
uniform float phase;
uniform float2 focus;
uniform float focusRadius;
uniform float2 renderScale;

const float CELL = 16.0;

float hash(float2 c) {
  return fract(sin(dot(c, float2(12.9898, 78.233))) * 43758.5453);
}

half4 main(float2 p) {
  float s = renderScale.x;
  float2 u = p / s;
  float2 cid = floor(u / CELL);
  float2 cc = (cid + 0.5) * CELL;
  float h = hash(cid);

  // a slow diagonal band of light, plus a little per-dot jitter
  float wave = 0.5 + 0.5 * sin(cc.x * 0.0042 - cc.y * 0.0021 - phase);
  wave = wave * wave;
  float idle = 0.55 + wave * 0.9 + (h - 0.5) * 0.25;

  // the cursor: dots within reach swell, with a soft ring at the edge
  float2 fu = focus / s;
  float d = length(cc - fu);
  float lens = focusRadius > 1.0 ? 1.0 - smoothstep(focusRadius * 0.05, focusRadius, d) : 0.0;
  float ring = focusRadius > 1.0 ? exp(-pow((d - focusRadius * 0.55 - sin(phase * 3.0) * 6.0) / 18.0, 2.0)) * 0.6 : 0.0;

  float r = idle + lens * lens * 3.6 + ring * 1.2;
  float dist = length(u - cc);
  float aa = 0.9 / s;
  float a = 1.0 - smoothstep(r - aa, r + aa, dist);
  if (a <= 0.0) { return half4(0.0); }

  half3 grey = half3(0.74, 0.74, 0.735);
  half3 ink = half3(0.12, 0.12, 0.13);
  half3 blue = half3(0.165, 0.33, 1.0);
  half3 col = mix(grey, ink, lens * 0.75);
  col = mix(col, blue, clamp(ring + lens * lens * 0.5, 0.0, 1.0) * step(0.62, h));
  float alpha = a * (0.55 + 0.25 * wave + lens * 0.4);
  return half4(col * alpha, alpha);
}
`;

const nodes: Record<string, SceneNode> = {
  plate: {
    ...base('plate', { outTick: LOOP, x: W / 2, y: H / 2 }),
    type: 'rect',
    size: constant({ width: W, height: H }),
    cornerRadius: constant(0),
    style: { fill: fill(hex('#000000'), 1) },
  },
  dots: {
    ...base('dots', { outTick: LOOP }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'plate',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      {
        id: 'phase',
        name: 'phase',
        valueType: 'number',
        minimum: 0,
        maximum: 100,
        value: keyed('dots.phase', [
          [0, 0, 'linear'],
          [LOOP, Math.PI * 2 * 2],
        ]),
      },
      {
        id: 'focus',
        name: 'focus',
        valueType: 'point',
        minimum: { x: -4000, y: -4000 } as Vec2,
        maximum: { x: 6000, y: 6000 } as Vec2,
        value: constant({ x: -2000, y: -2000 } as Vec2),
      },
      { id: 'focusRadius', name: 'focusRadius', valueType: 'number', minimum: 0, maximum: 600, value: constant(0) },
    ],
  } as SceneNode,
};

const scene = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-hero-dots',
  name: 'ContentOS hero dots',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: hex('#F3F3F2') },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: LOOP, displayStartTick: 0 },
  assets: {},
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: LOOP, nodes, rootNodeIds: ['dots'] } },
  markers: [],
  design: { tokens: { looping: true } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
});

const document = withInteraction(scene, [
  pointerFieldMacro({ effectNodeId: 'dots', focusParameterId: 'focus', radiusParameterId: 'focusRadius', radius: 220, halfLife: 0.12 }),
]);

assertValidAnimationDocument(document);
const diags = validateAnimationDocument(document).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
mkdirSync('animations/out', { recursive: true });
writeFileSync('animations/out/hero-dots.json', JSON.stringify(document));
console.log('wrote animations/out/hero-dots.json', document.revision);
