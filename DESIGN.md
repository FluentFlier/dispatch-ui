---
name: Content OS
description: A kinetic content relay that turns founder knowledge into published work and warm conversations.
colors:
  canvas: "oklch(99.2% 0.002 85)"
  canvas-soft: "oklch(97.5% 0.004 85)"
  bright-surface: "oklch(100% 0 0)"
  ink: "oklch(18% 0.012 55)"
  ink-soft: "oklch(43% 0.014 65)"
  ink-muted: "oklch(49% 0.014 65)"
  construction-line: "oklch(18% 0.012 55 / 0.11)"
  cobalt: "oklch(57% 0.24 260)"
  cobalt-dark: "oklch(47% 0.22 260)"
  vermilion: "oklch(62% 0.20 35)"
  relay-lime: "oklch(84% 0.20 125)"
  conversation-lilac: "oklch(76% 0.12 305)"
typography:
  display:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 7.8vw, 7rem)"
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.065em"
  poster-headline:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.7rem, 8.5vw, 9.5rem)"
    fontWeight: 700
    lineHeight: 0.88
    letterSpacing: "-0.05em"
  title:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  chip: "8px"
  control: "10px"
  compact-card: "14px"
  surface: "18px"
  poster: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section-mobile: "96px"
  section-desktop: "128px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "48px"
  navigation-wordmark:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    height: "72px"
  product-proof:
    backgroundColor: "{colors.bright-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.poster}"
    width: "1120px"
  poster-card:
    backgroundColor: "{colors.bright-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "20px"
  signal-card:
    backgroundColor: "{colors.conversation-lilac}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: Content OS

## 1. Overview

**Creative North Star: "The Content Relay"**

Content OS is experienced by a founder planning the week on a bright monitor, moving quickly between ideas, publishing, replies, and warm relationships. The interface should feel like a crafted creative instrument that is already in motion: precise product evidence sits inside an illustrated world of handoffs, routes, operating panels, and a paper airplane that represents shipped work.

The landing page uses a Full Palette strategy with strict semantic roles. It opens on a compact white stage with the illustrated relay, a two-line promise, one action, and an illustrated command center. Three kinetic poster scenes then make voice, distribution, and leads feel materially different without breaking the shared visual language. Motion rewards scrolling, but no transition carries information that is absent from the resting composition.

**Key Characteristics:**
- A compact first viewport with illustration, promise, CTA, and product proof.
- The lowercase `content os.` wordmark with a cobalt period and paper-airplane favicon.
- An illustrated command center that shows signals, drafts, Voice QA, scheduled content, replies, Creator Brain learning, and warm conversations.
- Three distinct poster scenes: vermilion voice, cobalt distribution, and ink-black leads.
- Sentence-case display typography with heavy scale, tight tracking, and no generic all-caps poster voice.
- Hard construction outlines and offset shadows paired with one soft product shadow.
- Desktop choreography that reduces to stable, simplified mobile compositions.

## 2. Colors

The palette is energetic and operational. Every saturated color names a stage in the loop; neutral space keeps the full palette legible.

### Primary
- **Signal Cobalt:** Carries the hero highlight, focus rings, publishing surfaces, scheduled states, and the paper airplane's primary wing.

### Secondary
- **Route Vermilion:** Represents the incoming idea, source material, active voice scene, and the signal being handed through the system.

### Tertiary
- **Relay Lime:** Marks creation, Voice QA success, Creator Brain learning, and kinetic connector energy.
- **Conversation Lilac:** Marks replies, warm contacts, researched context, and conversation outcomes.

### Neutral
- **Studio Canvas:** The dominant warm near-white stage.
- **Soft Canvas:** Secondary neutral panels and quiet separation.
- **Bright Product Surface:** High-clarity product UI and poster-card interiors.
- **Soft Ink:** Primary type, outlines, controls, and the leads poster field.
- **Muted Ink:** Supporting copy and metadata at AA-compliant sizes.
- **Construction Line:** Hairlines, dividers, and quiet borders.

### Named Rules
**The Color Has a Job Rule.** Cobalt publishes, vermilion signals, lime learns, and lilac converses. Never scatter these colors as decoration.

**The White Stage Rule.** The hero and distribution scene preserve enough neutral space for the characters and product proof to remain readable.

**The Ink Field Exception.** Full-bleed Soft Ink is reserved for the leads poster and footer contrast moments. It is not a default dark theme.

## 3. Typography

**Display Font:** Hanken Grotesk (with system-ui fallback)  
**Body Font:** Hanken Grotesk (with system-ui fallback)

**Character:** One warm grotesk unifies marketing copy, illustrated labels, and product UI. Personality comes from decisive scale, tight optical spacing, sentence case, and hard contrast rather than decorative font pairing.

### Hierarchy
- **Display** (700, `clamp(3.25rem, 7.8vw, 7rem)`, 0.88): The two-line hero promise only.
- **Poster Headline** (700, `clamp(2.7rem, 8.5vw, 9.5rem)`, 0.85 to 0.9): Large sentence-case statements in the three kinetic sections.
- **Title** (700, `1.25rem`, 1.15): Product panels, footer mark, and strong interface labels.
- **Body** (400 to 500, `1rem`, 1.75): Founder-direct explanation, capped near 65ch and usually narrower.
- **Label** (600, `0.75rem`, 0.02em tracking): Workflow states, calendar metadata, and compact system labels in sentence case.

### Named Rules
**The Sentence-Case Rule.** Headlines and interface labels use natural capitalization. All-caps is forbidden outside unavoidable platform or acronym names.

**The One Voice Rule.** Hanken Grotesk carries both brand and product. Do not add serif or monospace type to manufacture personality.

**The Tight-at-Scale Rule.** Tracking becomes more negative as headlines grow, but body copy remains normally spaced and readable.

## 4. Elevation

The system uses two distinct depth languages. The hero command center receives a soft, physically plausible product shadow. Illustrated panels use crisp offset shadows that behave like printed pieces lifted from the page. Flat surfaces remain flat when neither treatment communicates hierarchy.

### Shadow Vocabulary
- **Command Center Lift** (`0 48px 96px -34px rgb(24 22 20 / 0.42), 0 18px 38px -24px rgb(24 22 20 / 0.26)`): The desktop hero product proof only.
- **Poster Offset** (`14px 16px 0 oklch(18% 0.012 55)`): Large illustrated product panels on light or colored fields.
- **Compact Offset** (`7px 8px 0 oklch(18% 0.012 55)`): Distribution outputs and small evidence cards.
- **Inverse Offset** (`8px 9px 0 oklch(99.2% 0.002 85)`): Signal cards on the dark leads field.

### Named Rules
**The Two Shadow Languages Rule.** Software floats softly; illustrated evidence lifts with a hard offset. Never combine both treatments on one object.

**The Flat-Until-Lifted Rule.** Shadows identify the dominant proof or a physically lifted poster piece. They are never ambient fog.

## 5. Components

### Buttons
- **Shape:** Compact squared controls with gently rounded corners (10px), never default pills.
- **Primary:** Soft Ink fill, Studio Canvas text, 48px minimum height, and 14px by 22px internal spacing.
- **Hover / Focus:** Translate upward by at most 1px. Use a visible 3px cobalt focus ring with a 3px canvas offset.
- **Secondary:** Bright Product Surface with one Construction Line border. No glass or decorative blur.

### Chips
- **Style:** Compact 8px corners, short sentence-case labels, and explicit status meaning.
- **State:** Selected or successful states include a non-color cue such as an icon, check, or border.

### Cards / Containers
- **Corner Style:** 14px for compact evidence, 18px for poster cards, and 22px for the hero command center.
- **Background:** Use Bright Product Surface, Relay Lime, Conversation Lilac, or Signal Cobalt according to workflow meaning.
- **Shadow Strategy:** Choose exactly one shadow language from Elevation.
- **Border:** Poster pieces use 3px Soft Ink construction outlines. Product UI uses one quiet Construction Line.
- **Internal Padding:** 16px to 24px.

### Inputs / Fields
- **Style:** Bright Product Surface, one Construction Line, 10px corners, and at least 48px height.
- **Focus:** Cobalt border plus a 3px external cobalt ring.
- **Error / Disabled:** Pair state color with an icon and specific text. Disabled content remains legible.

### Navigation
- The desktop navigation is 72px tall and sparse. The lowercase `content os.` wordmark anchors the left; its period is cobalt. Product, The loop, Pricing, and Sign in remain quieter than the trial action.
- Mobile uses a 44px menu control and an inline expanding panel, never a modal.
- The paper airplane is the favicon and compact brand mark. Do not put it inside a generated square tile when used on a surface.

### Content Relay Illustration
The hero cast is a static raster illustration. Poses, dashed paths, the machine, and paper airplane communicate motion without requiring animation. It remains subordinate to the headline.

### Illustrated Command Center
The 16:9 command center is direct product proof, not a generic analytics dashboard. It shows the operating relay and concrete values: signals, drafts, Voice QA, scheduled posts, replies, Creator Brain learning, and warm conversations. On desktop it rises, scales, settles, then exits symmetrically with scroll using damped springs. It carries the Command Center Lift and disappears below the 768px breakpoint.

### Kinetic Poster Sections
- **Voice:** A vermilion field with Creator Brain, Voice QA, an oversized composer, and one character. The right-side composition grows and spreads vertically on desktop.
- **Distribution:** A neutral stage dominated by a rotated cobalt calendar, one source, and separate LinkedIn and X outputs connected by flowing routes.
- **Leads:** A Soft Ink field with lilac and lime signal cards connected by curved dashed routes. Mobile replaces the desktop route map with two stacked groups and one vertical squiggle.
- Characters disappear below 768px. Headline sizes clamp down and diagrams become width-safe, deliberate vertical compositions.

### Motion and Cursor
Use the shared exponential ease `cubic-bezier(0.16, 1, 0.3, 1)` for reveals. Scroll-linked movement animates transforms and opacity only. Kinetic connectors use a 1.15-second linear dash flow. The smooth custom cursor is desktop-only. Reduced motion disables connector flow, cursor choreography, hover lifts, and scroll transforms.

### Footer Mark
`content os.` is assembled from compact outlined letter pieces using the relay palette. Each letter may lift independently on hover; the period remains still and optically separated.

## 6. Do's and Don'ts

### Do:
- **Do** make the entire loop visible through real states and handoffs.
- **Do** use one dominant visual idea per viewport.
- **Do** let the illustrated command center prove product depth before feature explanation.
- **Do** assign every saturated color its documented workflow role.
- **Do** use sentence-case headlines with Hanken Grotesk, bold weight, and tight tracking.
- **Do** vary composition across voice, distribution, and leads.
- **Do** remove characters and the large dashboard on narrow screens when they compete with understanding.
- **Do** preserve WCAG 2.2 AA contrast, semantic landmarks, 44px touch targets, keyboard focus, and complete reduced-motion states.

### Don't:
- **Don't** resemble generic AI SaaS marketing, a Linear clone, a caption generator, or a writer's portfolio.
- **Don't** use blue or purple gradient atmospheres, floating glow orbs, decorative glass-card grids, vague automation claims, dense enterprise martech language, or fabricated social proof.
- **Don't** use a generic analytics dashboard, traffic chart, or interchangeable stat-card row as product proof.
- **Don't** repeat identical feature-card grids or give every section the same background and structure.
- **Don't** copy Notion's illustration style, monochrome identity, page structure, or components.
- **Don't** use beige graph paper, long empty MacBook scrolls, sparse edge sketches, typewriters, pens, or loose manuscript pages.
- **Don't** use gradient text, side-stripe accents, nested cards, or decorative glassmorphism.
- **Don't** make every headline uppercase.
- **Don't** use pure black as Soft Ink or introduce unassigned accent colors.
