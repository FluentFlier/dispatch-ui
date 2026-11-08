'use client';

import { useEffect, useRef, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';
import { useTheme } from '../theme';

/**
 * The painted sky (Clayzo, animations/hero-sky.ts). Clouds billow and lean
 * toward the cursor; at night the moonlit painting spreads out from the
 * toggle's corner and stars come out.
 */
export function SkyField() {
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);
  const { theme } = useTheme();
  const playerRef = useRef<PlayerHandle | null>(null);
  const night = theme === 'dark' ? 1 : 0;

  useEffect(() => {
    playerRef.current?.setInput('night', night);
  }, [night]);

  useEffect(() => {
    let alive = true;
    fetch('/scene/hero-sky.clayzo')
      .then((r) => r.arrayBuffer())
      .then((bytes) => readClayzoBundle(new Uint8Array(bytes)))
      .then((b) => alive && setBundle(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="cos-sky">
      <div className="cos-sky-stage">
        <ClayzoPlayer
          document={bundle?.document ?? null}
          options={{ loaders: bundle ?? undefined, interactive: true, loop: true }}
          poster={night ? '/scene/sky-night.webp' : '/scene/hero-sky.poster.webp'}
          reducedMotion="still"
          decorative
          onReady={(p) => {
            playerRef.current = p;
            p.setInput('night', night);
          }}
          fallback={<img src={night ? '/scene/sky-night.webp' : '/scene/sky.webp'} alt="" />}
        />
      </div>
    </div>
  );
}
