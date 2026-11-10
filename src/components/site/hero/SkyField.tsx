'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';
import { useTheme } from '../theme';
import { useRenderScale } from '../useRenderScale';
import { heroPartReady } from '../heroReady';

/**
 * The hero backdrop (Clayzo, animations/hero-sky.ts with BG=india): an Udaipur-style lake palace
 * under a painted sky whose clouds drift and lean toward the cursor, painted in oil by the shader (a
 * brush filter and a canvas weave). Day and night switch instantly; the page-wide wipe (theme.tsx)
 * does the reveal. India is the site's only backdrop; every painted panel and card follows it.
 */
const BACKDROP = { scene: 'hero-india', day: 'india', night: 'india-night' } as const;

export function SkyField() {
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);
  const bd = BACKDROP;
  const { theme } = useTheme();
  const playerRef = useRef<PlayerHandle | null>(null);
  const night = theme === 'dark' ? 1 : 0;
  // drawn at the stage's real pixel size, capped at 2x: it is full bleed and soft, so 3x buys nothing.
  // On a phone the stage is ~1440 px wide with only a quarter on screen, and it redraws every frame
  // while you scroll: 1.25x there keeps the clouds soft-sharp at a third of the pixels
  const [phone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 719px)').matches);
  const [stageRef, scale] = useRenderScale(bundle?.document.canvas.width, phone ? 1.25 : 2);

  // layout effect so the sky has switched before the page's view transition captures it
  useLayoutEffect(() => {
    playerRef.current?.setInput('night', night);
  }, [night]);

  useEffect(() => {
    let alive = true;
    fetch(`/scene/${bd.scene}.clayzo`)
      .then((r) => r.arrayBuffer())
      .then((bytes) => readClayzoBundle(new Uint8Array(bytes)))
      .then((b) => alive && setBundle(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [bd.scene]);

  return (
    <div className="cos-sky" data-bg={bd.scene}>
      <div className="cos-sky-stage" ref={stageRef}>
        <ClayzoPlayer
          document={scale ? (bundle?.document ?? null) : null}
          options={{ loaders: bundle ?? undefined, interactive: true, loop: true, resolution: scale }}
          reducedMotion="still"
          decorative
          onReady={(p) => {
            playerRef.current = p;
            p.setInput('night', night);
            heroPartReady('sky');
          }}
          onPlayerError={() => heroPartReady('sky')}
          fallback={<img src={night ? `/scene/${bd.night}.webp` : `/scene/${bd.day}.webp`} alt="" />}
        />
      </div>
    </div>
  );
}
