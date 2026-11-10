/**
 * The plane mark's colours, in one place. `upper` and `lower` fill the two folds of
 * public/brand/mark.svg (the outline stays #16100D). `lit` is the colour the dithered planes light up
 * in (ask-mark, plane-flock, dither-plane), one per theme. `wordmark` is the folds' colour pair in the
 * footer wordmark, whose small planes have no outline, so the pale folds are deepened in light mode.
 *
 * Switch with `node animations/apply-mark.mjs <colourway>`: it rewrites CURRENT below, mark.svg, the
 * favicon and app logo, the scenes' plane.png copies, and rebuilds every scene that draws the plane.
 */
export const COLOURWAYS = {
  original: {
    upper: '#015CE6',
    lower: '#FF4E2E',
    lit: { light: '#2F5BEA', dark: '#6CC6EB' },
    wordmark: { light: ['#015CE6', '#FF4E2E'], dark: ['#6CC6EB', '#FF7A5C'] },
  },
  oxblood: {
    upper: '#6E1E2A',
    lower: '#F6B23C',
    lit: { light: '#8A2434', dark: '#F6B23C' },
    wordmark: { light: ['#6E1E2A', '#E89A1C'], dark: ['#C2546A', '#F6B23C'] },
  },
  forest: {
    upper: '#173B2F',
    lower: '#EFE7D6',
    lit: { light: '#2C6A50', dark: '#8FC9A9' },
    wordmark: { light: ['#173B2F', '#B9A982'], dark: ['#5FA585', '#EFE7D6'] },
  },
  midnight: {
    upper: '#0F1D3A',
    lower: '#D6ECF8',
    lit: { light: '#23407E', dark: '#D6ECF8' },
    wordmark: { light: ['#0F1D3A', '#8DB4D6'], dark: ['#5B7DBF', '#D6ECF8'] },
  },
  // gradients: a fold given as [tail, nose] shades along the plane, tail to nose
  tropical: {
    upper: ['#00E0A8', '#00A3FF'],
    lower: ['#FFD23F', '#FF5A3D'],
    lit: { light: '#0096E0', dark: '#00E0A8' },
    wordmark: { light: ['#00B8C8', '#FF8A2E'], dark: ['#00E0A8', '#FFC23F'] },
  },
  ocean: {
    upper: ['#1ED2FF', '#0A5CFF'],
    lower: ['#FFB04A', '#FF3D6E'],
    lit: { light: '#0A6CFF', dark: '#1ED2FF' },
    wordmark: { light: ['#0A7CFF', '#FF6A5A'], dark: ['#1ED2FF', '#FF8A6A'] },
  },
} as const;

export type Colourway = keyof typeof COLOURWAYS;

export const CURRENT: Colourway = 'ocean';

export const MARK = COLOURWAYS[CURRENT];
