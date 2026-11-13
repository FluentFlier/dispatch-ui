'use client';

import { useEffect, useMemo, useState, type ComponentProps, type CSSProperties } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import { useTheme } from '../theme';
import { useRenderScale } from '../useRenderScale';

/**
 * A landing-page scene authored in Clayzo (animations/*.ts). It loads the light or dark
 * build from /scene/<name>/, hands the player Geist and Geist Mono from /fonts, holds its
 * first frame until it is (essentially) fully on screen, then plays and loops. Under
 * reduced motion it shows the finished frame (`stillTick`) instead.
 *
 * A scene can ship a second, stacked composition for phones (`<theme>-narrow.json`); it is
 * used at or below NARROW px, and the box takes that shape from CSS, so nothing shifts.
 */
const NARROW = 1023;
type SceneDoc = NonNullable<ComponentProps<typeof ClayzoPlayer>['document']>;

const bytes = (url: string) =>
  fetch(url)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(url))))
    .then((b) => new Uint8Array(b));
const fonts: Record<string, Promise<Uint8Array>> = {};
const font = (file: string) => (fonts[file] ??= bytes(`/fonts/${file}`));
const docs: Record<string, Promise<SceneDoc>> = {};
const loadDoc = (url: string) => (docs[url] ??= fetch(url).then((r) => r.json()));

export function ClayzoScene({
  name,
  width,
  height,
  stillTick = 0,
  playWhen = 'full',
  narrow,
  narrowBelow = NARROW,
  label,
  className,
  interactive = false,
}: {
  name: string;
  width: number;
  height: number;
  /** size of the stacked phone composition, when the scene has one */
  narrow?: { width: number; height: number };
  /** the widest screen (px) that gets the narrow composition; 1023 unless a layout stacks later */
  narrowBelow?: number;
  /** the frame shown to readers who asked for less motion */
  stillTick?: number;
  /** 'full': start once fully seen (story scenes); 'visible': as soon as any of it shows (backgrounds) */
  playWhen?: 'full' | 'visible';
  label?: string;
  className?: string;
  /** let the scene's own pointer bindings run (the cursor reaches the canvas) */
  interactive?: boolean;
}) {
  const { theme, ready } = useTheme();
  const [near, setNear] = useState(false);
  const [go, setGo] = useState(false);
  const [doc, setDoc] = useState<SceneDoc | null>(null);
  const [reduced, setReduced] = useState(false);
  const [small, setSmall] = useState(false);
  // sharp on every screen: one canvas pixel per device pixel (see useRenderScale)
  const [ref, scale] = useRenderScale(narrow && small ? narrow.width : width);

  useEffect(() => {
    if (!narrow) return;
    const mq = window.matchMedia(`(max-width: ${narrowBelow}px)`);
    const sync = () => setSmall(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [narrow, narrowBelow]);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        const full = e.intersectionRatio >= 0.9 || e.intersectionRect.height >= window.innerHeight * 0.8;
        if (playWhen === 'visible' ? e.intersectionRatio > 0 : full) setGo(true);
      },
      { rootMargin: '300px 0px', threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playWhen, ref]);

  // the build for the current theme; fetched once the scene is near
  useEffect(() => {
    if (!near || !ready) return;
    let alive = true;
    loadDoc(`/scene/${name}/${theme === 'dark' ? 'dark' : 'light'}${narrow && small ? '-narrow' : ''}.json`)
      .then((d) => alive && setDoc(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [near, ready, theme, name, narrow, small]);

  const loaders = useMemo(
    () => ({
      imageAssetLoader: (a: { uri?: string }) => (a.uri ? bytes(`/scene/${name}/${a.uri}`) : null),
      familyFontLoader: (family: string) =>
        family === 'Geist' ? font('Geist-Variable.ttf') : family === 'Geist Mono' ? font('GeistMono-Variable.ttf') : null,
    }),
    [name],
  );

  return (
    <div
      ref={ref}
      className={['cos-clayzo', className].filter(Boolean).join(' ')}
      data-narrow={narrow ? '' : undefined}
      style={
        {
          '--scene-ar': `${width} / ${height}`,
          ...(narrow ? { '--scene-ar-narrow': `${narrow.width} / ${narrow.height}` } : {}),
        } as CSSProperties
      }
    >
      {doc && scale && (
        <ClayzoPlayer
          document={doc}
          options={{ loaders, interactive, loop: true, resolution: scale }}
          // the player applies autoplay once it is shown and whenever it changes: holding it
          // false until the scene is fully seen is what makes it start on arrival
          autoplay={go}
          posterTick={reduced ? stillTick : 0}
          reducedMotion="still"
          {...(label ? { label } : { decorative: true })}
        />
      )}
    </div>
  );
}
