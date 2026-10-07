---
target: fnb-menu-events admin create/edit form
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-09T06-03-31Z
slug: v3-src-collections-public-fnb-menu-events-index-ts
---
# /impeccable critique — fnb-menu-events admin form

Method: single-context (degraded — sub-agents disproportionate for a CMS field-config critique; detector N/A for .ts config)
Mode: Operate
Target: apps/backend-admin-v3/src/collections/public/fnb-menu-events/index.ts

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Save confirms + live-preview; post-save selects flash empty; slug collisions only surface on submit |
| 2 | Match System / Real World | 2 | "Handlers", "Operator Slug", "Label"; slug help says "menu page" on an event |
| 3 | User Control and Freedom | 3 | Payload Save Draft / Publish / Versions / drawer pickers — standard |
| 4 | Consistency and Standards | 3 | Follows Payload + repo FnB collections; reused slug component copy mismatch |
| 5 | Error Prevention | 2 | Good defaults; but 2nd event per restaurant auto-fills a colliding slug, errors only on save |
| 6 | Recognition Rather Than Recall | 3 | Most fields have descriptions; Theme-expanded buries the important ones |
| 7 | Flexibility and Efficiency | 3 | "Show layout builder" power path, live preview — fine for audience |
| 8 | Aesthetic and Minimalist Design | 2 | ~20-field Content wall; Theme (8 font/color fields) expanded at top |
| 9 | Error Recovery | 2 | Slug-collision message decent; rest is generic Payload validation |
| 10 | Help and Documentation | 3 | Nearly every field has a description; some wrong or verbose |
| Total | | 26/40 | Acceptable |

## Design Specificity Verdict
Category-interchangeable, largely acceptable for a Payload admin form (PRODUCT.md: stay in Payload's shell). But the product character — a guest-facing menu a manager publishes — is absent from the language and field order (branding theme before content).

## What's Working
- Friendly-field -> compiled-layout (Header/Filter/Items groups instead of raw block builder) with a "Show layout builder" escape hatch.
- Inline descriptions on almost every field.
- Smart defaults (ordering on, handler default, slug auto-derived, filters on).

## Priority Issues
- [P1] Theme collapsible expanded by default -> 8 rarely-touched font/color fields bury Menus/Handlers/Header. Fix: admin.initCollapsed: true.
- [P1] 2nd event for a restaurant auto-fills a colliding slug, no warning until Save throws. Fix: slug description warns upfront; auto-fill should suffix on likely collision.
- [P2] "Handlers" is jargon + 3-sentence description. Fix: label -> "Who runs the orders?", one-sentence description.
- [P2] Slug field says "the URL for this menu page" on an event (hardcoded in shared MenuPageSlug component; field description ignored). Fix: component reads a description/entityNoun clientProp, default unchanged for menu-pages.
- [P2] "Label" in Page Header group is vague. Fix: override label -> "Header title".

## Persona Red Flags
Jordan (non-technical manager, the target user): first fields are font uploads + hex pickers; "Handlers"/"Operator Slug" unexplained; 2nd-event slug collision error is opaque; no URL preview on create.
Riley (stress-tester): "Show layout builder" on + no blocks -> empty layout renders empty column; unchecking "Enable Table Ordering" gives a view-only page with no warning (description still says "show the cart").

## Minor Observations
- "Operator Slug" readonly gibberish string; repo-wide convention, leave it, tweak description.
- Post-save Operator/Restaurant selects render empty until reload (Payload quirk).
- "Show Search"/"Show Allergen Filters" don't strongly read as children of the filter toggle.

## Questions to Consider
- Should Theme live on the event form at all, or inherit from the restaurant's menu page with an override?
- Does a manager ever need the Advance tab, or could "Show layout builder" be one toggle on Content?
