---
target: F&B guest menu ordering (mosavali)
total_score: 19
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-08-17T09-44-49Z
slug: src-app-frontend-fnb-menu
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Order-placed confirmation is unreachable dead code |
| 2 | Match Between System and Real World | 3/4 | "Table Table 3" concatenation bug |
| 3 | User Control and Freedom | 2/4 | Table-picker modal force-opens before any user intent |
| 4 | Consistency and Standards | 2/4 | Ordering flow diverges from platform's own daisyUI-first standard |
| 5 | Error Prevention | 2/4 | "Cancel order" fires on one tap, no confirmation |
| 6 | Recognition Rather Than Recall | 3/4 | No persistent "you're at Table 3" reminder after selection |
| 7 | Flexibility and Efficiency | 1/4 | No cart-level quantity editing |
| 8 | Aesthetic and Minimalist Design | 2/4 | Real photography undercut by 8px functional text |
| 9 | Error Recovery | 2/4 | Raw error text, hardcoded red, no retry |
| 10 | Help and Documentation | n/a | Guest QR-ordering surface |
| **Total** | | **19/36 (53%)** | **Acceptable** |

## Design Specificity Verdict
Split: content layer (photography, theme, logo) is authored for Mosavali; interaction layer (cart bar, quantity stepper, table picker, tracker) is hand-rolled Tailwind with hardcoded red-* colors ignoring the operator theme -- DESIGN.md already names this flow a known deviation from the daisyUI-first standard. Static CLI detector reported 0 findings (coverage gap); browser overlay caught undersized-ui-text firing 90+ times and a skipped-heading violation (h1 to h6).

## Priority Issues

[P0] Order-placed confirmation can never render -- cart-bar.tsx clears cart synchronously on success, unmounting the component (and its success message) via its own lines.length===0 guard before it can paint. Suggested: /impeccable harden

[P1] Table picker force-opens before any user intent -- opens automatically on mount whenever ordering is enabled and no table is set. Suggested: /impeccable clarify

[P1] 20x20px add/remove buttons and 8px functional text -- fails 44x44pt touch target minimum; allergen safety info illegible. Confirmed by detector overlay across every card. Suggested: /impeccable harden

[P2] "Table Table 3 . Order placed" copy bug in order-tracker.tsx. Suggested: /impeccable polish

[P2] Ordering UI hardcodes red-* instead of theme tokens, ignoring DESIGN.md's own documented daisyUI-first standard. Suggested: /impeccable adapt

## Persona Red Flags
Casey (mobile): mis-tap risk on 20px buttons, forced modal interrupts browsing, no confirmation visible if she app-switches after ordering.
Riley (stress test): stale cart renders QAR 0 silently; "Cancel order" has no confirmation, one mis-tap cancels a real order.
Jordan (first-timer): forced modal with no explanation, illegible allergen info, no way to confirm which table was picked.

## Minor Observations
Heading hierarchy skip (h1 to h6, detector-only catch). Carousel-dot category nav (~15 dots) unfamiliar vs conventional scroll-tabs. Modal close button low-contrast over photo content. Desktop leaves max-w-md column in unstyled void. Native <dialog> gives free Escape-dismiss, worth keeping.

## Questions to Consider
If "Order placed!" has been silently broken since it was written, what else in this flow has never been seen render by a human? Is the table picker meant to gate browsing or to be a checkout step? Is the fix a patch or the documented daisyUI rebuild?
