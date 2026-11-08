'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';
import { useTheme } from '../theme';

/**
 * The hero backdrop (Clayzo, animations/hero-sky.ts): a painted sky whose
 * clouds drift and lean toward the cursor. Day and night switch instantly;
 * the page-wide wipe (theme.tsx) does the reveal. ?bg=lake swaps in the mountain lake,
 * ?bg=india an Udaipur-style lake palace (for fun).
 */
const BACKDROPS = {
  sky: { scene: 'hero-sky', day: 'sky', night: 'sky-night' },
  lake: { scene: 'hero-lake', day: 'lake', night: 'lake-night' },
  india: { scene: 'hero-india', day: 'india', night: 'india-night' },
} as const;

export function SkyField() {
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);
  const [bd, setBd] = useState<(typeof BACKDROPS)[keyof typeof BACKDROPS] | null>(null);
  const { theme } = useTheme();
  const playerRef = useRef<PlayerHandle | null>(null);
  const night = theme === 'dark' ? 1 : 0;

  // layout effect so the sky has switched before the page's view transition captures it
  useLayoutEffect(() => {
    playerRef.current?.setInput('night', night);
  }, [night]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('bg');
    setBd(q === 'lake' || q === 'india' ? BACKDROPS[q] : BACKDROPS.sky);
  }, []);

  useEffect(() => {
    if (!bd) return;
    let alive = true;
    fetch(`/scene/${bd.scene}.clayzo`)
      .then((r) => r.arrayBuffer())
      .then((bytes) => readClayzoBundle(new Uint8Array(bytes)))
      .then((b) => alive && setBundle(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bd]);

  if (!bd) return <div className="cos-sky" />;

  return (
    <div className="cos-sky" data-bg={bd.scene}>
      <div className="cos-sky-stage">
        <ClayzoPlayer
          document={bundle?.document ?? null}
          options={{ loaders: bundle ?? undefined, interactive: true, loop: true }}
          poster={night ? `/scene/${bd.night}.webp` : `/scene/${bd.scene}.poster.webp`}
          reducedMotion="still"
          decorative
          onReady={(p) => {
            playerRef.current = p;
            p.setInput('night', night);
          }}
          fallback={<img src={night ? `/scene/${bd.night}.webp` : `/scene/${bd.day}.webp`} alt="" />}
        />
      </div>
    </div>
  );
}
