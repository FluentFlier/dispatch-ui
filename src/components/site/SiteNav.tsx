'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Wordmark } from './brand/Mark';
import { ThemeToggle } from './ThemeToggle';
import { MegaNav } from './nav/MegaNav';
import { MobileNav } from './nav/MobileNav';

/** Signed in: just the way back into the app. Signed out: Sign in and Get started. */
export function SiteNav({ cta, loggedIn }: { cta: { href: string; label: string }; loggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="cos-nav" data-scrolled={scrolled}>
      <div className="cos-nav-inner">
        <Link href="/" className="cos-nav-brand" aria-label="ContentOS home">
          <Wordmark />
        </Link>

        <MegaNav extra={[{ label: 'Pricing', href: '/pricing' }]} />

        <div className="cos-nav-actions">
          <ThemeToggle />
          {!loggedIn && (
            <Link href="/login" className="cos-btn cos-btn-silver cos-btn-sm cos-nav-login">
              <span>Sign in</span>
            </Link>
          )}
          <Link href={cta.href} className="cos-btn cos-btn-metal cos-btn-sm">
            <span>{cta.label}</span>
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="cos-nav-menu"
            aria-expanded={open}
            aria-controls="cos-mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Open menu</span>
            <span aria-hidden="true" className="cos-nav-menu-bars" />
          </button>
        </div>
      </div>

      <MobileNav open={open} onClose={closeMenu} cta={cta} loggedIn={loggedIn} menuButton={menuButton} />
    </header>
  );
}
