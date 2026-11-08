'use client';

import { useEffect, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';

/** Halftone field behind the hero (Clayzo, animations/hero-dots.ts). Dots swell toward the cursor. */
export function DotField() {
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/scene/hero-dots.clayzo')
      .then((r) => r.arrayBuffer())
      .then((bytes) => readClayzoBundle(new Uint8Array(bytes)))
      .then((b) => alive && setBundle(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="cos-bg">
      <div className="cos-bg-stage">
        <ClayzoPlayer
          document={bundle?.document ?? null}
          options={{ loaders: bundle ?? undefined, interactive: true, loop: true }}
          poster="/scene/hero-dots.poster.webp"
          reducedMotion="still"
          decorative
        />
      </div>
    </div>
  );
}
