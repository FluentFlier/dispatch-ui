"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconChevronDown } from "@tabler/icons-react";
import { useTheme } from "../theme";
import { MENUS, type NavItem, type NavMenu } from "./menus";

/**
 * The desktop nav's menus. One panel serves them all: moving between Product, Solutions, Compare and
 * Resources slides it under the new trigger and eases it to the new content's size, the content
 * coming in from the side you moved toward. Inside, plain link columns under small group labels
 * (real logos where a page is about a product) and one card on a crop of the painted sky. Opens on hover (after a short pause, so passing over the bar
 * does nothing), on click, and from the keyboard; Escape closes it and returns focus.
 */
const OPEN_DELAY = 80;
const CLOSE_DELAY = 160;

export function MegaNav({ extra }: { extra: { label: string; href: string }[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null); // the menu drawn, kept while it closes
  const [dir, setDir] = useState<"left" | "right" | "none">("none");
  const [box, setBox] = useState<{ x: number; w: number; h: number } | null>(null);
  // just opened from closed: placed without sliding from wherever it last was
  const [fresh, setFresh] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const timer = useRef<number>();
  // the cards follow the hero's backdrop (?bg=india, SkyField): India gets places of its own
  const [bg, setBg] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("bg") === "india") setBg("-india");
  }, []);

  const clear = () => window.clearTimeout(timer.current);
  const show = useCallback(
    (id: string) => {
      clear();
      if (open && open !== id) {
        const a = MENUS.findIndex((m) => m.id === open);
        const b = MENUS.findIndex((m) => m.id === id);
        setDir(b > a ? "right" : "left");
      } else if (!open) {
        setDir("none");
        setFresh(true);
      }
      setOpen(id);
      setShown(id);
    },
    [open],
  );
  const hoverIn = (id: string) => {
    clear();
    if (open) show(id);
    else timer.current = window.setTimeout(() => show(id), OPEN_DELAY);
  };
  const hoverOut = () => {
    clear();
    timer.current = window.setTimeout(() => setOpen(null), CLOSE_DELAY);
  };
  const close = useCallback((focusId?: string) => {
    clear();
    setOpen(null);
    if (focusId) triggers.current[focusId]?.focus();
  }, []);

  // size and place the panel for what it now holds: under its trigger, kept inside the window
  // (and again when the window changes size, so a menu left open never keeps a stale or empty box)
  useLayoutEffect(() => {
    if (!shown) return;
    const measure = () => {
      const t = triggers.current[shown];
      if (!t || !content.current || !wrap.current) return;
      const w = content.current.offsetWidth;
      const h = content.current.offsetHeight;
      if (!w) return; // hidden (the bar leaves below 900px)
      const base = wrap.current.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      const margin = 16;
      let left = tr.left + tr.width / 2 - w / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - margin - w));
      setBox({ x: left - base.left, w, h });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [shown]);
  // once it is drawn and visible, a keyboard opening moves focus to its first control
  useEffect(() => {
    if (!focusIn || !open || !box) return;
    const id = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>("button, a")?.focus();
      setFocusIn(false);
    }, 30);
    return () => window.clearTimeout(id);
  }, [focusIn, open, box]);
  useEffect(() => {
    if (!fresh || !box) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setFresh(false)));
    return () => cancelAnimationFrame(r);
  }, [fresh, box]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(open);
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  const menu = MENUS.find((m) => m.id === shown);

  return (
    <div className="cos-mega" ref={wrap} onPointerLeave={(e) => e.pointerType === "mouse" && hoverOut()} onPointerEnter={clear}>
      <nav className="cos-nav-links" aria-label="Main">
        {MENUS.map((m) => (
          <button
            key={m.id}
            ref={(el) => {
              triggers.current[m.id] = el;
            }}
            type="button"
            className="cos-nav-link cos-mega-trigger"
            aria-expanded={open === m.id}
            aria-controls="cos-mega-panel"
            data-open={open === m.id || undefined}
            onPointerEnter={(e) => e.pointerType === "mouse" && hoverIn(m.id)}
            onClick={(e) => {
              if (open === m.id) return close();
              show(m.id);
              // opened from the keyboard: take focus into the panel, which sits after the triggers
              if (e.detail === 0) setFocusIn(true);
            }}
          >
            {m.label}
            <IconChevronDown size={14} stroke={1.8} aria-hidden="true" className="cos-mega-chev" />
          </button>
        ))}
        {extra.map((l) => (
          <a key={l.label} href={l.href} className="cos-nav-link" onPointerEnter={() => open && hoverOut()}>
            {l.label}
          </a>
        ))}
      </nav>

      <div
        id="cos-mega-panel"
        ref={panel}
        className="cos-mega-panel"
        data-state={open ? "open" : "closed"}
        data-fresh={fresh || undefined}
        style={box ? { transform: `translateX(${box.x}px)`, width: box.w, height: box.h } : undefined}
        onTransitionEnd={(e) => {
          if (e.propertyName === "opacity" && !open) setShown(null);
        }}
      >
        {menu && (
          <div ref={content} key={menu.id} className="cos-mega-content" data-dir={dir}>
            <MenuBody menu={menu} bg={bg} onGo={() => close()} />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuBody({ menu, bg, onGo }: { menu: NavMenu; bg: string; onGo: () => void }) {
  const { theme } = useTheme();
  const c = menu.card;
  return (
    <div className="cos-mega-body">
      {menu.columns.map((col, i) => (
        <div key={i} className="cos-mega-col">
          {col.map((g) => (
            <div key={g.label + i} className="cos-mega-group">
              <p className="cos-mega-label" aria-hidden={g.label.trim() ? undefined : true}>
                {g.label}
              </p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.href + it.label}>
                    <Item it={it} onGo={onGo} slot={g.items.some((x) => x.icon)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
      <Link href={c.href} className="cos-mega-card" onClick={onGo}>
        <img
          src={`/brand/nav/${c.image}${bg}-${theme === "dark" ? "night" : "day"}.jpg`}
          alt=""
          width={560}
          height={432}
          className="cos-mega-card-img"
        />
        <span className="cos-mega-card-text">
          <span className="cos-mega-card-title">{c.title}</span>
          <span className="cos-mega-card-line">{c.line}</span>
        </span>
      </Link>
    </div>
  );
}

function Item({ it, onGo, slot }: { it: NavItem; onGo: () => void; slot: boolean }) {
  // in a group with logos, a page without one keeps the slot, so the words stay in line
  const body = (
    <>
      {(it.icon || slot) && <span className="cos-mega-logo">{it.icon}</span>}
      <span className="cos-mega-word">{it.label}</span>
      {it.soon && <span className="cos-mega-soon">Soon</span>}
    </>
  );
  // not live yet: said in words, and not a link
  return it.soon ? (
    <span className="cos-mega-link" data-soon="">
      {body}
    </span>
  ) : (
    <Link href={it.href} className="cos-mega-link" onClick={onGo}>
      {body}
    </Link>
  );
}
