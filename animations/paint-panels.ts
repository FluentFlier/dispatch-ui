/**
 * Bakes the hero's oil-painting pass (animations/hero-sky.ts: the Kuwahara brush, a little more
 * colour, the canvas weave and tooth) into the feature-panel paintings (animations/assets/panels),
 * so the four panels read as the same painted world as the hero without running four more brush
 * shaders every frame. Each crop is drawn once through the same SkSL by the Clayzo CLI.
 *
 * The crops are baked at 2x the panel's CSS size, so the brush and the canvas texture are scaled by
 * K = 2 to land on screen at the hero's size (its brush is ~7 CSS px).
 *
 *   pnpm tsx animations/paint-panels.ts   (writes animations/assets/panels/<name>-<day|night>-oil.jpg)
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ANIMATION_DOCUMENT_VERSION,
  assertValidAnimationDocument,
  base,
  constant,
  validateAnimationDocument,
  withComputedRevision,
  type SceneNode,
} from '@clayzo/animation/authoring';

const K = 2;
const BRUSH = 7 * K;

const SKSL = `
uniform shader inputImage;
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
half4 quad(float2 p, float2 d, float st) {
  half3 sum = half3(0.0);
  half3 sq = half3(0.0);
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      half3 k = unpremul(inputImage.eval(p + d * float2(float(i), float(j)) * st)).rgb;
      sum += k;
      sq += k * k;
    }
  }
  sum /= 16.0;
  sq = sq / 16.0 - sum * sum;
  return half4(sum, sq.r + sq.g + sq.b);
}
half3 brush(float2 p, float s) {
  float st = ${(BRUSH / 3).toFixed(3)} * s;
  half4 a = quad(p, float2(-1.0, -1.0), st);
  half4 b = quad(p, float2(1.0, -1.0), st);
  half4 c = quad(p, float2(-1.0, 1.0), st);
  half4 d = quad(p, float2(1.0, 1.0), st);
  half4 m = a;
  if (b.a < m.a) { m = b; }
  if (c.a < m.a) { m = c; }
  if (d.a < m.a) { m = d; }
  return m.rgb;
}
half4 main(float2 p) {
  float s = renderScale.x;
  float2 u = p / s / ${K.toFixed(1)};
  half3 rgb = brush(p, s);
  // oil on canvas, as the hero: a touch richer, then the weave and tooth of the canvas
  float luma = dot(rgb, half3(0.299, 0.587, 0.114));
  rgb = mix(half3(luma), rgb, 1.1);
  float weave = sin(u.x * 2.6) * sin(u.y * 2.6);
  float tooth = noise(u * 0.55) - 0.5;
  float relief = noise(u * 0.55 + float2(0.7, 0.7)) - noise(u * 0.55);
  rgb *= 1.0 + weave * 0.014 + tooth * 0.035 + relief * 0.05;
  return half4(saturate(rgb), 1.0);
}
`;

const PANELS: [string, number, number][] = [
  ['agents', 1280, 680],
  ['autopilot', 880, 680],
  ['tools', 880, 680],
  ['breakout', 1280, 680],
];

const work = join(tmpdir(), 'contentos-paint-panels');
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

for (const [name, W, H] of PANELS) {
  for (const tone of ['day', 'night']) {
    const src = `animations/assets/panels/${name}-${tone}.jpg`;
    copyFileSync(src, join(work, 'src.jpg'));
    const nodes: Record<string, SceneNode> = {
      img: { ...base('img', { outTick: 4, x: W / 2, y: H / 2 }), type: 'image', assetId: 'src', size: constant({ width: W, height: H }), fit: 'cover' } as SceneNode,
      oil: {
        ...base('oil', { outTick: 4 }),
        type: 'effect',
        effect: 'custom-sksl',
        inputId: 'img',
        implementation: SKSL,
        capability: { requires: ['runtime-effect'], fallback: 'passthrough', maxTemporarySurfaces: 1 },
        parameters: [],
      } as SceneNode,
    };
    const doc = withComputedRevision({
      version: ANIMATION_DOCUMENT_VERSION,
      id: `contentos-paint-${name}-${tone}`,
      name: `paint ${name} ${tone}`,
      canvas: { width: W, height: H, pixelAspectRatio: 1, backgroundColor: { r: 0, g: 0, b: 0, a: 1 } },
      timing: { ticksPerSecond: 240, frameRate: { numerator: 60, denominator: 1 }, durationTicks: 4, displayStartTick: 0 },
      assets: { src: { id: 'src', type: 'image', uri: 'src.jpg', width: W, height: H, mimeType: 'image/jpeg' } },
      rootCompositionId: 'main',
      components: {},
      compositions: { main: { id: 'main', name: 'Main', width: W, height: H, durationTicks: 4, nodes, rootNodeIds: ['oil'] } },
      markers: [],
      design: { tokens: {} },
      capabilities: { required: [], optional: [], unsupportedPolicy: 'warn' },
    } as never);
    assertValidAnimationDocument(doc);
    const diags = validateAnimationDocument(doc).diagnostics;
    if (diags.length) console.warn(name, tone, JSON.stringify(diags).slice(0, 400));
    const json = join(work, 'doc.json');
    const png = join(work, 'out.png');
    writeFileSync(json, JSON.stringify(doc));
    execFileSync('pnpm', ['-s', 'clayzo', 'render-frame', json, png, '--tick', '0'], { stdio: 'ignore' });
    const dst = resolve(`animations/assets/panels/${name}-${tone}-oil.jpg`);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-q:v', '3', dst]);
    console.log('painted', name, tone);
  }
}
