'use client';

import { useEffect, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';

/** The painted morning sky (Clayzo, animations/hero-sky.ts). Clouds billow and lean toward the cursor. */
export function SkyField() {
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);

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
          poster="/scene/hero-sky.poster.webp"
          reducedMotion="still"
          decorative
          fallback={<img src="/scene/sky.webp" alt="" />}
        />
      </div>
    </div>
  );
}
