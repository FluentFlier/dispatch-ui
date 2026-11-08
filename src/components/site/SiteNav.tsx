'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wordmark } from './brand/Mark';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Compare', href: '/compare' },
  { label: 'Resources', href: '/blog' },
];

export function SiteNav({ cta }: { cta: { href: string; label: string } }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="cos-nav" data-scrolled={scrolled || open} data-open={open}>
      <div className="cos-nav-inner">
        <Link href="/" className="cos-nav-brand" aria-label="ContentOS home">
          <Wordmark />
        </Link>

        <nav className="cos-nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="cos-nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="cos-nav-actions">
          <ThemeToggle />
          <Link href="/login" className="cos-btn cos-btn-silver cos-btn-sm cos-nav-login">
            <span>Sign in</span>
          </Link>
          <Link href={cta.href} className="cos-btn cos-btn-metal cos-btn-sm">
            <span>{cta.label}</span>
          </Link>
          <button
            type="button"
            className="cos-nav-menu"
            aria-expanded={open}
            aria-controls="cos-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden="true" className="cos-nav-menu-bars" />
          </button>
        </div>
      </div>

      <div id="cos-mobile-menu" className="cos-nav-sheet" hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} className="cos-nav-sheet-link" onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <Link href="/login" className="cos-nav-sheet-link">
          Sign in
        </Link>
      </div>
    </header>
  );
}
