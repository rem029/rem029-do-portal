# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are internal staff running Doha Oasis's on-site businesses (and sibling operator entities such as Printemps) day to day: HR/ops admins processing employee workflows and letters; F&B floor staff (waiter, kitchen/chef, cashier) tracking table orders in real time; HACCP/food-safety compliance officers; and CRM/forms approvers routing internal requests. Guests touch only narrow, account-less public surfaces embedded in this same app — QR-code-based F&B table ordering and public forms (waivers, surveys) — with no login and no staff-facing data exposed to them.

## Product Purpose

A multi-tenant internal operations backend for Doha Oasis's group of on-site businesses (restaurants/F&B outlets, retail tenants like Printemps, and other operator entities). It runs HR administration (letters, disciplinary actions, salary deductions, workflow approvals), real-time F&B order tracking (guest order → waiter confirm → kitchen prepare → waiter serve → cashier complete), HACCP food-safety compliance tracking, CRM case routing, and a forms/workflow builder used across departments. Success means staff can carry out their day-to-day operational tasks — HR approvals, food orders, compliance checks, guest form intake — inside one system, correctly scoped to the operator/restaurant/department that owns the data.

## Positioning

Bespoke internal tooling for this specific operator group, not a market product. Its distinguishing move is unifying several previously separate operational needs — HR, F&B operations, compliance, CRM/forms — behind one multi-tenant admin, scoped per operator (Doha Oasis, Doha Quest, Printemps, and others) so each business unit only ever sees its own data.

## Operating Context

- Multi-tenant via `operators` → `restaurants` / `departments` / `outlets`; most collections scope access by operator and, for F&B, by restaurant.
- The F&B order lifecycle runs live across three staff roles (waiter, kitchen, cashier), each locked server-side to only the status transitions it owns; guests place and track orders from a QR code at their table. In-progress work: adding table + seat number to that QR flow, and reusing the same restaurant/menu-page/ordering system for disposable, time-boxed events (no cashier role needed there).
- HR workflows (letters, disciplinary actions, salary deductions, recruitment, end of service) run through a configurable approval workflow engine (Workflow / Workflow V2).
- HACCP compliance (personal hygiene, dry-store) and CRM case routing are newer modules layered onto the same admin.
- Public-but-scoped surfaces embedded in this app: guest F&B ordering pages, waiver/survey forms, link-shortener redirects — all reachable without a login.
- The admin runs inside Payload CMS's own admin UI, not a fully custom shell; new admin surfaces are expected to stay inside that shell (see the Forms Dashboard and Waiter/Kitchen/Cashier panel globals as the established pattern).

## Capabilities and Constraints

- UI is built with daisyUI (Tailwind component library) plus custom/handwritten CSS layered on top wherever daisyUI doesn't already cover the need — new UI work should default to daisyUI components first, then customize with CSS rather than hand-rolling components daisyUI already provides.
- Payload's own admin theme (light/dark via `--theme-*` CSS custom properties, toggled by Payload's own theme cookie, not just OS `prefers-color-scheme`) governs the admin shell; custom panels built inside Payload admin (e.g. the FnB order boards) key off those same tokens to stay dark-mode-correct.
- Every collection follows a fixed architecture: `operator` + `operator_slug` fields for multi-tenancy, `CreatedByField`/`UpdatedByField`, `accessCheckResolver`-based access control, and standard audit-log hooks (exact required field/hook set is documented in this app's CLAUDE.md).
- Schema changes require paired, idempotent Payload migrations alongside regenerated types; there is no "just push schema" path in production.

## Brand Commitments

"Doha Oasis" (parent operator/venue), "Doha Quest" (entertainment/F&B venue name), and "Printemps" (retail tenant) are established names and logos — fixed identity, not open for redesign. Existing brand assets live in `apps/frontend/public/assets` (e.g. `logo.png`, `printemps-logo-text.png`, `printemps-club-logo.png`).

## Evidence on Hand

This is internal tooling, not a marketed product — no testimonials, pricing, or competitive benchmarks apply, and none should be fabricated. Real operator/restaurant demo data already exists: operators Doha Oasis, Doha Quest, Printemps; restaurants Planet Hollywood, Vertigo, Cova, Twiga (see `src/seed/fnb-menu.ts`, `src/seed/fnb-order-system.ts`).

## Product Principles

1. Scope everything to the operator (and, where relevant, restaurant/department) that owns it — never leak one tenant's data into another's view.
2. Every status/role transition that matters operationally (order lifecycle, workflow approvals) is enforced server-side, not just hidden in the UI.
3. Stay inside Payload's own admin shell and its access-control/hook conventions rather than building a parallel custom app for internal surfaces.
4. Guest-facing surfaces (F&B ordering, forms) must work without an account and must never leak internal/staff data to an unauthenticated guest.
5. Prefer daisyUI's existing components over new custom ones; reach for custom CSS only where daisyUI doesn't already cover the need.

## Accessibility & Inclusion

No formal accessibility standard is currently mandated for this project; future work should still follow reasonable default practice (semantic HTML, keyboard operability, sufficient contrast) absent a specific requirement.
