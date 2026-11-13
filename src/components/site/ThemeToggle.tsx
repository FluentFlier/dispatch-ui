'use client';

import { useEffect, useRef, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';
import { useTheme } from './theme';
import { useRenderScale } from './useRenderScale';
import { heroPartReady } from './heroReady';

/**
 * The switch's file and the Clayzo engine, both requested as soon as this script runs. The player
 * asks for its engine only once it has a document and a size, so on a phone the engine download
 * waited behind hydration, this fetch and the first layout; started here, they run side by side.
 */
const toggleBundle =
  typeof window === 'undefined'
    ? null
    : fetch('/scene/theme-toggle.clayzo')
        .then((r) => r.arrayBuffer())
        .then((bytes) => readClayzoBundle(new Uint8Array(bytes)));
if (typeof window !== 'undefined') void import('@clayzo/webgl-player').catch(() => {});

/** The light / dark switch (Clayzo, animations/theme-toggle.ts). The page owns the theme; the toggle shows it. */
export function ThemeToggle() {
  const { theme, ready, toggle } = useTheme();
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);
  const playerRef = useRef<PlayerHandle | null>(null);
  const initial = useRef<'day' | 'night' | null>(null);
  const [boxRef, scale] = useRenderScale<HTMLButtonElement>(bundle?.document.canvas.width);
  if (ready && initial.current === null) initial.current = theme === 'dark' ? 'night' : 'day';

  useEffect(() => {
    let alive = true;
    toggleBundle
      ?.then((b) => alive && setBundle(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    playerRef.current?.setInput('dark', theme === 'dark');
  }, [theme]);

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      ref={boxRef}
      className="cos-theme-toggle"
      data-theme-toggle
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        // the thumb starts sliding on the click itself, in step with the curtain
        if (toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })) {
          playerRef.current?.setInput('dark', !dark);
        }
      }}
    >
      {ready && (
        <ClayzoPlayer
          document={scale ? (bundle?.document ?? null) : null}
          options={{ loaders: bundle ?? undefined, interactive: false, initialState: initial.current ?? 'day', resolution: scale }}
          decorative
          onReady={(p) => {
            playerRef.current = p;
            p.setInput('dark', dark);
            heroPartReady('toggle');
          }}
          onPlayerError={() => heroPartReady('toggle')}
          fallback={<span className="cos-theme-fallback" data-dark={dark} />}
        />
      )}
    </button>
  );
}
