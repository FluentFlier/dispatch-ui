# Agent guide

## Marketing site (landing page)

The landing page (`src/components/site/`, its Clayzo scenes in `animations/` and `public/scene/`, brand files in
`public/brand/`) has its own design system, written down in `DESIGN.md`: the `--cos-*` tokens in
`src/components/site/site.css`, Mona Sans and Geist, the metal and silver buttons, `ClayzoScene` for every animation,
and a signed-off dark theme that light-mode changes must not alter. Use that system there, not the app's
`src/components/ui/` components listed below, which belong to the product app.

<!-- seam:design-system:start -->
## Seam design system

UI here follows a design system. Before writing UI, read `DESIGN.md` (intent, variants, states, do's and don'ts)
and `.seam/design-index.json` (every token, component, variant and file path).

Components (`src/components/ui/`): `Button`, `Card`, `StatusBadge`, `CopyButton`, `Badge`, `Skeleton`, `Tabs`, `PillarMultiSelect`, `LinkPreview`, `PillarBadge`, `ToastProvider`, `Toggle`, `CharCount`, `Drawer`, +9 more.
Tokens: `tailwind.config.ts` and `src/app/globals.css`, e.g. `--accent`, `--bg-primary`, `--bg-secondary`, `--bg-tertiary` (`bg-accent`).

Before adding UI, in this order, stop at the first that fits:
1. **Reuse** an existing component. Props for behaviour, `className` for layout only.
2. **Add a variant** to an existing component (same element and behaviour, different look or size): extend its
   variant map. Only if 2+ places need it; a one-off stays a className at the call site.
3. **Create a new component** in `src/components/ui/` only for new behaviour, ARIA role or keyboard model. It ships with:
   every state that applies (hover, focus-visible, active, disabled, loading, empty, error); variants with defaults;
   `className` passthrough; a `DESIGN.md` › Components entry and Changelog line; and an updated
   `.seam/design-index.json` (regenerate it, don't hand-edit).

Tokens, never raw values: no hex / rgb / oklch literals, no palette classes (`bg-blue-500`), no arbitrary values (`p-[13px]`).
If a value has no token, ask, or propose one in DESIGN.md; don't inline it.
Known duplicates, use the system instead: `StatusBadge` (src/components/StatusBadge.tsx) → `<StatusBadge>`; `AdminStatCard` (src/components/admin/AdminStatCard.tsx) → `<Card>`; `FlagToggle` (src/components/admin/FlagToggle.tsx) → `<Toggle>`.

Self-check before finishing: no raw values in your diff; every interactive element has hover, focus-visible and
disabled; every async or list view has loading, empty and error; new components are in DESIGN.md and the index.
<!-- seam:design-system:end -->
