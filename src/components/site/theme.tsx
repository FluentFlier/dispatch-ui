'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';
const KEY = 'cos-theme';

type Origin = { x: number; y: number };
/** toggle returns false when a switch is already running (the click is ignored). */
type Ctx = { theme: Theme; ready: boolean; toggle: (origin?: Origin) => boolean };
const ThemeContext = createContext<Ctx>({ theme: 'light', ready: false, toggle: () => false });
export const useTheme = () => useContext(ThemeContext);

/** Runs before paint (inlined in the page) so a returning dark visitor never sees a light flash. */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem('${KEY}');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.cosTheme=t;}catch(e){}})();`;

type ViewTransition = { ready: Promise<void>; finished: Promise<void> };
type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => ViewTransition };

const WIPE_MS = 820;
const WIPE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const WATCHDOG_MS = 400;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);
  const themeRef = useRef<Theme>('light');
  const busy = useRef(false);

  useEffect(() => {
    const boot: Theme = document.documentElement.dataset.cosTheme === 'dark' ? 'dark' : 'light';
    themeRef.current = boot;
    setTheme(boot);
    setReady(true);
  }, []);

  const toggle = useCallback((origin?: Origin) => {
    if (busy.current) return false;
    const next: Theme = themeRef.current === 'dark' ? 'light' : 'dark';
    themeRef.current = next;
    const root = document.documentElement;

    let applied = false;
    const apply = () => {
      if (applied) return;
      applied = true;
      root.dataset.cosTheme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode */
      }
      flushSync(() => setTheme(next));
    };

    const doc = document as ViewTransitionDoc;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) {
      apply();
      return true;
    }

    // One clean wipe: the browser freezes the old page, applies the new theme, and we
    // grow the new page in a circle from the toggle over the old one. Everything inside
    // the circle (sky, colours, cards, nav) is already the new theme.
    busy.current = true;
    const x = origin?.x ?? window.innerWidth - 80;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const done = () => {
      busy.current = false;
    };

    let transition: ViewTransition;
    try {
      transition = doc.startViewTransition(apply);
    } catch {
      apply();
      done();
      return true;
    }
    // if a browser ever stalls the transition, switch anyway rather than leave the page behind
    const watchdog = window.setTimeout(apply, WATCHDOG_MS);
    transition.ready
      .then(() => {
        // the page and the nav (its own layer, so its glass background never lags) share one circle
        for (const layer of ['root', 'cos-nav']) {
          try {
            root.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
              { duration: WIPE_MS, easing: WIPE_EASE, pseudoElement: `::view-transition-new(${layer})` },
            );
          } catch {
            /* layer not present */
          }
        }
      })
      .catch(() => {});
    transition.finished
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(watchdog);
        done();
      });
    // never stay locked out of the toggle
    window.setTimeout(done, WIPE_MS + 600);
    return true;
  }, []);

  return <ThemeContext.Provider value={{ theme, ready, toggle }}>{children}</ThemeContext.Provider>;
}
