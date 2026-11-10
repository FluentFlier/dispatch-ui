"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { Wordmark } from "../brand/Mark";
import { MENUS } from "./menus";

/**
 * The menu on phones and tablets, in Amplitude's pattern: a full-screen ink sheet with its own
 * wordmark and close button, the four menus as large rows with a chevron, each opening in place to
 * its pages under small grey labels, Pricing as a plain row, and the two actions held at the
 * bottom. One menu open at a time; the page underneath does not scroll while the sheet is up.
 */
export function MobileNav({
  open,
  onClose,
  cta,
  loggedIn,
  menuButton,
}: {
  menuButton: RefObject<HTMLButtonElement>;
  open: boolean;
  onClose: () => void;
  cta: { href: string; label: string };
  loggedIn: boolean;
}) {
  const [section, setSection] = useState<string | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // closed: out of the tab order and away from screen readers (React 18 has no inert prop)
  useEffect(() => {
    sheet.current?.toggleAttribute("inert", !open);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSection(null);
      return;
    }
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    // focus moves into the sheet, and back to the menu button when it closes (Safari never focuses
    // a tapped button, so it is named, not taken from document.activeElement)
    const back = menuButton.current;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [open, onClose, menuButton]);

  return (
    <div
      ref={sheet}
      id="cos-mobile-menu"
      className="cos-msheet"
      data-open={open || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="cos-msheet-top">
        <Link href="/" className="cos-nav-brand" aria-label="ContentOS home" onClick={onClose}>
          <Wordmark />
        </Link>
        <button ref={closeBtn} type="button" className="cos-msheet-close" onClick={onClose}>
          <IconX size={26} stroke={1.6} aria-hidden="true" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>

      <nav className="cos-msheet-list" aria-label="Main">
        {MENUS.map((m) => {
          const isOpen = section === m.id;
          return (
            <div key={m.id} className="cos-msheet-row" data-open={isOpen || undefined}>
              <button
                type="button"
                className="cos-msheet-head"
                aria-expanded={isOpen}
                aria-controls={`cos-msheet-${m.id}`}
                onClick={() => setSection(isOpen ? null : m.id)}
              >
                {m.label}
                <IconChevronDown size={22} stroke={1.8} aria-hidden="true" className="cos-msheet-chev" />
              </button>
              <div id={`cos-msheet-${m.id}`} className="cos-msheet-body">
                <div className="cos-msheet-inner">
                  {m.columns.flat().map((g, i) => (
                    <div key={g.label + i} className="cos-msheet-group">
                      {g.label.trim() && <p className="cos-msheet-label">{g.label}</p>}
                      <ul>
                        {g.items.map((it) => (
                          <li key={it.href + it.label}>
                            <Link href={it.href} className="cos-msheet-link" onClick={onClose}>
                              {it.icon && <span className="cos-msheet-logo">{it.icon}</span>}
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div className="cos-msheet-row">
          <Link href="/pricing" className="cos-msheet-head" onClick={onClose}>
            Pricing
          </Link>
        </div>
      </nav>

      <div className="cos-msheet-actions">
        {!loggedIn && (
          <Link href="/login" className="cos-msheet-btn" onClick={onClose}>
            Sign in
          </Link>
        )}
        <Link href={cta.href} className="cos-msheet-btn" data-primary="" onClick={onClose}>
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
