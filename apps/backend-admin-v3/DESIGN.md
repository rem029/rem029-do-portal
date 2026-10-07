---
name: Doha Oasis Ops Admin
description: Payload-native operations admin for HR, F&B, compliance, and CRM, plus the white-label guest surfaces (forms, FnB ordering, site pages) it drives.
colors:
  canvas: "rgb(255, 255, 255)"
  surface-subtle: "rgb(245, 245, 245)"
  surface-hover: "rgb(235, 235, 235)"
  hairline: "rgb(221, 221, 221)"
  hairline-strong: "rgb(208, 208, 208)"
  text-muted: "rgb(154, 154, 154)"
  text-secondary: "rgb(128, 128, 128)"
  text-body: "rgb(47, 47, 47)"
  text-heading: "rgb(20, 20, 20)"
  ink: "rgb(0, 0, 0)"
  status-blue: "rgb(21, 135, 186)"
  status-amber: "rgb(185, 108, 13)"
  status-red: "rgb(218, 75, 72)"
  printemps-green: "#00d072"
  printemps-gold: "#e5b420"
  doha-oasis-gold: "#c7a965"
  oasis-green: "#072c1b"
  golden-sand: "#c8b46e"
  creamy-white: "#eae7dc"
  doha-quest-purple: "#520b75"
  doha-quest-amber: "#f2b02d"
  banyan-lululemon-black: "#000000"
  banyan-lululemon-white: "#ffffff"
typography:
  interface:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  guest-primary:
    fontFamily: "Poppins, sans-serif"
  guest-secondary:
    fontFamily: "Urbanist, sans-serif"
rounded:
  sm: "3px"
  md: "4px"
  lg: "8px"
components:
  button-chip:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-chip-hover:
    backgroundColor: "{colors.hairline-strong}"
  fnb-order-card:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "16px"
  fnb-action-button:
    textColor: "{colors.canvas}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Doha Oasis Ops Admin

## Overview

**Creative North Star: "The Quiet Operator"**

This is Payload's own admin, left almost entirely alone. There is no injected brand accent anywhere in the shell — no primary blue, no logo color bleeding into buttons or focus rings. Every panel, table, and form runs on Payload's native grayscale elevation scale and its three semantic status colors, because the actual users (HR admins, HACCP officers, CRM approvers, and — during a shift — waiter, kitchen, and cashier staff) are scanning dense operational data under time pressure, not evaluating a brand. Volume is earned, not default.

The one deliberate exception is the FnB order boards: real-time, floor-paced screens where a waiter, chef, or cashier needs to read table/status/action from across a kitchen pass or a service line. There, and only there, the system goes loud — thick black borders and hard offset shadows in a contained neubrutalist register — while still built entirely from Payload's own tokens, so it never breaks dark mode.

A second, separate register lives behind the same shell: the guest-facing public surfaces this admin drives (public Forms, FnB menu/ordering pages, and Site Pages). Those are intentionally white-label, but the two families get there through two different mechanisms — don't assume one covers the other. **Forms and Site Pages** are skinned per operator (Doha Oasis, Doha Quest, Printemps, Banyan Tree Lululemon) via daisyUI's `data-theme` mechanism (`use_custom_theme` / `theme` fields, confirmed in `site-pages/index.ts` and `forms/[slug]/_components/form-content.tsx`). **FnB menu pages do not use daisyUI theming at all** — each menu page has its own "Theme" fields (Primary / Primary Contrast / Background / Background Card / Text / Neutral color pickers, plus uploaded primary/secondary font files) in the Payload admin, rendered as inline `:root` CSS custom properties (`--primary-color` etc., see `fnb-menu.tsx`'s `css()` function) — set per page, not per operator, and with no `data-theme` attribute anywhere in the FnB menu code path. Confirmed by reading the running app: unconfigured demo pages (Vertigo, Planet Hollywood) render with the literal `black`/`white`/`gray` fallbacks, not Oasis Green, because neither page's Theme tab has been filled in — the mechanism is real, just page-level rather than operator-level. The admin stays quiet either way, so the operator's or the individual menu page's own look can be loud where guests actually see it.

**Key Characteristics:**
- No brand accent in the admin shell — grayscale elevation + status colors only, straight from Payload's defaults.
- Flat at rest; shadows are ambient and reserved for floating surfaces.
- One contained neubrutalist exception (FnB order boards) — bold, but scoped, and never a template for other urgent surfaces.
- Forms and Site Pages run a per-operator white-label theme system layered on daisyUI (`data-theme`). FnB menu pages run a separate, per-page color/font override system (Payload admin's menu-page "Theme" fields → CSS custom properties) that is not connected to daisyUI or to the operator at all.
- Trilingual guest content (English / Arabic / French); Tajawal exists specifically for Arabic.

## Colors

Two color systems coexist and should never be cross-applied: the admin's fixed, brandless grayscale + status palette, and the guest surfaces' per-operator brand palettes, which are a *selection*, not a fixed set — new operators add new theme blocks rather than reusing an existing operator's colors.

### Admin — Neutral (Payload's own elevation scale)
- **Canvas** (`rgb(255, 255, 255)`): base background for cards, inputs, and panels at rest.
- **Surface Subtle** (`rgb(245, 245, 245)`): the next step up — subtle fills, zebra rows, disabled backgrounds.
- **Surface Hover** (`rgb(235, 235, 235)`): hover fill for chips and low-emphasis buttons.
- **Hairline** (`rgb(221, 221, 221)`): the default 1px border on inputs, chips, and dropdown panels — the most-used border value in the codebase.
- **Hairline Strong** (`rgb(208, 208, 208)`): a firmer border, used on hover or for higher-emphasis containers.
- **Text Muted** (`rgb(154, 154, 154)`): placeholder text, disabled labels.
- **Text Secondary** (`rgb(128, 128, 128)`): captions, helper text, icon-adjacent labels.
- **Text Body** (`rgb(47, 47, 47)`): default reading text and control labels.
- **Text Heading** (`rgb(20, 20, 20)`): headings and high-emphasis titles.
- **Ink** (`rgb(0, 0, 0)`): reserved almost exclusively for the FnB board's neubrutalist borders/shadows — see Named Rule below.

Every one of these flips automatically in dark mode through Payload's own `--theme-elevation-*` custom properties (toggled by `html[data-theme="dark"]`, driven by Payload's own theme cookie — not the OS `prefers-color-scheme`). Reference the CSS variable, never a literal hex, so new panels stay correct in both themes without extra work.

### Admin — Status (Payload's own semantic scale)
- **Status Blue** (`rgb(21, 135, 186)`): success/confirmation state and the default focus ring. Reads as a muted blue-teal, not green — don't reach for `green-*` Tailwind utilities expecting to match it.
- **Status Amber** (`rgb(185, 108, 13)`): warning state.
- **Status Red** (`rgb(218, 75, 72)`): error/destructive state.

### Named Rules (Admin)
**The No-Accent Rule.** The admin shell has no primary brand color. If a new admin surface seems to need one, that's a signal to lean on Status Blue (Payload's own accent) or stay neutral — not to introduce a new hex value.

### Guest Surfaces — Per-Operator Themes (Forms, Site Pages)
These are real daisyUI themes (`@plugin "daisyui/theme"` blocks in `styles.css`), selected via daisyUI's own `data-theme` attribute on **Forms and Site Pages only** — not a parallel color system, and **not what FnB menu pages use** (see the next section). Each operator name below maps directly onto daisyUI's own semantic roles (`primary`, `secondary`, `base-100/200/300`, `base-content`, `accent`, `neutral`, `info/success/warning/error`); only the two brand-defining colors are named here, see the `.impeccable/design.json` sidecar for the complete per-theme token set including `base-*` and `*-content` pairs. All values below are verified against each operator's official brand guidelines, not inferred from code alone.
- **Printemps Green** (`#00d072`): the `printemps` theme's `primary`. Confirmed near-exact against Printemps's own co-branding accent (`#00CF77` per the Doha Oasis brand book) — the 2-point hex drift is negligible. **Printemps Gold** (`#e5b420`) is the theme's `secondary`; not independently confirmed against an official Printemps source.
- **Oasis Green** (`#072c1b`) / **Golden Sand** (`#c8b46e`): the current default `dohaoasis-new` theme's `primary`/`secondary` — these are the exact, official Doha Oasis primary palette names and hex values (`Doha Oasis - Brand Book 2025`, section 4.1), not project-invented names. The brand book's third primary color, **Creamy White** (`#eae7dc`), is also present in the theme as `--color-primary-content`. The legacy `dohaoasis` theme instead uses the older, slightly-off approximation `#c7a965` on a near-black secondary — kept live for pages that haven't migrated to the verified brand colors.
- **Doha Quest Purple** (`#520b75`) / **Doha Quest Amber** (`#f2b02d`): both the legacy `dohaquest` and current default `dohaquest-new` themes share this pair. Confirmed against Quest's own brand standards — Pantone 2607 / `C83 M100 Y21 K8` converts to essentially this same purple, and gold/amber sparkle accents run throughout every official Quest asset (logo, patterns, foiling). Quest's real logo is not monochrome purple, though — it's a five-color rainbow wordmark (green `q`, orange `u`, purple `e`, blue `s`, red `t`), so this single-purple theme is a simplification of the full mark, not a literal palette match.
- **Banyan x Lululemon Black** (`#000000`) / **Banyan x Lululemon White** (`#ffffff`): intentionally monochrome, and correct as-is — this theme was built for a one-time Banyan Tree × Lululemon collab form, not as the general Banyan Tree Doha brand identity. Banyan Tree Doha's own accent per the Doha Oasis brand book is `#85754E` (a warm taupe/gold); reach for that instead if a new, non-collab Banyan Tree page is ever needed, but don't "fix" this theme — the form it was built for is retired, and the theme is correct for what it was.

### Guest Surfaces — FnB Menu Pages (Per-Page Custom Theme)
FnB menu pages (`menu-pages` collection) are **not** daisyUI themes and carry no `data-theme` attribute. Each individual menu page has its own "Theme" field group (Payload admin → Pages → a page → Content tab → Theme): color pickers for `Primary`, `Primary Contrast`, `Background`, `Background Card`, `Text`, `Neutral`, plus `Font primary` / `Font secondary` file uploads (any font file, via the `menu-media` library — not a pick from the Poppins/Tajawal/Urbanist/Gilroy/Noah list below, which applies to Forms/Site Pages). `fnb-menu.tsx` writes these into inline `:root { --primary-color: ...; }` custom properties per page (see `_store/store.ts`'s `ROOT_KEYS` and `tailwind.config.cjs`'s `menu-*` color/font aliases), falling back to literal `black` / `white` / `gray` when a page's Theme fields are empty — which is what the seeded demo pages (Vertigo, Planet Hollywood) currently show. There's also a page-level Advanced tab (`className`, `css`, `js`) for further one-off overrides. This is a legitimate, working mechanism — page-level customization, not operator-level — just a different one from Forms/Site Pages; don't treat an unthemed FnB page's black/white default as a bug, and don't reach for the `theme`/`data-theme` field when the ask is about an FnB menu page's look.

### Named Rules (Guest)
**The Operator-Owns-The-Palette Rule (Forms, Site Pages).** A Form or Site Page's color is never hardcoded in a component — it's selected via the `theme` field (or, for a fully custom brand, `use_custom_theme` + pasted daisyUI theme CSS, parsed at render into a scoped `[data-theme="..."]` block). Redesigning one of these surfaces means adding or editing a theme block, not touching component code.

**The Page-Owns-The-Palette Rule (FnB menu).** An FnB menu page's color and font are never hardcoded in a component either, but they're also never inherited from an operator theme — they live on that page's own Theme fields (`c.primary`, `c.bg`, `c.font_primary`, etc.) and default to black/white/gray until someone fills them in. Changing an FnB menu page's look means editing that page's Theme fields (or the field defaults, for a project-wide change), not adding a daisyUI theme block.

**The daisyUI-First Rule.** Forms and Site Pages are genuine daisyUI theme objects, so their components should be built from daisyUI's own primitives (`btn`, `card`, `modal`, `badge`, `input`, `navbar`, `menu`, `alert`, etc.) to inherit `primary`/`secondary`/`base-*` automatically from whichever `data-theme` the page is in — Forms already does this correctly (`card bg-base-100 shadow-2xl border-base-200`, `text-error`). FnB menu pages have no `data-theme` to inherit from, but the same principle still applies at the component-shape level: build from daisyUI primitives and drive their color via the page's own `--primary-color`-style CSS variables (through Tailwind's `menu-*` aliases) rather than one-off `<div>`/`<button>` markup with bespoke class recipes. The FnB ordering flow (cart bar, table picker) is the deviation on this narrower point, see Components below.

## Typography

**Admin Interface Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` — Payload's own default system-font stack, unmodified by this project.

**Guest Primary Font:** Poppins (default) — the CSS-var fallback when a page hasn't uploaded its own.
**Guest Secondary Font:** Urbanist (default) — same fallback pattern.

**Character:** The admin borrows the OS's native UI font on purpose — it should read as an operating tool, not a marketed product. Guest surfaces are the opposite, and — like color — the mechanism differs by surface type. FnB menu pages and Site Pages each carry their own arbitrary uploaded font files (`Font primary`/`Font secondary`, via `menu-media`/media library, any font file — not a pick from a fixed list), converted to `@font-face` at render and applied through the same `--font-menu-primary`/`--page-font-primary`-style CSS vars as their colors; Poppins/Urbanist are just the default values those vars fall back to when nothing's uploaded. Named Tailwind classes `font-poppins`/`font-tajawal`/`font-urbanist`/`font-gilroy`/`font-noah` do exist in `tailwind.config.cjs`, but they're barely used in guest code (one admin report component is the only real hit) — treat the "available families" framing below as a documented brand-typeface reference for what a font upload *should* be, not as a dropdown guest pages actually choose from.

### Hierarchy
- **Admin:** follows Payload's own built-in type scale as-is; this project does not override it with custom display/headline sizes.
- **Guest — Primary** (`font-menu-primary` / `font-page-primary`): headings and primary CTAs on menu, form, and site pages.
- **Guest — Secondary** (`font-menu-secondary` / `font-page-secondary`): body copy and secondary labels.

### Verified Per-Operator Typefaces (from official brand books)
- **Doha Oasis:** headers set in **Noah** (all-caps, primary) with **Baskerville** used sparingly to accent single words within a headline; body text is **Poppins Extra Light** specifically (not a heavier default weight). Arabic headers use **Frutiger LT** + **Geeza Pro** (accent); Arabic body uses **Tajawal**. The uploadable font list already covers Noah and Poppins and Tajawal correctly — **Baskerville, Frutiger LT, and Geeza Pro are missing** from the available `fontFamily` set in `tailwind.config.cjs`, so a fully brand-accurate Doha Oasis header (with the accented word in a different face) can't be built with today's font options.
- **Doha Quest:** headlines in **Playfair Display Bold**, body in the **Futura** family, Arabic (headline and body) in **Tajawal**. None of Playfair Display or Futura are in the current uploadable font list either — Quest pages today fall back to the generic Poppins/Urbanist pairing rather than Quest's actual typefaces.

### Named Rules
**The Locale-Aware Type Rule.** The platform serves English, Arabic, and French guest content (`locale: 'en' | 'ar' | 'fr'`). Tajawal is the font offered specifically for Arabic; don't assume a Latin-only font pairing will hold up once a page's locale switches.

**The Verified-Font-Gap Rule.** Doha Oasis and Doha Quest each have official, documented typefaces beyond what's currently uploadable (Baskerville/Frutiger LT/Geeza Pro for Doha Oasis; Playfair Display/Futura for Doha Quest). Treat the current Poppins/Urbanist/Gilroy/Noah/Tajawal list as incomplete, not exhaustive — sourcing and adding the missing brand fonts is a legitimate fix, not scope creep, whenever an operator's page is being brought to full brand accuracy.

## Layout

**Admin:** inherits Payload's own responsive breakpoints (400 / 768 / 1024 / 1440px) and spacing rhythm (`--base`, derived from a 20px base unit over a 13px body size). New admin panels should build from Payload's `Gutter` component and existing table/list layouts rather than introducing a separate grid system.

**Guest surfaces:** built with Tailwind utility layout (flex/grid) directly in each page/block component; no separate grid token system. FnB ordering (the order board *and* the guest-facing table/cart flow) is explicitly responsive: guest ordering UI targets a `max-w-md` mobile-first single column (a QR scan is a phone), while the staff-facing order boards target a 1 → 2 → 3-column grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`) so more orders are scannable at once on a kitchen/service display.

## Elevation & Depth

Flat by default, everywhere, in both registers. Neither the admin nor the guest surfaces use shadows as a resting-state decoration — depth only appears on genuinely floating elements (dropdowns, slide-out panels, modals), and it's always a soft, diffuse, ambient shadow, e.g. `0 8px 32px rgba(0,0,0,0.14)` for dropdown panels, `-8px 0 32px rgba(0,0,0,0.12)` for a slide-out sidebar.

### Shadow Vocabulary
- **Ambient Overlay** (`box-shadow: 0 8px 32px rgba(0,0,0,0.14)`): dropdown menus, popover panels.
- **Ambient Drawer** (`box-shadow: -8px 0 32px rgba(0,0,0,0.12)`): slide-out sidebars (e.g. Forms Dashboard's filter drawer).
- **Neubrutalist Offset** (`box-shadow: 4px 4px 0px 0px var(--theme-elevation-1000)`, scaled down to `3px`/`1px` on buttons and their pressed state): the FnB order board's structural shadow — present at rest, not just on hover, and paired with a 2px solid `--theme-elevation-1000` border.

### Named Rules
**The FnB-Only Rule.** The neubrutalist hard-offset shadow and its thick ink-colored border are confirmed as scoped to the FnB order boards specifically. Do not extend this treatment to any other admin surface — including other "operate under time pressure" screens like HACCP compliance checks or live workflow queues — unless explicitly instructed. Those surfaces stay in the quiet ambient-shadow register even when the task is urgent.

## Shapes

**Admin:** Payload defines a semantic radius scale (`--style-radius-s: 3px`, `--style-radius-m: 4px`, `--style-radius-l: 8px`), but in practice most hand-written admin components reach for Tailwind's own `rounded` / `rounded-md` / `rounded-lg` utilities directly rather than the Payload variables — the visual result lands in the same small, soft-cornered range either way. Borders are hairline (1px) everywhere except the FnB board.

**Guest surfaces:** radius is theme-controlled, not fixed — daisyUI's `--radius-selector` / `--radius-field` / `--radius-box` vary per operator theme (e.g. `dohaoasis-new` runs chunkier at up to `1rem`; `dohaquest-new` stays tighter at `0.5rem`). A redesign that wants sharper or softer corners changes the theme block, not a shared CSS file.

## Components

### Buttons
- **Admin action chip** (e.g. dashboard toolbar exports/resets): **Shape:** `rounded` (4px). **Color:** Hairline background (`rgb(221,221,221)`) → Hairline Strong on hover, Text Body label, no fill beyond the neutral scale. **Border:** 1px Hairline Strong.
- **Admin native buttons:** rendered via Payload's own `Button` component (`@payloadcms/ui`) wherever the interaction is standard (save, generate, seed) — don't hand-roll a button when Payload already ships the primitive.
- **FnB action button** (Confirm / Start Preparing / Mark Served / Mark Complete): **Shape:** `rounded` (4px), 2px Ink border, `3px 3px 0px 0px` Ink offset shadow, compressing to `1px 1px` with a matching translate on `:active` for a tactile press. **Color:** currently uses hardcoded Tailwind `bg-green-600`/`bg-red-600` for confirm/danger actions — see Do's and Don'ts; this is a known deviation from the token-first pattern, not a rule to copy elsewhere.

### Cards / Containers
- **Admin overlay panels** (dropdowns, slide-out drawers): **Corner Style:** `rounded-lg` (8px). **Background:** Canvas. **Border:** 1px Hairline Strong. **Shadow:** Ambient Overlay / Ambient Drawer (see Elevation & Depth).
- **FnB order card (signature component):** **Corner Style:** `rounded-lg` (8px). **Background:** Surface Subtle. **Border:** 2px Ink. **Shadow:** Neubrutalist Offset. **Internal Padding:** 16px. Status is shown via Payload's native `Pill` component (`pillStyle`, which already flips correctly with the admin theme toggle) wrapped in a matching thick-border/hard-shadow badge treatment — never a hardcoded pastel `bg-amber-100`-style badge.

### Inputs / Fields
- **Admin:** 1px Hairline border, `rounded-md` (4px), Canvas background, Text Body value color, no fill change until focus; focus ring uses Payload's Status Blue.

### Navigation
- **Admin:** left/side navigation and top toolbars follow Payload's own chrome; this project has not introduced a custom nav component.

### Guest — Order Tracking (signature guest component)
A fixed-bottom cart bar drives the guest ordering flow: add items → cart bar surfaces total + an "Order" CTA → a table picker modal (only if the QR code didn't already carry the table) → order confirmation, then a live status tracker (SSE-driven) through pending → confirmed → preparing → prepared ("Ready to serve") → served → completed. All colors and fonts here come from that specific menu page's own Theme fields (`--primary-color` etc., see Guest Surfaces — FnB Menu Pages above) — not from an operator daisyUI theme, and not from a fixed palette.

**Current implementation is a deviation, not the target — but only on markup, not on theming.** The cart bar and table picker are hand-rolled today — plain `<div>`/`<button>` elements with the `bg-menu-primary`/`text-menu-primary-contrast` Tailwind aliases and one-off border/padding recipes — instead of daisyUI's own `btn`/`btn-primary`, `card`, and `modal` classes, unlike public Forms which already does this correctly. Rebuild or touch this flow using daisyUI primitives (`<dialog class="modal">` for the table picker, `btn` for the order CTA, `badge` for the status tracker steps), styled through the page's existing `--primary-color`/`--background-color` CSS-var layer (there is no `data-theme` for FnB menu pages to inherit from instead — see above).

## Do's and Don'ts

### Do:
- **Do** reference Payload's `--theme-elevation-*` / `--theme-success/warning/error-*` custom properties for any new admin UI, never a hardcoded hex or a Tailwind gray/green/red utility — this is what keeps panels correct in both light and dark mode automatically.
- **Do** use Payload's native `Button` and `Pill` components for standard admin actions and status display before reaching for a hand-rolled equivalent.
- **Do** keep new admin surfaces in the quiet register (1px hairline borders, `rounded`/`rounded-md` corners, ambient shadows only on floating elements) even when the surface itself is time-critical.
- **Do** theme new or edited Forms/Site Pages through the existing `theme` field / operator theme blocks, using operator-based names for any new palette (matching Printemps, Doha Oasis, Doha Quest, Banyan Tree Lululemon). **Do** theme new or edited FnB menu pages through that page's own Theme fields (Primary/Background/Text/Neutral color pickers, Font primary/secondary uploads) instead — there is no operator theme block for FnB menu.
- **Do** account for Arabic (and French) when touching guest-facing typography or layout — Tajawal exists specifically for RTL/Arabic content.
- **Do** build guest-facing UI from daisyUI's own component classes (`btn`, `card`, `modal`, `badge`, `input`, `navbar`, `menu`, `alert`) first, the way public Forms already does (`card bg-base-100 shadow-2xl border-base-200`) — they inherit the active `data-theme` automatically. Reach for custom CSS/CSS-var aliases only for what daisyUI has no primitive for.
- **Do** treat each operator's official brand book as the source of truth over what's currently coded when a guest surface is being brought to full accuracy — the Doha Oasis and Doha Quest theme colors are already verified against their 2025/2021 brand books, but neither theme's font list includes every official typeface yet (see Typography).

### Don't:
- **Don't** reuse the FnB order board's neubrutalist hard-offset shadow or thick ink border on any other admin surface unless explicitly instructed, even for other fast-paced "operate under pressure" screens.
- **Don't** introduce a primary brand accent into the admin shell — it intentionally has none beyond Payload's own neutral + status defaults.
- **Don't** hardcode Tailwind palette colors (`bg-green-600`, `bg-red-600`, etc.) for status/action UI where a Payload `--theme-success/warning/error` token already exists; the FnB action buttons currently do this and should be treated as a fix target, not a precedent.
- **Don't** hardcode a guest-facing color, font, or radius into a shared component — Forms/Site Pages are theme-driven and operator-owned (edit a theme block); FnB menu pages are theme-driven and page-owned (edit that page's Theme fields).
- **Don't** hand-roll a guest-facing button, card, or modal with one-off Tailwind + CSS-var recipes when daisyUI already ships the primitive — the FnB cart bar and table picker currently do this and are a fix target for markup/structure, not for their underlying per-page CSS-var color mechanism, which is correct as-is.
- **Don't** reuse the `banyan-tree-lululemon` theme's black/white palette for a general Banyan Tree Doha page — it was built for a one-time, now-retired collab form; a plain Banyan Tree Doha page should use the operator's actual accent, `#85754E` (a warm taupe/gold).
