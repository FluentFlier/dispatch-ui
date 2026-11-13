/**
 * Recolour the plane mark everywhere: `npx tsx animations/apply-mark.ts <colourway>` (the names are the
 * keys of COLOURWAYS in animations/lib/mark.ts). It sets CURRENT there, writes public/brand/mark.svg,
 * renders the favicon, the app logo and the scenes' plane.png copies from it (rsvg-convert), then
 * rebuilds every scene that draws the plane.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { COLOURWAYS, type Colourway } from './lib/mark';

const name = process.argv[2] as Colourway;
if (!name || !(name in COLOURWAYS)) {
  console.error(`usage: npx tsx animations/apply-mark.ts <${Object.keys(COLOURWAYS).join('|')}>`);
  process.exit(1);
}
const c = COLOURWAYS[name];

const LIB = 'animations/lib/mark.ts';
writeFileSync(LIB, readFileSync(LIB, 'utf8').replace(/export const CURRENT: Colourway = '\w+';/, `export const CURRENT: Colourway = '${name}';`));

const SVG = 'public/brand/mark.svg';
// a fold is a flat colour or a [tail, nose] gradient that runs along the plane
const defs: string[] = [];
const fill = (f: string | readonly string[], id: string) => {
  if (typeof f === 'string') return f;
  defs.push(
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="500" y1="1500" x2="1835" y2="158"><stop offset="0" stop-color="${f[0]}"/><stop offset="1" stop-color="${f[1]}"/></linearGradient>`,
  );
  return `url(#${id})`;
};
const upper = fill(c.upper, 'up');
const lower = fill(c.lower, 'lo');
writeFileSync(
  SVG,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}<g stroke="#16100D" stroke-width="43" stroke-linejoin="round" stroke-linecap="round"><path d="M161 845 L1835 158 L851 1139 Z" fill="${upper}"/><path d="M851 1139 L1835 158 L1145 1838 Z" fill="${lower}"/></g></svg>\n`,
);

const render = (size: number, out: string) => execFileSync('rsvg-convert', ['-w', `${size}`, '-h', `${size}`, SVG, '-o', out]);
render(512, 'src/app/icon.png');
render(1024, 'public/images/content-os-logo.png');
render(192, 'public/brand/plane.png');
render(512, 'public/scene/dither-plane/plane.png');
for (const dir of ['public/scene/grok-hero', 'animations/out/dither-plane', 'animations/out/grok-hero']) {
  mkdirSync(dir, { recursive: true });
  copyFileSync('public/scene/dither-plane/plane.png', `${dir}/plane.png`);
}

// dither-plane before plane-flock, which copies its plane.png
for (const scene of ['dither-plane', 'plane-flock', 'grok-hero', 'grok-chat', 'grid-panels', 'ask-mark', 'plane-wordmark']) {
  execFileSync('npx', ['tsx', `animations/${scene}.ts`], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`built ${scene}`);
}
console.log(`mark is now ${name}`);
