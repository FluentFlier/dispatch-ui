'use client';

import { useEffect, useRef, useState } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { readClayzoBundle, type LoadedClayzo } from '@clayzo/animation/bundle';
import { useTheme } from './theme';

/** The light / dark switch (Clayzo, animations/theme-toggle.ts). The page owns the theme; the toggle shows it. */
export function ThemeToggle() {
  const { theme, ready, toggle } = useTheme();
  const [bundle, setBundle] = useState<LoadedClayzo | null>(null);
  const playerRef = useRef<PlayerHandle | null>(null);
  const initial = useRef<'day' | 'night' | null>(null);
  if (ready && initial.current === null) initial.current = theme === 'dark' ? 'night' : 'day';

  useEffect(() => {
    let alive = true;
    fetch('/scene/theme-toggle.clayzo')
      .then((r) => r.arrayBuffer())
      .then((bytes) => readClayzoBundle(new Uint8Array(bytes)))
      .then((b) => alive && setBundle(b))
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
          document={bundle?.document ?? null}
          options={{ loaders: bundle ?? undefined, interactive: false, initialState: initial.current ?? 'day' }}
          decorative
          onReady={(p) => {
            playerRef.current = p;
            p.setInput('dark', dark);
          }}
          fallback={<span className="cos-theme-fallback" data-dark={dark} />}
        />
      )}
    </button>
  );
}
