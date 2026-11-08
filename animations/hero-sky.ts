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
 *   pnpm tsx animations/hero-sky.ts   (BG=india for the India backdrop)
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

// BG picks the backdrop: sky (the painted sky, default) or india (an Udaipur-style lake palace, just for fun)
const BG = process.env.BG === 'india' ? 'india' : 'sky';
const DAY_FILE = `${BG}.jpg`;
const NIGHT_FILE = `${BG}-night.jpg`;
const ASSET_W = BG === 'sky' ? 2304 : 1344;
const ASSET_H = BG === 'sky' ? 1316 : 768;
const OUT = BG === 'sky' ? 'hero-sky' : `hero-${BG}`;

const W = 1600;
const H = 914;
const TPS = 240;
const FPS = 60;
const LOOP = 24 * TPS;

const f = (x: number) => x.toFixed(2);

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
  cloud = max(cloud, smoothstep(0.55, 0.8, lum) * smoothstep(0.55, 1.0, u.y / ${f(H)}));

  // looping flow: walk a circle through the noise field
  float2 loop = float2(cos(phase), sin(phase)) * 1.6;
  float2 q = u * 0.0042;
  float2 flow = float2(fbm(q + loop), fbm(q + loop + float2(5.2, 1.3))) - 0.5;
  float2 off = flow * (6.0 + cloud * 26.0);
  off.x += sin(phase + u.y * 0.004) * 5.0 * cloud;

  // depth parallax under the cursor
  float presence = clamp(focusRadius / 600.0, 0.0, 1.0);
  float2 lean = (focus / s - float2(${f(W / 2)}, ${f(H / 2)})) / float2(${f(W / 2)}, ${f(H / 2)});
  off -= lean * presence * (3.0 + cloud * 22.0);

  half4 c = unpremul(inputImage.eval((u + off) * s));

  // a warm glow breathing at the horizon
  float2 g = (u - float2(${f(W / 2)}, ${f(H)})) / float2(${f(W * 0.5)}, ${f(H * 0.55)});
  float glow = exp(-dot(g, g) * 1.6) * (0.06 + 0.03 * sin(phase * 2.0));
  half3 rgb = c.rgb + mix(half3(1.0, 0.72, 0.5), half3(0.55, 0.6, 1.0), night) * glow;

  // stars come out with the night: sparse, soft, twinkling, only in clear sky
  float2 sc = floor(u / 9.0);
  float sh = hash(sc + 41.0);
  if (night > 0.02 && sh > 0.985 && cloud < 0.2 && lum > 0.1 && base0.b > base0.r && u.y < ${f(H * 0.55)}) {
    float2 sl = fract(u / 9.0) - 0.5;
    float tw = 0.55 + 0.45 * sin(phase * 4.0 + sh * 80.0);
    float star = (1.0 - smoothstep(0.0, 0.16, length(sl))) * tw * night * (1.0 - u.y / ${f(H)});
    rgb += half3(0.85, 0.88, 1.0) * star;
  }

  // shader-gradient wash: brand hues drift through a warped field, gathering at the edges
  float2 wl = float2(cos(phase), sin(phase)) * 0.75;
  float2 wq = u * 0.0012;
  float w1 = fbm(wq + wl + fbm(wq * 1.7 - wl) * 1.4);
  float w2 = fbm(wq * 1.35 - wl.yx + float2(3.1, 7.7));
  half3 tA = mix(half3(1.0, 0.6, 0.38), half3(0.5, 0.33, 1.0), night);   // apricot / violet
  half3 tB = mix(half3(0.78, 0.68, 1.0), half3(0.16, 0.5, 1.0), night);  // lilac / electric blue
  half3 tC = mix(half3(0.3, 0.48, 1.0), half3(1.0, 0.42, 0.72), night);  // cobalt / rose
  half3 tint = mix(mix(tA, tB, smoothstep(0.32, 0.68, w1)), tC, smoothstep(0.5, 0.78, w2));
  float2 e = (u - float2(${f(W / 2)}, ${f(H * 0.42)})) / float2(${f(W / 2)}, ${f(H / 2)});
  float edge = smoothstep(0.2, 1.25, length(e * float2(0.85, 1.1)));
  float amt = 0.2 + 0.5 * edge;
  half3 lo = 2.0 * rgb * tint + rgb * rgb * (1.0 - 2.0 * tint);
  half3 hi = sqrt(saturate(rgb)) * (2.0 * tint - 1.0) + 2.0 * rgb * (1.0 - tint);
  half3 soft = mix(lo, hi, step(half3(0.5), tint));
  rgb = mix(rgb, soft, amt);
  // a whisper of the colour itself in the corners, so it reads as light not filter
  rgb = mix(rgb, tint, edge * edge * mix(0.1, 0.14, night));
  // vignette
  rgb *= 1.0 - edge * edge * mix(0.06, 0.16, night);

  // ---- daylight grade (night is left exactly as it was) ----
  float day = 1.0 - night;
  // sunbeams: faint rays fanning up from a sun just below the frame, turning slowly
  float2 sv = u - float2(${f(W / 2)}, ${f(H * 1.04)});
  float sd = length(sv) / ${f(H)};
  float sa = atan(sv.y, sv.x);
  float ray = 0.5 + 0.5 * sin(sa * 15.0 + sin(sa * 4.0 + phase) * 1.6 + phase * 0.5);
  ray = pow(ray, 5.0) * 0.7 + pow(0.5 + 0.5 * sin(sa * 7.0 - phase * 0.35 + 1.3), 8.0) * 0.5;
  float beam = ray * exp(-sd * 2.3) * smoothstep(0.05, 0.3, sd);
  rgb += half3(1.0, 0.84, 0.68) * beam * 0.085 * day;
  // a warmer sun glow at the horizon
  float2 hg = (u - float2(${f(W / 2)}, ${f(H * 1.02)})) / float2(${f(W * 0.42)}, ${f(H * 0.5)});
  rgb += half3(1.0, 0.66, 0.42) * exp(-dot(hg, hg) * 1.4) * 0.07 * day;
  // a lilac breath through the middle of the sky, so it never reads as flat pale blue
  float midb = smoothstep(${f(H * 0.18)}, ${f(H * 0.42)}, u.y) * (1.0 - smoothstep(${f(H * 0.5)}, ${f(H * 0.8)}, u.y));
  rgb = mix(rgb, rgb * half3(0.93, 0.88, 1.0), midb * 0.55 * day);
  // gentle S-curve for depth, cool shadows and warm highlights
  half3 scurve = rgb * rgb * (3.0 - 2.0 * rgb);
  rgb = mix(rgb, scurve, 0.22 * day);
  float ll = dot(rgb, half3(0.299, 0.587, 0.114));
  rgb += (half3(-0.01, 0.0, 0.025) * (1.0 - ll) + half3(0.025, 0.012, -0.012) * ll) * day;

  // by day the top of the sky deepens into a rich cobalt, fading out before the headline
  float top = 1.0 - smoothstep(${f(H * 0.08)}, ${f(H * 0.66)}, u.y);
  top = smoothstep(0.0, 1.0, top) * (1.0 - night);
  half3 deep = rgb * half3(0.58, 0.72, 1.0);
  float dl = dot(deep, half3(0.299, 0.587, 0.114));
  deep = mix(half3(dl), deep, 1.12);
  rgb = mix(rgb, deep, top * 0.72);

  // film grain: fine, animated, strongest in the midtones, a touch of chroma
  float2 gp = floor(u * 1.25);
  float gt = floor(phase * 40.0);
  float gl = hash(gp + gt * 13.0) - 0.5;
  half3 gc = half3(hash(gp + gt * 7.0 + 3.0), hash(gp + gt * 5.0 + 11.0), hash(gp + gt * 3.0 + 29.0)) - 0.5;
  float luma = dot(rgb, half3(0.299, 0.587, 0.114));
  float mid = 1.0 - abs(luma - 0.5) * 1.2;
  rgb += (gl * 0.75 + gc * 0.25) * mix(0.055, 0.07, night) * mid;
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
    sky: { id: 'sky', type: 'image', uri: DAY_FILE, width: ASSET_W, height: ASSET_H, mimeType: 'image/jpeg' },
    skyNight: { id: 'skyNight', type: 'image', uri: NIGHT_FILE, width: ASSET_W, height: ASSET_H, mimeType: 'image/jpeg' },
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
writeFileSync(`animations/out/${OUT}.json`, JSON.stringify(document));
copyFileSync(`animations/assets/${DAY_FILE}`, `animations/out/${DAY_FILE}`);
copyFileSync(`animations/assets/${NIGHT_FILE}`, `animations/out/${NIGHT_FILE}`);
console.log(`wrote animations/out/${OUT}.json`, document.revision);
