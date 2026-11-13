'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The scale a Clayzo player should render at so its canvas has one pixel per device pixel.
 *
 * The player's default ("display") only draws above a document's own size while its shared
 * scheduler reports headroom, and on phones it rarely does: a 348-unit scene shown 375 px wide
 * at 3x was drawn at 348 px and stretched three times, which is the blur. Passing the exact
 * scale as `resolution` skips that guess. `maxRatio` caps the device pixel ratio for heavy,
 * full-bleed scenes.
 *
 * Put the returned ref on the element whose width is the canvas's on-screen width. The scale is
 * undefined until it has been measured; render the player only then, because a change of
 * `resolution` creates a new player.
 */
export function useRenderScale<T extends HTMLElement = HTMLDivElement>(docWidth: number | undefined, maxRatio = 3) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el || !docWidth) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (!w) return;
      const s = (w * Math.min(window.devicePixelRatio || 1, maxRatio)) / docWidth;
      // quarter steps, rounded up: a resize only rebuilds the player when sharpness really changes
      const q = Math.max(0.5, Math.ceil(s * 4) / 4);
      setScale((prev) => (prev === q ? prev : q));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [docWidth, maxRatio]);

  return [ref, scale] as const;
}
