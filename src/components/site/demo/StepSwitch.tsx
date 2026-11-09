'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ClayzoPlayer } from '@clayzo/webgl-player/react';
import type { PlayerHandle } from '@clayzo/webgl-player';
import { useTheme } from '../theme';
import { useRenderScale } from '../useRenderScale';

/**
 * The demo's step switch (Clayzo, animations/step-switch.ts): the thumb carries the step's glyph in
 * the ContentOS mark's square cells, which come apart and re-form as it moves to another step, and
 * fill in cell by cell as the step plays. The tab buttons are passed in as children and laid over
 * the trough on the same four columns, each label just after its glyph.
 *
 * `pos` scrubs the scene's timeline (one segment per step), eased here on every change, so a click
 * moves the thumb exactly as the walkthrough does.
 */
const NARROW = 1023;
// mirrors LAYOUT in animations/step-switch.ts; slot = where a label starts in its tab (inset + glyph + gap)
const SIZE = {
  wide: { W: 520, H: 50, pad: 5, slot: 12 + 9 * 2.7 + 9 },
  narrow: { W: 360, H: 46, pad: 5, slot: 8 + 9 * 2.3 + 6 },
};
const MOVE_MS = 720;
const ease = (x: number) => 1 - Math.pow(1 - x, 3.2);
type Doc = NonNullable<Parameters<typeof ClayzoPlayer>[0]['document']>;
const docs: Record<string, Promise<Doc>> = {};
const loadDoc = (url: string) => (docs[url] ??= fetch(url).then((r) => r.json()));

export function StepSwitch({
  step,
  stepStart,
  ms,
  running,
  still,
  children,
}: {
  step: number;
  /** performance.now() when the current step began */
  stepStart: number;
  /** how long the current step runs */
  ms: number;
  /** the walkthrough is playing (on screen, motion allowed) */
  running: boolean;
  /** reduced motion: every step shows finished */
  still: boolean;
  children: ReactNode;
}) {
  const { theme, ready } = useTheme();
  const [small, setSmall] = useState(false);
  const S = small ? SIZE.narrow : SIZE.wide;
  const [ref, scale] = useRenderScale(S.W);
  const [doc, setDoc] = useState<Doc | null>(null);
  const player = useRef<PlayerHandle | null>(null);
  const progress = useRef(0);
  const pos = useRef(step);
  const live = useRef({ step, stepStart, ms, running, still });
  live.current = { step, stepStart, ms, running, still };

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW}px)`);
    const sync = () => setSmall(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    loadDoc(`/scene/step-switch/${theme === 'dark' ? 'dark' : 'light'}${small ? '-narrow' : ''}.json`)
      .then((d) => alive && setDoc(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, theme, small]);

  // the thumb moves: ease pos from where it is to the new step
  useEffect(() => {
    const from = pos.current;
    const to = step;
    if (from === to) return;
    if (still) {
      pos.current = to;
      player.current?.setInput('pos', to);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / MOVE_MS);
      pos.current = from + (to - from) * ease(k);
      player.current?.setInput('pos', pos.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, still]);

  // progress follows the step's clock while it runs; it holds where it is while paused
  useEffect(() => {
    if (still) {
      progress.current = 1;
      player.current?.setInput('progress', 1);
      return;
    }
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const l = live.current;
      progress.current = Math.min(1, Math.max(0, (performance.now() - l.stepStart) / l.ms));
      player.current?.setInput('progress', progress.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, still, stepStart]);

  return (
    <div
      ref={ref}
      className="dm-switch"
      style={
        {
          '--switch-ar': `${S.W} / ${S.H}`,
          '--switch-pad': `${(S.pad / S.W) * 100}%`,
          '--switch-slot': `${(S.slot / ((S.W - 2 * S.pad) / 4)) * 100}%`,
        } as CSSProperties
      }
    >
      {doc && scale && (
        <ClayzoPlayer
          document={doc}
          options={{ interactive: true, loop: false, resolution: scale }}
          autoplay
          decorative
          onReady={(p) => {
            player.current = p;
            p.setInput('pos', pos.current);
            p.setInput('progress', progress.current);
          }}
        />
      )}
      {children}
    </div>
  );
}
