# Security Audit — Server Actions & API Endpoints

**Date:** 2026-09-16
**Scope:** `apps/backend-admin-v3` — Next.js Server Actions (`'use server'`), custom Payload endpoints, and the Microsoft OAuth / Exchange integration.
**Status:** Read-only audit. No fixes applied yet. Findings are ordered by severity; each includes exploit scenario and suggested fix.

Key premise throughout: a Next.js Server Action is a public HTTP endpoint regardless of whether the page that references it requires login. Page-level auth in the admin UI does **not** protect the action itself — each action must do its own check.

---

## Critical — reachable with zero authentication today

### 1. Open email relay — public e-recognition page
**File:** `src/collections/public/e-recognition/components/actions.ts` — `sendEmailAction` (lines 70-132)
No auth check. `to`, `subject`, `html` come straight from the client and are passed to `payload.sendEmail(...)`.
**Exploit:** Anyone on the public e-recognition page can send arbitrary HTML email, from the org's configured sender, to any address — phishing/spam using the company domain's reputation.
**Fix:** Require an authenticated session (or at minimum a fixed, server-built template with a whitelisted recipient set derived from the DB, never client-supplied `html`/`to`).

### 2. Unauthenticated employee data dump — same page
**File:** `src/collections/public/e-recognition/components/actions.ts` — `fetchEmployeesAction` (lines 25-32)
Calls `findAllEmployees()` with no params, no auth.
**Exploit:** Any visitor to the public e-recognition page gets the full H2A/Oasys employee roster.
**Fix:** Require session + scope to fields actually needed for the recognition UI (e.g. name only, not full employee record).

### 3. Unrestricted anonymous file upload (x2)
- `src/collections/public/e-recognition/components/actions.ts` — `postMediaAction` (34-68): accepts any base64 payload, force-labels it `image/png` without validating actual bytes, no size cap, no auth.
- `src/app/(frontend)/forms/_components/form-renderer/actions.ts` — `uploadFileAction` (139-181): no auth, no MIME/size validation, arbitrary filename, writes to `forms-media`.
**Exploit:** Anonymous visitors can use app storage/bandwidth to host arbitrary files (malware, phishing pages) with no scanning or type enforcement.
**Fix:** Validate actual file bytes against declared MIME type, enforce a size cap, and gate behind the same auth level as the form/flow it belongs to.

### 4. IDOR / forgery chain via signature + PDF generation
**File:** `src/globals/letters/notices-settings/components/actions.ts`
- `getUserSignatureAction` (76-127): returns any staff member's raw signature image by email, no auth.
- `generatePdfAction` (337-563): takes client-supplied `slug`, `id`, `authorizedEmail`; fetches the record with `overrideAccess:true`, injects the (stolen) signature, generates a PDF, and **writes it back onto the record as an attachment**.
**Exploit:** An anonymous caller can forge an "approved/signed" official letter or notice on any workflow document.
**Fix:** Require the session's own user to match `authorizedEmail`/signature owner; never accept `overrideAccess:true` paths from unauthenticated callers.

### 5. `userId`/`operatorId` trusted from client, not session (repeats across many actions)
No `payload.auth()`/session check — the caller can specify literally any user or operator ID and the action trusts it:
- `src/common/components/user-settings/actions.ts` — `getUserSettingsAction` / `saveUserSettingsAction` (10-71): read/overwrite any user's e-signature via client-supplied `userId`.
- `src/globals/forms-dashboard/components/actions.ts` and `src/globals/workflow-dashboard/components/actions.ts` — every export (`fetchAccessibleForms`, `fetchFormSubmissions`, `exportSubmissionsToCSV`, `updateSubmissionStatus`, `updateSubmissionData`, `archiveSubmission`, `fetchWorkflowForms`, `fetchWorkflowSubmissions`, `fetchWorkflowSubmissionDetail`, `exportWorkflowSubmissionsToCSV`).
- `src/globals/fnb-import/actions.ts` — all exports take `operatorId` from the client with no auth.
**Exploit:** Pass any known/guessable super-user ID to read, export, update, or archive any operator's form/workflow/HR/salary-deduction data system-wide.
**Fix:** Derive the acting user from `payload.auth({ headers })` server-side; never accept an identity parameter from the client for anything privileged.

### 6. Unauthenticated cross-tenant data dump
**File:** `src/globals/employee-history/components/actions.ts` — `fetchAllUsers` (37-56), `fetchEmployeeHistory` (62-194)
No auth. Dumps the entire `users` table and all disciplinary-action records across every operator/tenant.

### 7. SSRF via admin settings action
**File:** `src/globals/h2a-oasys-settings/components/actions.ts` — `handleTestH2aOasysConnection` (192-220)
No auth; forwards a client-supplied `baseUrl` straight into a server-side `fetch()` (`src/services/h2a-oasys/index.ts:88`) and returns the raw response.
**Exploit:** Point `baseUrl` at internal infrastructure/metadata endpoints and read the response back.

### 8. Auth bypass gated only by `NODE_ENV`
- `src/endpoints/exchange-emails/index.ts`: `?email=` query param overrides identity resolution whenever `process.env.NODE_ENV !== 'production'`. Backing `getEmailsForUser` (`src/services/exchange.ts`) uses EWS impersonation with a privileged service account — if `NODE_ENV` isn't reliably `production` on every deployed process (PM2 configs are a common place this slips), this is unauthenticated read access to **any employee's mailbox**.
- `src/endpoints/auth-microsoft/index.ts` logs a live Microsoft Graph **bearer access token** to server logs under the same `NODE_ENV` gate.
- `payload.config.ts` `admin.autoLogin` auto-logs-in as `PAYLOAD_FIRST_USER_EMAIL` under the same gate.
**Action item:** Verify every deployed/staging process (PM2 ecosystem configs included) explicitly exports `NODE_ENV=production`. Relying on it as the sole boundary in three places is a systemic risk.

### 9. Unescaped input built into SOAP/XML
**File:** `src/services/exchange.ts` (`<t:SmtpAddress>${userEmail}</t:SmtpAddress>`, ~line 92 & 197)
No XML-escaping — a crafted email value can break out of the element and inject SOAP nodes. Becomes directly attacker-controlled the moment finding #8's `?email=` bypass is reachable.

---

## High

10. `src/common/components/workflow-admin/actions.ts` — `uploadInternalMediaAction` (57-89): no auth, `overrideAccess:true` — unauthenticated arbitrary file upload into `internal-media`.
11. `src/common/components/h2a-oasys-dashboard/actions.ts` — `getH2AEmployeeInfoAction`: no auth, returns HR/employee PII.
12. `src/app/(frontend)/forms/submissions/[id]/actions.ts` — `searchUsersForReassign` (31-72): any valid (non-super-user) reviewer token can search the entire `users` collection with no operator filter — cross-tenant email/department leak.
13. **Deterministic, emailed-in-plaintext passwords** — `src/services/microsoft-auth.ts`: every Microsoft SSO login resets the Payload password to `sha256(email + PAYLOAD_SECRET).substring(0, N)` (not actually random despite the name) and emails it in plaintext. A `PAYLOAD_SECRET` leak lets an attacker compute every user's password offline — doubles the blast radius of that secret (it already signs sessions).
14. **Loose domain-substring match for operator assignment** — same file: `email.includes('@dohaoasis.com')` / `.includes('printempsdoha.com')` instead of a proper suffix match. `x@dohaoasis.com.attacker.net` would match. Exploitability limited by single-tenant AAD, but it's a real logic bug worth fixing.

---

## Medium

15. **Draft/unpublished menu pages are publicly visible** — `src/app/(frontend)/fnb/menu/[slug]/page.tsx` (`fetchMenuPage`, lines 16-34) calls `payload.find({ collection: 'menu-pages', overrideAccess: true })` with no `_status: published` filter, even though `versions.drafts` is enabled specifically to keep unpublished content hidden. Anyone who knows/guesses a slug sees pre-publish content. (Contrast: `getAllergensAction` in the same fnb flow does correctly filter `_status: published` — this is an inconsistency, not a deliberate design choice.)
16. **Cross-user form-submission linkage (IDOR)** — `resubmitFormAction` (`src/app/(frontend)/forms/_components/form-renderer/actions.ts`, 73-137): fetches `originalSubmissionId` with `overrideAccess:true`, only checks `form.requires_auth` — never verifies the caller owns that submission. For any form without `requires_auth`, this is fully unauthenticated.
17. `src/common/actions/relation-options.ts` — leaks all operator/restaurant/department names, no auth.
18. `src/globals/lacigale-sales-report/components/actions.ts` — `fetchLacigaleSalesStats`: exposes hotel revenue/occupancy data, no auth.
19. `generateQRCodeAction` (`src/collections/forms/components/actions.ts` and `src/collections/public/site-pages/components/actions.ts`): no auth, lets anyone delete/regenerate QR media for any form/page id.
20. `src/services/backup.ts` — `performBackup(req)` does no auth check itself; safety today depends entirely on its one caller (`/backup` endpoint) checking `super_user` first. A second caller added later without the same check would expose a full DB backup.
21. Missing OAuth `state`/PKCE on the Microsoft login flow (`src/endpoints/auth-microsoft/index.ts`) — no CSRF protection on the login redirect.
22. CORS trusts `https://dohaoasis0.sharepoint.com` with credentials for the whole Payload REST API (`payload.config.ts`, not scoped to just `/exchange-emails`) — intentional for the SharePoint integration, but confirm that's the intended blast radius.

---

## Checked and confirmed fine

- `src/app/(frontend)/forms/login/actions.ts`, `src/app/(frontend)/letters/login/actions.ts` — plain login/logout, delegate to `payload.login`.
- `src/app/(frontend)/letters/[slug]/create/actions.ts` — auth + operator scoping.
- `src/app/(frontend)/letters/[slug]/[id]/actions.ts` and `forms/submissions/[id]/actions.ts` — `processWorkflowAction`, `uploadAttachmentAction`, `processWorkflowInstanceAction`, `uploadAttachmentInstanceAction` — all validate a magic-link token against the record's own stored reviewer tokens before acting; token is UUIDv4 (unguessable). Legitimately protected even though reachable by anonymous reviewers.
- `src/app/(frontend)/forms/submissions/[id]/actions.ts` — `searchUsersForReassign`, `reassignInstanceReviewerAction` — gated on `super_user` OR a valid per-instance reviewer token.
- `src/app/(frontend)/forms/_components/form-renderer/actions.ts` — `submitFormAction`, `getFormAction`, `getMediaAction` — correctly checks `form.requires_auth` / `form.required_access` before creating a submission.
- `src/app/(frontend)/fnb/menu/_actions/index.ts` — `getAllergensAction` — public read, correctly filtered to `_status: published`.
- `src/common/components/quick-view-dashboard/actions.ts` — requires session.
- `src/common/components/seed-dashboard/actions.ts` — `accessCheck` gated on `super_user`.
- `src/collections/workflow-instances/actions.ts` — reassignment gated on `super_user`.
- `src/collections/public/menu-pages/endpoints/get-content-by-slug.ts` — requires `req.user` + `accessCheck('menu-pages', 'read', ...)` (note: not actually what the public site uses — the site's own page component bypasses this via `overrideAccess: true`, see finding #15).

---

## Suggested fix order

1. Finding #1, #2, #3 (e-recognition open relay / PII dump / open upload) — live, no-login-required abuse paths on a page anyone can open right now.
2. Finding #8 (`NODE_ENV`-gated bypasses) — verify/patch PM2 + deployment config, remove the `?email=` override and the token logging entirely rather than relying on an env check.
3. Finding #5 and #6 (client-supplied `userId`/`operatorId` trusted instead of session) — systemic pattern across `globals/*/components/actions.ts`, needs the same fix (`payload.auth()` + operator-scope check) applied file by file.
4. Finding #4 (signature/PDF forgery chain) and #15 (draft menu pages) — narrower blast radius but concrete data-integrity/disclosure issues.
5. Remaining Medium items as time allows.
