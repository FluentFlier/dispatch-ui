'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'cos-theme';

type Ctx = { theme: Theme; ready: boolean; toggle: () => void };
const ThemeContext = createContext<Ctx>({ theme: 'light', ready: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

/** Runs before paint (inlined in the page) so a returning dark visitor never sees a light flash. */
export const THEME_BOOT = `(function(){try{var t=localStorage.getItem('${KEY}');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.cosTheme=t;}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);
  const easing = useRef(0);

  useEffect(() => {
    const boot = document.documentElement.dataset.cosTheme;
    setTheme(boot === 'dark' ? 'dark' : 'light');
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      // colours ease across the whole page while the sky reveals itself
      root.dataset.cosTheming = 'true';
      window.clearTimeout(easing.current);
      easing.current = window.setTimeout(() => delete root.dataset.cosTheming, 900);
      root.dataset.cosTheme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, ready, toggle }}>{children}</ThemeContext.Provider>;
}
