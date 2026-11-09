/**
 * The hero enters once, all together: its two Clayzo players (the sky and the theme toggle) are
 * the slowest parts, so the nav, sky, headline and demo wait for both, then play their entrance in
 * the same frame. HERO_BOOT runs inline before the first paint; a fallback timer releases the hero
 * after 2.5 s whatever happens, so a slow or missing GPU never hides the page.
 */
const ATTR = 'data-hero-wait';
const LIMIT_MS = 2500;

export const HERO_BOOT = `(function(){var d=document.documentElement;d.setAttribute('${ATTR}','');setTimeout(function(){d.removeAttribute('${ATTR}')},${LIMIT_MS});})();`;

const waiting = new Set<'sky' | 'toggle'>(['sky', 'toggle']);

/** A Clayzo piece of the hero has drawn (or given up); the last one releases the entrance. */
export function heroPartReady(part: 'sky' | 'toggle') {
  if (!waiting.delete(part) || waiting.size > 0) return;
  // the next frame, so the canvas that just drew is on screen when everything starts to move
  requestAnimationFrame(() => document.documentElement.removeAttribute(ATTR));
}
