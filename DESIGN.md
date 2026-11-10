---
version: alpha
name: ContentOS
description: The marketing site for ContentOS, a system that writes in your voice, posts on your schedule and finds the people ready to talk. Calm, painted, quietly technical.

colors:                       # hex of the values in src/components/site/site.css (source wins)
  ground: "#faf9f6"
  ink: "#101114"
  ink-2: "#4c4e57"
  ink-3: "#7e808a"
  ink-sky: "#2c2e36"
  line: "#10111414"
  blue: "#2f5bea"
  apricot: "#f08a4b"
  peach: "#fbd3b2"
  sky: "#8fb3e2"
  lilac: "#b9b3e0"
  dark-ground: "#080f14"
  dark-ink: "#eef2f4"
  dark-ink-2: "#a7b1b8"
  dark-ink-3: "#75818a"
  dark-ink-sky: "#c1cbd1"
  dark-line: "#ffffff14"
  dark-blue: "#6cc6eb"
  sheet: "#0b1014"
typography:
  display: { fontFamily: Mona Sans, fontSize: "clamp(2.75rem, 1.2rem + 3.4vw, 4rem)", fontWeight: 500, lineHeight: 1, letterSpacing: -0.035em, fontStretch: 104% }
  section-title: { fontFamily: Mona Sans, fontSize: "clamp(2.5rem, 1.2rem + 3vw, 3.75rem)", fontWeight: 500, lineHeight: 1.02, fontStretch: 104% }
  lead: { fontFamily: Mona Sans, fontSize: "clamp(17px, 0.95rem + 0.3vw, 19px)", fontWeight: 450, lineHeight: 1.65 }
  body: { fontFamily: Mona Sans, fontSize: 16px, fontWeight: 400, lineHeight: 1.5 }
  label: { fontFamily: Mona Sans, fontSize: 12.5px, fontWeight: 550, lineHeight: 1.3 }
  wordmark: { fontFamily: Geist, fontSize: 19px, fontWeight: 600, letterSpacing: -0.035em }
rounded:
  control-sm: 10px
  control: 12px
  card: 12px
  panel: 18px
spacing:
  gutter: "clamp(20px, 4vw, 48px)"
  max: 1200px
components:
  button-primary: { backgroundColor: "{colors.ink}", textColor: "{colors.ground}", rounded: "{rounded.control}", height: 52px }
  button-secondary: { backgroundColor: "#ffffff", textColor: "{colors.ink}", rounded: "{rounded.control}", height: 52px }

seam:
  index: .seam/design-index.json
  sources: [src/components/site/site.css, src/app/layout.tsx]
  maturity: partial
  surfaces:
    marketing: ["src/components/site/**", "src/components/landing/**", "animations/**", "public/scene/**", "public/brand/**"]
    product: ["src/app/**", "src/components/**"]   # the app; not covered by this document
    other: ["**/*.test.tsx", "**/*.stories.tsx"]
  owners: ["Purav Patel"]
---

# ContentOS landing page design system

This document covers the marketing site only: the landing page under `src/components/site/`, its Clayzo scenes under
`animations/` and `public/scene/`, and its brand files under `public/brand/`. The product app has its own styles
and is out of scope here.

## Overview

Founders and B2B creators deciding, on a laptop or a phone, whether ContentOS can run their LinkedIn and X for them.
Calm, painted, quietly technical. Comfortable density: one idea per screen.

The page opens on an oil-painted Indian landscape (an Udaipur-style lake palace under a painted sky) with one promise and
two metal buttons. Below it, each section shows one part of the product working, drawn live with Clayzo: real
product windows, halftone and dither fields, paper planes. The paper plane is the brand's recurring object, from the
nav mark to the footer wordmark.

Principles:
1. **Compose, don't invent.** A new section reuses the page's type scale, buttons, ground and Clayzo scene frame. A
   new kind of object is a reviewed decision (rulebook `40-evolve`).
2. **Tokens, not values.** Colours come from the `--cos-*` tokens; eases from `--cos-ease-*`; widths from
   `--cos-gutter` and `--cos-max`.
3. **Every state ships.** Hover, active, focus-visible and reduced motion for every control; light and dark for every
   surface and picture.
4. **Show the product, never a stand-in.** Motion is a live Clayzo scene, never a poster image or a static
   screenshot in its place. Product claims come from the product handover and the redesign pack only.
5. **Dark is the reference.** The deep-ocean dark theme is signed off; light-mode tuning is gated with
   `html:not([data-cos-theme='dark'])` so dark stays identical.

Code layers:

| Layer | Path | Rule |
|---|---|---|
| Tokens | `src/components/site/site.css` (`.cos` and `html[data-cos-theme='dark'] .cos`) | The only place colours, eases and widths are defined |
| Fonts | `src/app/layout.tsx` (`--font-mona`, `--font-geist-sans`) | Loaded once; referenced as `--cos-sans` and `--cos-geist` |
| Page shell | `SiteHome.tsx`, `SiteNav.tsx`, `SiteFooter.tsx`, `theme.tsx`, `ThemeToggle.tsx` | One of each per page |
| Shared pieces | `nav/`, `brand/`, `sections/ClayzoScene.tsx` | Used by 2+ sections |
| Sections | `hero/`, `sections/Act*.tsx`, `sections/CtaBand.tsx`, `demo/` | Compose the shared pieces; each section looks different |
| Scenes | `animations/*.ts` → `public/scene/<name>/` | Authored with Clayzo; built JSON plus painted assets |

## Colors

| Role | Token | Use for | Never for |
|---|---|---|---|
| Page | `--cos-ground`, `--cos-ink` | page background and primary text | |
| Secondary text | `--cos-ink-2` | supporting copy, sub-lines | text on the sky |
| Tertiary text | `--cos-ink-3` | quiet metadata | text under 14px in light mode (fails AA, see Known debt) |
| Text on the sky | `--cos-ink-sky` | sub-lines over the hero painting | plain ground |
| Lines | `--cos-line` | hairlines, dividers, scrolled-nav border | |
| Focus and links | `--cos-blue` | focus ring (2px, 3px offset) | large fills |
| Painted accents | `--cos-apricot`, `--cos-peach`, `--cos-sky`, `--cos-lilac` | the hero aura and scene palettes | UI chrome, text |
| Phone menu | `#0b1014` (sheet) | the full-screen phone menu, both themes | anything else |

Dark mode: `data-cos-theme="dark"` on `<html>`, set by `theme.tsx`; the toggle wipes the page with a view
transition. Dark redefines the same `--cos-*` tokens (deep-ocean ground, cool ink, sky-blue accent). Components never
hard-code a second colour for dark; they read the token or add one `html[data-cos-theme='dark']` rule next to the
light rule.

Contrast (measured with Seam `contrast.mjs`, WCAG 2.2):

| Pair | Light | Dark |
|---|---|---|
| ink on ground | 17.93 | 17.12 |
| ink-2 on ground | 7.87 | 8.84 |
| ink-3 on ground | **3.73** | 4.83 |
| blue (focus) on ground | 5.24 | 10.03 |
| phone menu label `#8d979e` on sheet | 6.42 | 6.42 |

## Typography

| Role | Selector | Use |
|---|---|---|
| Display | `.cos-hero-title` | the hero promise only |
| Section title | `.cos-act-title`, `.cos-cta-title` | one per section; `font-stretch: 104%` |
| Card title | `.cos-more-title` (20px) | feature cards |
| Lead | `.cos-hero-sub`, section sub-lines | 17 to 19px, `max-width: 38ch` |
| Body | `.cos` default | 16px / 1.5 |
| Label | `.cos-mega-label`, `.cos-foot-title` | 12.5 to 13px group labels |
| Wordmark | `.cos-wordmark` | Geist 600; the nav and the phone menu |

Families: `--cos-sans` (Mona Sans, variable weight 200 to 900, width 75 to 125%) for the page; `--cos-geist`
(Geist) for the wordmark and the product windows in `demo/`. Weights: 400 body, 450 leads and links, 500 titles and
buttons, 550 labels. Headings are sentence case. The brand is written "ContentOS".

## Layout

Width: content sits inside `max-width: calc(var(--cos-max) + 2 * var(--cos-gutter))` with `--cos-gutter` padding.
One section per screen at 1440×900, never two section headings on one screen. Equal left and right content edges.

Breakpoints (provisional, from the code): 900px swaps the desktop menus for the phone menu; 719px swaps each Clayzo
scene to its narrow composition (`narrowBelow={719}`). Touch targets are at least 44px (menu button, close button,
phone menu rows).

## Elevation & Depth

| Level | Where | Use |
|---|---|---|
| 0 | the ground with its navy (light) or white (dark) grain, `--cos-noise` | the page |
| 1 | metal and silver button shadows | buttons only |
| 2 | `.cos-mega-panel` (ring plus a 60px soft shadow) | the desktop menu |
| 3 | the scrolled nav (solid, no blur) | sticky header |

No backdrop blur over animated scenes (Chrome flickered). Layers in use (provisional): 0 to 3 for stacking inside a
section, 50 nav, 60 phone menu sheet, 100 skip link. No other z-index values.

## Shapes

Radii: 10px small controls (`.cos-btn-sm`, nav links, close button), 12px buttons and nav cards, 18px the desktop
menu panel. Focus ring radius follows the control (10px default, 6px on nav triggers).

### Icons

Interface icons: `@tabler/icons-react` (chevrons, close), stroke 1.6 to 1.8. The product windows in `demo/` use
`lucide-react`, as the app does. Platform logos (LinkedIn, X, Threads) are components in `brand/Logos.tsx`.
Third-party marks (Claude, Claude Code, Codex, Cursor, Grok Bot, Muse, Dots, HubSpot, Apollo, Slack) are the makers'
real logos as 128px PNGs in `public/brand/logos/`; single-colour black marks carry `data-mono` and invert on dark.
Icon-only buttons carry an `sr-only` name.

### The mark

The ContentOS mark is a two-fold paper plane, `public/brand/mark.svg`, in the Tropical colourway: the upper fold shades
teal to sky blue (#00E0A8 to #00A3FF), the lower fold yellow to orange (#FFD23F to #FF5A3D), tail to nose, under a
#16100D outline. One version for both themes. Its colours live in `animations/lib/mark.ts`; change them only with
`npx tsx animations/apply-mark.ts <colourway>`, which rewrites the SVG, the favicon, the app logo and every plane
scene. Dithered planes light up in one colour per theme (sky blue on light, sea green on dark).

## Motion

| Token | Value | Use |
|---|---|---|
| `--cos-ease-out` | cubic-bezier(0.23, 1, 0.32, 1) | default: anything entering, leaving or pressed |
| `--cos-ease-expo` | cubic-bezier(0.16, 1, 0.3, 1) | long reveals |

Durations are not tokens yet; the code uses (provisional) 140 to 160ms press and close, 180 to 240ms menus and
panels, 280ms the phone menu rows opening, 500ms card image zoom, 900ms the button shine. Animate `transform` and
`opacity` (the phone menu rows animate `grid-template-rows`). Buttons press to `scale(0.97)`. Menus close faster than
they open. Every transition has a `prefers-reduced-motion: reduce` rule that turns it off.

Scenes: every animated picture is a Clayzo scene in `animations/<name>.ts`, built to `public/scene/<name>/`, mounted
with `ClayzoScene`, playing only when visible (`playWhen="visible"`), with a light and a dark build and a narrow
composition for phones.

## Components

| Component | Path | Variants | States | Use instead of | Status |
|---|---|---|---|---|---|
| Button | `.cos-btn` in `site.css` | `.cos-btn-metal` (primary), `.cos-btn-silver` (secondary) · size: default 52px, `.cos-btn-sm` 38px | hover (shine sweep), active (scale 0.97), focus-visible; metal and silver swap roles in dark | a hand-styled `<a>` or `<button>` | ready |
| Wordmark, Mark | `brand/Mark.tsx` | | | the plane image on its own in the nav | ready |
| Platform logos | `brand/Logos.tsx` | size | | inline SVG copies | ready |
| SiteNav | `SiteNav.tsx` | scrolled / at top | links hidden over the hero until scroll | | ready |
| MegaNav | `nav/MegaNav.tsx`, items in `nav/menus.tsx` | | hover intent (80ms in, 160ms out), click, keyboard (focus moves in, Escape returns), resizes between menus | other dropdowns | ready |
| MobileNav | `nav/MobileNav.tsx` | | open / closed (inert), one row open at a time, Escape, focus returns to the menu button, page scroll locked | inline expanding lists | ready |
| ThemeToggle | `ThemeToggle.tsx` | | | a second toggle (shares a view-transition name) | ready, one per page |
| ClayzoScene | `sections/ClayzoScene.tsx` | `name`, `width`/`height`, `narrow`, `narrowBelow`, `playWhen`, `interactive`, `label` | visible / hidden, reduced motion | `<video>`, GIFs, poster images | ready |
| Hero | `hero/Hero.tsx`, `hero/SkyField.tsx` | backdrop: sky, india | | | ready |
| ProductDemo | `demo/ProductDemo.tsx`, `demo/StepSwitch.tsx` | | | screenshots of the app | ready |
| Sections | `sections/ActVoice.tsx`, `ActLeads.tsx`, `ActOutreach.tsx`, `ActMore.tsx`, `CtaBand.tsx` | | | | ready |
| Integration page | `pages/ForGrokBot.tsx` (route `src/app/for/grok-bot`), `.cos-for-*`, scene `animations/grok-hero.ts` | | hero scene plays its intro once then idles (state machine); nav links show from the top (`data-page="sub"`) | a landing section reused as a page hero | experimental |
| Pricing page | `pages/Pricing.tsx` (route `src/app/pricing`), `.cos-price-*` | | no scene: the word Pricing, then the card; account counter 1 to 50 (hover, active, focus-visible, disabled at the ends; the count is announced); `?trial=expired` and `?checkout=canceled` notices | the old three-plan page | experimental |
| CopyField | `pages/CopyField.tsx`, `.cos-copy*` | | idle / copied / manual (clipboard refused: text selected, "Press ⌘C"); hover, active, focus-visible; announced in an `aria-live` region | a raw `<code>` with no way to copy | experimental |
| FAQ | `sections/ActFaq.tsx`, `.cos-faq-*` | | per row: closed / open (several at once), hover, active, focus-visible, reduced motion; closed answers hidden from the tab order | a `<details>` list or a second accordion | experimental |
| SiteFooter | `SiteFooter.tsx` | | | | ready |

Rules:
- Menu content lives in `nav/menus.tsx` and feeds both MegaNav and MobileNav; never write menu links in two places.
- India is the only backdrop. Every painted picture (the hero, the feature panels, the closing band, the nav cards, the
  integration panels) is an Indian place in the hero's painting style; the retired painted sky is not shipped.

## Patterns

**section**: one `<section>` per product idea, its own `h2` (`.cos-act-title` or `.cos-cta-title`), one sub-line,
one Clayzo scene or product window. No two sections share a layout; no template eyebrow labels above headings.

**painted picture**: generated with a style reference, cropped to 2× its CSS size, baked through the hero's oil-paint
pass (`animations/paint-panels.ts`), in day and night. Each new picture is a new Indian place, never a repeat.

**menu** (desktop and phone): grouped links under labels in `--cos-ink`; real logos only where a page is about a
product; a group with logos keeps an empty logo slot for items without one, so the words line up.

## Do's and Don'ts

- MUST read colours from `--cos-*` tokens in `src/components/site/`; a dark value goes in the dark token block or one
  `html[data-cos-theme='dark']` rule.
- MUST gate light-only tuning with `html:not([data-cos-theme='dark'])` so the dark theme does not change.
- MUST give every transition a `prefers-reduced-motion: reduce` rule.
- MUST mount animation through `ClayzoScene`; NEVER ship a poster image, video or screenshot in place of a scene.
- MUST keep one ThemeToggle on the page.
- NEVER use em dashes or the word "viral" in page copy; write "ContentOS" as one word.
- NEVER put a caption under an image or scene.
- NEVER add a z-index outside the layers in Elevation.
- SHOULD keep copy short and plain: one sentence per sub-line.

Known debt (recorded at detect time; not reviewed per PR):
- Light `--cos-ink-3` measures 3.73:1 on the ground, under AA for small text; used by `.cos-foot-title` and the footer
  base line at 13px. Proposed: `#6b6d77` (4.89:1, same hue).
- `.cos-mega-soon` and `.cos-mega-link[data-soon]` styles remain with no item using them.
- Durations and z-index values are literals, not tokens.

## Migration

| Kind | Old | New | Until | Status | Notes |
|---|---|---|---|---|---|
| token | `--cos-ink-3` | `--cos-ink-2` | | planned | for text under 14px in light mode, until ink-3 is darkened |

## Overrides

| Rule | Change | Scope | Reason | Owner | Date |
|---|---|---|---|---|---|

## Changelog

- 2026-11-10 · The mark is recoloured to Tropical (teal to sky blue over yellow to orange); its colours now live in `animations/lib/mark.ts`, applied everywhere by `animations/apply-mark.ts`.
- 2026-11-10 · `/pricing` rebuilt in the landing system: the word Pricing, then the $1,000 per account price with an account counter and what every account includes, from the live hosted page; no animation.
- 2026-11-10 · India is the only backdrop: the `?bg` switch and the painted-sky assets are removed; the Grok Bot page's two panels get paintings of their own (Ladakh, Hampi).
- 2026-11-10 · `/for/grok-bot`: integration page (hero scene, connect steps with CopyField, key scopes, closing band); experimental.
- 2026-11-09 · FAQ section (`ActFaq`, experimental) before the closing band; answers from the product handover only.
- 2026-11-09 · Seam onboarding: DESIGN.md rewritten for the new landing page (Mona Sans, painted sky, deep-ocean
  dark, Clayzo scenes); the earlier "Content Relay" direction is retired.
