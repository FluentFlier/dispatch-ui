/**
 * ContentOS hero sky: a painted morning sky that breathes and leans toward you.
 *
 * Art direction
 *   verb      billow (clouds churn slowly in a looping flow field)
 *   geometry  the painting; motion is weighted by how cloudy each pixel is
 *   palette   the painting's own: cornflower, peach, apricot, lilac shadow
 *   scale     full bleed behind the hero panel
 *   words     none
 *
 * The cursor adds depth: bright clouds shift further than the clear sky,
 * so the frame reads as layers without separate plates.
 *
 *   pnpm tsx animations/hero-sky.ts
 *   pnpm clayzo package animations/out/hero-sky.json public/scene/hero-sky.clayzo --poster 0
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  hex,
  keyed,
  pointerFieldMacro,
  validateAnimationDocument,
  withComputedRevision,
  withInteraction,
  type SceneNode,
  type Vec2,
} from '@clayzo/animation/authoring';

const W = 1600;
const H = 914;
const TPS = 240;
const FPS = 60;
const LOOP = 24 * TPS;

const SKSL = `
uniform shader inputImage;
uniform float phase;
uniform float2 focus;
uniform float focusRadius;
uniform float night;
uniform float2 renderScale;

float hash(float2 c) {
  return fract(sin(dot(c, float2(127.1, 311.7))) * 43758.5453);
}
float noise(float2 x) {
  float2 i = floor(x);
  float2 f = fract(x);
  float2 w = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
float fbm(float2 x) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 3; k++) {
    v += a * noise(x);
    x = x * 2.03 + float2(17.0, 9.0);
    a *= 0.5;
  }
  return v;
}

half4 main(float2 p) {
  float s = renderScale.x;
  float2 u = p / s;

  // cloudiness from the painting itself: bright, low-saturation pixels
  half4 base0 = unpremul(inputImage.eval(p));
  float lum = dot(base0.rgb, half3(0.299, 0.587, 0.114));
  float sat = max(base0.r, max(base0.g, base0.b)) - min(base0.r, min(base0.g, base0.b));
  float cloud = smoothstep(0.66, 0.9, lum) * (1.0 - smoothstep(0.32, 0.5, sat));
  cloud = max(cloud, smoothstep(0.55, 0.8, lum) * smoothstep(0.55, 1.0, u.y / ${H}.0));

  // looping flow: walk a circle through the noise field
  float2 loop = float2(cos(phase), sin(phase)) * 1.6;
  float2 q = u * 0.0042;
  float2 flow = float2(fbm(q + loop), fbm(q + loop + float2(5.2, 1.3))) - 0.5;
  float2 off = flow * (6.0 + cloud * 26.0);
  off.x += sin(phase + u.y * 0.004) * 5.0 * cloud;

  // depth parallax under the cursor
  float presence = clamp(focusRadius / 600.0, 0.0, 1.0);
  float2 lean = (focus / s - float2(${W / 2}.0, ${H / 2}.0)) / float2(${W / 2}.0, ${H / 2}.0);
  off -= lean * presence * (3.0 + cloud * 22.0);

  half4 c = unpremul(inputImage.eval((u + off) * s));

  // a warm glow breathing at the horizon
  float2 g = (u - float2(${W / 2}.0, ${H}.0)) / float2(${W * 0.5}.0, ${H * 0.55}.0);
  float glow = exp(-dot(g, g) * 1.6) * (0.06 + 0.03 * sin(phase * 2.0));
  half3 rgb = c.rgb + mix(half3(1.0, 0.72, 0.5), half3(0.55, 0.6, 1.0), night) * glow;

  // stars come out with the night: sparse, soft, twinkling, only in clear sky
  float2 sc = floor(u / 9.0);
  float sh = hash(sc + 41.0);
  if (night > 0.02 && sh > 0.985 && cloud < 0.2) {
    float2 sl = fract(u / 9.0) - 0.5;
    float tw = 0.55 + 0.45 * sin(phase * 4.0 + sh * 80.0);
    float star = (1.0 - smoothstep(0.0, 0.16, length(sl))) * tw * night * (1.0 - u.y / ${H}.0);
    rgb += half3(0.85, 0.88, 1.0) * star;
  }

  float grain = hash(floor(p) + floor(phase * 30.0)) - 0.5;
  rgb += grain * 0.022;
  return half4(saturate(rgb), 1.0);
}
`;

// The toggle sits near the panel's top-right corner; night spreads from there.
const ORIGIN = { x: W - 70, y: 40 };
const REACH = Math.hypot(ORIGIN.x, H - ORIGIN.y) * 2 + 40;

const nodes: Record<string, SceneNode> = {
  day: {
    ...base('day', { outTick: LOOP, x: W / 2, y: H / 2 }),
    type: 'image',
    assetId: 'sky',
    size: constant({ width: W, height: H }),
    fit: 'cover',
  } as SceneNode,
  'night-img': {
    ...base('night-img', { outTick: LOOP, x: W / 2, y: H / 2 }),
    type: 'image',
    assetId: 'skyNight',
    size: constant({ width: W, height: H }),
    fit: 'cover',
  } as SceneNode,
  'night-clip': {
    ...base('night-clip', { outTick: LOOP, x: ORIGIN.x, y: ORIGIN.y }),
    type: 'ellipse',
    size: constant({ width: 2, height: 2 }),
    style: {},
  } as SceneNode,
  'night-layer': {
    ...base('night-layer', { outTick: LOOP }),
    type: 'group',
    children: ['night-img'],
    clipPathId: 'night-clip',
  } as SceneNode,
  painting: {
    ...base('painting', { outTick: LOOP }),
    type: 'group',
    isolation: true,
    children: ['day', 'night-layer'],
  } as SceneNode,
  sky: {
    ...base('sky', { outTick: LOOP }),
    type: 'effect',
    effect: 'custom-sksl',
    inputId: 'painting',
    implementation: SKSL,
    capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
    parameters: [
      {
        id: 'phase',
        name: 'phase',
        valueType: 'number',
        minimum: 0,
        maximum: 10,
        value: keyed('sky.phase', [
          [0, 0, 'linear'],
          [LOOP, Math.PI * 2],
        ]),
      },
      {
        id: 'focus',
        name: 'focus',
        valueType: 'point',
        minimum: { x: -4000, y: -4000 } as Vec2,
        maximum: { x: 6000, y: 6000 } as Vec2,
        value: constant({ x: W / 2, y: H / 2 } as Vec2),
      },
      { id: 'focusRadius', name: 'focusRadius', valueType: 'number', minimum: 0, maximum: 600, value: constant(0) },
      { id: 'night', name: 'night', valueType: 'number', minimum: 0, maximum: 1, value: constant(0) },
    ],
  } as SceneNode,
};

const scene = withComputedRevision({
  version: ANIMATION_DOCUMENT_VERSION,
  id: 'contentos-hero-sky',
  name: 'ContentOS hero sky',
  canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: hex('#9DBDE6') },
  timing: { ticksPerSecond: TPS, frameRate: { numerator: FPS, denominator: 1 }, durationTicks: LOOP, displayStartTick: 0 },
  assets: {
    sky: { id: 'sky', type: 'image', uri: 'sky.jpg', width: 2304, height: 1316, mimeType: 'image/jpeg' },
    skyNight: { id: 'skyNight', type: 'image', uri: 'sky-night.jpg', width: 2304, height: 1316, mimeType: 'image/jpeg' },
  },
  rootCompositionId: 'main',
  components: {},
  compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: LOOP, nodes, rootNodeIds: ['sky'] } },
  markers: [],
  design: { tokens: { looping: true } },
  capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
});

// night: 0 = day, 1 = night. Eased natively so the reveal plays inside Clayzo.
const eased = (id: string) => [
  { id: `${id}.in`, op: 'input' as const, input: 'night' },
  { id: `${id}.ease`, op: 'spring' as const, stiffness: 46, damping: 13.6, mass: 1 },
  { id: `${id}.clamp`, op: 'clamp' as const, minimum: 0, maximum: 1 },
];
const radius = (id: string) => [
  ...eased(id),
  { id: `${id}.map`, op: 'map-range' as const, inputMinimum: 0, inputMaximum: 1, outputMinimum: 2, outputMaximum: REACH, clamp: true },
];

const document = withInteraction(scene, [
  pointerFieldMacro({ effectNodeId: 'sky', focusParameterId: 'focus', radiusParameterId: 'focusRadius', radius: 600, halfLife: 0.35 }),
  { input: { id: 'input-night', name: 'night', kind: 'number', defaultValue: 0, minimum: 0, maximum: 1, label: 'Night' } },
  { id: 'night-w', target: { kind: 'node-property', nodeId: 'night-clip', property: 'size', axis: 'width' }, blend: 'set', steps: radius('nw') },
  { id: 'night-h', target: { kind: 'node-property', nodeId: 'night-clip', property: 'size', axis: 'height' }, blend: 'set', steps: radius('nh') },
  { id: 'night-fx', target: { kind: 'effect-parameter', nodeId: 'sky', parameterId: 'night' }, blend: 'set', steps: eased('nf') },
] as never);

assertValidAnimationDocument(document);
const diags = validateAnimationDocument(document).diagnostics;
if (diags.length) console.warn(JSON.stringify(diags).slice(0, 600));
mkdirSync('animations/out', { recursive: true });
writeFileSync('animations/out/hero-sky.json', JSON.stringify(document));
copyFileSync('animations/assets/sky.jpg', 'animations/out/sky.jpg');
copyFileSync('animations/assets/sky-night.jpg', 'animations/out/sky-night.jpg');
console.log('wrote animations/out/hero-sky.json', document.revision);
