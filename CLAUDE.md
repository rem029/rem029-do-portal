# Project Instructions

## Working Style

- **Long-task delegation:** If a prompt looks like a long piece of work that could be handed off to another AI agent, say so before starting. Write the plan as a `.md` file (context, files to change, step-by-step tasks, verification steps) so it can be delegated.

### Feature Planning Workflow (`docs/<branch-name>/`)

When a new feature or change request comes in and it looks **big** (multiple files/collections, a schema change, more than a session's worth of work, or naturally splits into independent pieces), **say so first**, then plan it before building. Plans live in `docs/`, not `.temp/` — `docs/` is committed, so the plan follows the branch across machines and survives a `/clear`; `.temp/` is gitignored and local-only, so anything written there disappears the moment you're on a different machine.

1. **Create the branch folder:** `docs/<branch-name>/` (e.g. `docs/TECH-0123/`). One folder per feature branch.
2. **Write the overview plan** as `docs/<branch-name>/Plan.md`: shared context/background, the product decisions already agreed, the key existing files that matter, the full phase list with suggested order and dependencies, and what's explicitly out of scope. This is the one shared copy of background so individual phase files don't each repeat it.
3. **Break the work into phases**, one file each: `docs/<branch-name>/phases/phase-<N>-<short-description>.md` (kebab-case description — e.g. `phase-1-table-seats-and-qr.md`). Each phase file must be **self-contained**: a fresh Claude session with no other context should be able to execute it from that file alone (condensed recap of context, files to change, step-by-step tasks, verification steps). Written this way, a phase file doubles as the delegation prompt handed to `agy` (see AI Agent Orchestration below) for the build phase.
4. **Track overall progress** as needed — fold the outcome into the phase doc once it's done, and/or keep a branch-level `docs/<branch-name>/status.md` (or `open-items.md`) as a running checkpoint: what's been built, deviations from plan, known issues, follow-ups. Not a rigid template — write whatever a future session (or another machine) would need to pick the branch back up cold. Supporting screenshots go in `docs/<branch-name>/screenshots/`.

Resulting layout:

```
docs/
  TECH-0123/
    Plan.md
    status.md
    phases/
      phase-1-table-seats-and-qr.md
      phase-2-guest-seat-selection.md
    screenshots/
      phase-2-seat-picker.png
```

For small/tightly-scoped requests, skip this and just do the work.

## AI Agent Orchestration (agy-bridge)

This repo uses the `agy-bridge` MCP server (the Antigravity / Gemini CLI). **Claude is the orchestrator and reviewer; `agy` is the builder.** Default to this division of labour rather than implementing everything in-context — planning in Claude and delegating the build keeps Claude's token spend low.

- **Bootstrap (do this first if the tools are missing):** if the `mcp__agy-bridge__*` tools aren't available but the `agy` CLI is installed on the system (`command -v agy` succeeds), register the server before planning any build:
  `claude mcp add agy-bridge -s user -- npx -y agy-bridge`
  then continue. If `agy` itself is not installed, tell the user and fall back to building in-context.
- **Claude does:** understand the request, gather context, plan, split the work into scoped units, write the delegation prompt, then **review every diff agy produces** (correctness, architecture-rule compliance from this file, types, edge cases) before it is considered done. Claude owns the final quality bar.
- **agy does:** the actual building — writing/editing files, running migrations, wiring components — inside a working directory Claude points it at.
- **Tools:**
  - `mcp__agy-bridge__delegate` — hand agy a complete, self-contained task prompt (include the relevant file paths, the architecture rules that apply, and the verification steps). Pass `cwd` as the app root (usually `/home/lawrence/survey-doha-quest/apps/backend-admin-v3`).
  - `mcp__agy-bridge__follow_up` — continue a delegation by `session_id` for fixes/iterations; don't re-send context.
  - `mcp__agy-bridge__adversarial_review` — second-opinion review of a plan or diff from a different model family. Use before merging non-trivial work.
  - `mcp__agy-bridge__analyze_files` / `mcp__agy-bridge__deep_search` — offload large-file reads and repo archaeology so they never enter Claude's context.
- **When Claude may build directly (skip agy):** trivial one-line/one-file edits, or tightly-coupled changes across many files where the delegation overhead exceeds the work. State the reason briefly when doing so.
- **Always review agy's output** — never merge or report a delegation as complete without reading the diff.

## Environment

- **Node:** Always `nvm use 22` before running any commands.
- **Package Manager:** `yarn` only — never npm or pnpm directly.
- **Primary Backend:** `apps/backend-admin-v3` (Next.js 15 + Payload 3.x). The legacy `apps/backend-admin` is frozen/deprecating — do not modify it.
- **Frontend:** React 18, Tailwind, DaisyUI v5, React Router.

## Backend V3 Architecture (`apps/backend-admin-v3`)

### Directory Rules

If a component/hook is used by one collection → keep it local (`src/collections/<name>/`).  
If used by two or more → move to `src/common/`.

| Category | Path | Usage |
|---|---|---|
| Local Components | `src/collections/<name>/components/` | Specialized UI for that collection |
| Local Hooks | `src/collections/<name>/hooks/` | `beforeChange`/`afterChange` for that collection |
| Shared Components | `src/common/components/` | Used across ≥2 collections |
| Shared Fields | `src/common/fields/` | `created-by`, `updated-by`, `owners`, `workflow` |
| Shared Hooks | `src/common/hooks/` | `workflow-init`, `operator-slug-update` |
| Services | `src/services/` | External APIs (Microsoft, Oasys) |
| Utilities | `src/utilities/` | Access logic, constants, validations |

### API Calls

- **Internal calls** (admin UI or frontend components calling this same app's own data) must go through **Next.js Server Actions** (`'use server'`), never a client-side `fetch` to a Payload REST/custom endpoint. Pattern: client component gets the current user via `useAuth<User>()` (admin) or is already server-rendered (frontend), passes `user.id` into the action, and the action does `payload.findByID({ collection: 'users', id: userId, overrideAccess: true })` + `hasUserAccess(user, slug, 'read'|'create'|...)` to re-apply the access check `overrideAccess` bypassed — see `src/globals/workflow-dashboard/components/actions.ts` and `src/globals/survey-send-invitation/components/bulk-send/actions.ts`.
- **External calls** (a third-party system, not this app's own UI, needs to reach the data) — expose a custom Payload REST endpoint (`src/collections/<name>/endpoints/`) or use Payload's generated collection REST API, authenticated via API key (`auth.useAPIKey` on `users`) or another explicit mechanism. Never build a custom endpoint for a call this app's own UI makes to itself.

### Services Take `payload` as a Parameter

Any function in `src/services/` (or a shared utility) that needs Payload takes `payload: Payload` as its **first parameter** — the caller supplies it. See `src/services/h2a-oasys/index.ts` and `src/services/docusign/`.

- **Endpoints / hooks / access functions:** pass `req.payload`.
- **Server actions:** call `getPayload({ config: configPromise })` once at the top of the action and pass that instance down.
- **Never** import `@payload-config` or call `getPayload()` inside a service. `payload.config.ts` imports endpoints → services, so a service importing the config creates a circular import. Dev tolerates it, but the production bundle crashes with `ReferenceError: Cannot access '<x>' before initialization`.
- Don't paper over a cycle with workarounds like lazy `await import('@payload-config')`, module-level singletons or re-export shuffling. Fix the dependency direction instead.

### CollectionConfig Property Order

Always maintain this order:
1. `slug`
2. `labels`
3. `disableDuplicate`
4. `admin`
5. `versions`
6. `dbName`
7. `fields`
8. `access`
9. `hooks`

### Required Fields on Every Collection

- `CreatedByField` and `UpdatedByField` (from `src/common/fields/`)
- `operator` relationship + `operator_slug` text field (multi-tenancy)

### Required Hooks on Every Collection

- `beforeChange`: include `setUserCreatedOrUpdatedByCollection`
- `beforeValidate`: include `setOperatorSlugCollection('operator_slug')`
- `afterChange`: include `auditLogAfterChange(SLUG)`
- `afterDelete`: include `auditLogAfterDelete(SLUG)`

### Access Control

Use `accessCheckResolver(slug, operation, { fallbackAccess, refineAccess })` for all collections.  
Use `operatorAccessRefine` for multi-tenant access.  
Use `checkTimeBasedAccess` for workflow-based submissions.  
SSO (Azure AD) lives in `src/endpoints/auth-microsoft/`.

### Item-level Ownership (optional)

By default, any user with a plain (non-super) grant on a collection sees **every document for their operator** (`operatorAccessRefine`/`restaurantAccessRefine`). When a collection instead needs "only documents I created, or was explicitly shared with me" — e.g. a manager's own draft events shouldn't be visible/editable by every other manager on the operator — layer this on top instead of inventing a one-off scheme. Introduced for `fnb-menu-events` (TECH-0098 Task 11C); reuse the same three pieces on any other collection that needs it:

1. **Field:** add `getOwnersField(SLUG)` (`src/common/fields/owners.ts`) to the collection's top-level `fields`, alongside the required `CreatedByField`/`UpdatedByField`. It's a `relationship`/`hasMany` to `users`, sidebar-positioned, filtered to the document's own `operator`. Field-level `access` is tighter than the collection's own `update` access: anyone who can open the document can read who the owners are, but only a super user (global `user.super_user`, or that collection's own `user.access.<slug>.super_user` row, via `isCollectionSuperUser`) can change the list — an owner/creator sees it read-only, so sharing stays admin-controlled rather than self-service.
2. **Server-side access:** use `ownershipAccessRefine` (`src/utilities/access-operator.ts`) as `refineAccess` instead of `operatorAccessRefine`/`restaurantAccessRefine`, on whichever of `admin`/`read`/`create`/`update`/`delete` should be ownership-scoped (`create` usually doesn't need it — a new document has no `created_by` yet at check time). Super users (global or the collection's own `super_user` grant) are unaffected — `isCollectionSuperUser` still short-circuits before this refine ever runs.
3. **Admin UI condition:** for any tab/field whose visibility should mirror the same rule (e.g. hiding a builder panel from a non-owner), use `canUserAccessOwnedDocument(data, user, slug)` (`src/utilities/ownership-condition.ts`) inside its `admin.condition` — it's dependency-light and client-safe by design (no imports from `@/utilities/access`, since `admin.condition` runs in the browser). This only controls what the UI shows; the real gate is #2 plus any server action's own assert (mirror the same three checks — super user, operator match, `created_by`/`owners` match — using the already-loaded document, as `assertCanEditEventMenu` in `fnb-menu-events/components/actions.ts` does).

Skip this entirely for collections where operator-wide visibility is correct (most of them) — it's an opt-in narrowing, not a default.

### Global Settings

- Path: `src/globals/<name>/`
- Admin group: always `'Settings'`
- Hooks: must include `setUserCreatedOrUpdatedByGlobal` and `auditLogGlobalAfterChange`

### Admin Sidebar Nav Icons

Sidebar nav icons (both collection/global links and nav group headers) are pure CSS — no Payload field, no generator script. Payload's stock nav renders each link with a stable `id="nav-<slug>"` / `id="nav-global-<slug>"` and each group with a CSS class built from its label; icons are `::before` mask-image pseudo-elements in `apps/backend-admin-v3/src/app/(payload)/admin-theme/_nav-icons.scss` keyed off those. A collection/global with no icon renders label-only — this is expected, not a bug.

**To add an icon for a collection or global:**
1. Drop an `icon.svg` next to its `index.ts`/`index.tsx` (e.g. `src/collections/media/icon.svg`) — small, single-color; it's recolored via `currentColor` in CSS.
2. Add a block to `_nav-icons.scss` referencing it by relative path, keyed off the collection's actual **slug** (its `SLUG`/`COLLECTION_NAME` constant — not necessarily the folder name, e.g. `haccp-dishwashing/` → slug `haccp-dishwashing-temperature`):
   ```scss
   #nav-<slug>.nav__link,
   #nav-global-<slug>.nav__link {
     @include nav-icon('../../../collections/<folder>/icon.svg');
   }
   ```

A wrong or missing slug just means the icon doesn't show (same as no icon at all) — nothing breaks.

**To add an icon for a nav group** (e.g. `admin.group: 'Reports'`): drop the svg at `src/common/nav-icons/groups/<group-slug>.svg` (lowercase-hyphenated, not the display label) and add:
```scss
.nav-group.<Group>.<Label>.<Words> > .nav-group__toggle {
  align-items: center;
  @include nav-icon('../../../common/nav-icons/groups/<group-slug>.svg');
}
```
Payload renders a multi-word group label (e.g. `'Workflow V2'`) as separate space-joined class tokens, not one class — chain them as `.nav-group.Workflow.V2` (order doesn't matter, all tokens must be present).

`url()` in `_nav-icons.scss` is a normal relative-path CSS asset reference, resolved and bundled by Next's own Sass pipeline like any other CSS asset import — no data-URI encoding, no build step, no generator script.

### Admin Search Allowlist

The topbar command palette (`⌘K`/`Ctrl+K`) only searches collections and globals listed in `src/utilities/admin-search-config.ts` (`ADMIN_SEARCHABLE_COLLECTIONS` / `ADMIN_SEARCHABLE_GLOBALS`) — it is an explicit allowlist, not automatic. When adding a new **collection** or **global**, add an entry there too (or ask the user first if it's unclear whether it belongs — e.g. a purely internal/operational collection):

- `titleField`: the collection's real text-typed `useAsTitle` field, used for `like`/`ILIKE` document search. **Verify the underlying column is actually `text`/`varchar`, not a Postgres native enum, UUID, or date/timestamp** (check the collection's migration for `CREATE TYPE ... AS ENUM` or the field's `type: 'select'`/`relationship`/`date` — enum and UUID columns throw on `ILIKE` without an explicit cast, confirmed the hard way in TECH-0112 Phase 8 with `audit-logs.operation` and `analytics.eventType`, both native enums). If there's no suitable text field, omit `titleField` — the collection still gets a "Go to `<Collection>`" navigation shortcut, just no document-level search.
- Every entry (`titleField` or not) is matched by collection name via `actions.ts`'s substring + word-token matching — no extra config needed for that part.
- **Globals:** when adding a new global, add it to `ADMIN_SEARCHABLE_GLOBALS` in the same file (`slug` + `label`). Globals are navigation shortcuts only ("Go to <Global>", linking to `/admin/globals/<slug>`). Visibility comes from Payload's `getAccessResults`, so each global's own `access.read` applies.
- **Labels must be distinct** across both lists (e.g. `FnB Media` vs `Forms Media`, not two `Media` entries) — the label is both what's matched and what's shown.

## TypeScript Rules

- **Never use `as any`** — use proper types or `as unknown as T` only when TypeScript's structural check requires it (divergent types). Document why with a short inline comment.
- **Seed create data:** Use `RequiredDataFromCollectionSlug<'collection-slug'>` from `payload` instead of `as unknown as CollectionType`. This makes `id`, `createdAt`, `updatedAt` optional while keeping all domain fields strongly typed.
- **Admin `hidden` callbacks:** `u.user` is `ClientUser` — cast with `u.user as unknown as User` (structural mismatch, unavoidable).
- **JSON fields** (`type: 'json'` in Payload): typed as `unknown` in generated types — double-cast is required when reading them as a specific shape.
- **Comments:** only for logic that isn't obvious from the code itself (a non-obvious "why", a gotcha, a structural cast). Keep them to a line or two — no multi-paragraph explainers. Skip comments on straightforward code.

## Database & Types Workflow

After any schema change (adding fields, new collections):
```
yarn generate:types                                                    # regenerate src/payload-types.ts
yarn payload migrate:create "descriptive name of the migration"        # create migration — ALWAYS pass a quoted label
yarn payload migrate                                                   # apply pending migrations
```

### Migration Rules

- **Always pass a quoted label** when creating a migration: `yarn payload migrate:create "store departments collection added"`. The auto-generated timestamp-only filename has no context.
- **All SQL in `up()` must be idempotent** — use conditional statements so re-running never breaks:
  - `CREATE TYPE`: wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
  - `ALTER TYPE ... ADD VALUE`: wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
  - `CREATE TABLE`: always `CREATE TABLE IF NOT EXISTS`
  - `ALTER TABLE ... ADD COLUMN`: always `ADD COLUMN IF NOT EXISTS`
  - `ADD CONSTRAINT`: wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
  - `CREATE INDEX` / `CREATE UNIQUE INDEX`: always `IF NOT EXISTS`
- **`down()` counterparts**: use `DROP TABLE IF EXISTS`, `DROP COLUMN IF EXISTS`, `DROP CONSTRAINT IF EXISTS`, `DROP INDEX IF EXISTS`, `DROP TYPE IF EXISTS`.

## Local Testing (backend-admin-v3)

- Dev server: `yarn dev` in `apps/backend-admin-v3` → http://localhost:3015/pv3/admin
- **Port per machine** (check `hostname`): on the **code server**, `caseform.app.rem029.com/pv3` proxies to **3003**, so run `PORT=3003 yarn dev`/`devsafe`. On the **Linux laptop** (`bazzite`), always use **3015**, including for `devsafe`. The caseform proxy does not reach the laptop.
- When testing locally, use the Playwright MCP tools to drive the admin UI.
- Super user account: `default@payload.com` / `default@payload.com`

### Parallel Claude Code Sessions (multiple branches/accounts on one machine)

When the user asks for a new worktree, give it its **own branch, folder, port and database** so it never collides with the main checkout:

1. **Worktree:** `git fetch origin && git worktree add -b <branch> ../survey-doha-quest-<branch> origin/dev` (drop `-b` and use `<branch>` as the last arg if the branch already exists). A branch can only be checked out in one worktree at a time.
2. **Port:** pick the next free one after 3015 (`ss -ltn | grep :30` to check). Ports in use by other worktrees: see `git worktree list` + each worktree's `.env`.
3. **Env:** copy `apps/backend-admin-v3/.env` from the main checkout (it's untracked), then in the copy set `PORT`, `PAYLOAD_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL` to the new port and `DATABASE_URI` to the new DB name. `yarn dev` reads `PORT` from `.env` via dotenv — a `PORT=… yarn dev` prefix is overridden by `.env`, so set it in the file.
4. **Database:** clone the main DB into `<main_db>_<branch>` (lowercase, `-` → `_`, e.g. `survey_employee_prod_v3_tech_0115`): `createdb -h localhost -U postgres <new_db> && pg_dump -h localhost -U postgres <main_db> | psql -h localhost -U postgres -q <new_db>` (credentials from `DATABASE_URI`; use `pg_dump`, not `createdb -T` — the template copy fails while the main dev server holds connections). Then `yarn payload migrate` in the worktree only affects its own DB.
5. **Install:** `nvm use 22 && yarn install` in the worktree — don't symlink `node_modules`; Payload's generated types and the `.next` cache get corrupted when shared across branches.
6. Report the folder, port, admin URL (`http://localhost:<port>/pv3/admin`) and DB name, and tell the user to start the second Claude Code session from the worktree folder.

**Teardown** (when asked): `git worktree remove ../survey-doha-quest-<branch>` and `dropdb -h localhost -U postgres <new_db>` — confirm with the user before dropping the DB.

### Email Notification Testing

Local dev sends mail through Ethereal (a fake SMTP catcher). To inspect sent emails, log in at https://ethereal.email/ and open Messages:

```
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=cecelia.franecki48@ethereal.email
SMTP_PASS=RHGWQWWkHakS63W1Dn
SMTP_FROM_ADDRESS=cecelia.franecki48@ethereal.email
SMTP_FROM_NAME='Info Mail'
```

Ethereal test-account credentials rotate/expire over time — the block above can go stale. **`apps/backend-admin-v3/.env` is the source of truth**; always check it directly rather than assuming this copy is current, and update this block when it drifts. A `535 Authentication failed` or `403 Authentication was rate limited` from `send-email` job logs usually means these creds need regenerating at ethereal.email.

## Deployment

- Branch flow: `dev` → `production` via `yarn push:production`
- Server init: `bash scripts/common/init-app.sh production survey_do --with-v3`
- PM2 processes: `do-app-backend-admin-v3`, `do-app-backend-admin` (legacy), `do-app-github-webhook`

## Development Best Practices

- **Keep It Simple:** Prefer the smallest change that fits existing patterns — Payload hooks, access helpers, existing utilities, Payload/Next built-ins — over new abstractions or extra plumbing. E.g. a value derivable server-side from the saved document belongs in a collection hook, not passed through the UI from the client.
- **Work With Payload, Not Around It:** Check the Payload docs (https://payloadcms.com/docs) and existing patterns in this repo before solving a framework-level problem. Use Payload's own mechanisms (`req.payload`, hooks, access functions, `getPayload` in server actions, Local API options) rather than clever workarounds. Code should be simple, straightforward, easy to debug and maintainable — if a fix needs a comment explaining why it's a hack, it's the wrong fix.
- **Avoid Reinventing the Wheel:** Before implementing custom engine blocks, state machines, or complex utilities from scratch, check `package.json` for something already installed, then research whether a reputable, standard, community-accepted package (e.g., `lodash`, `date-fns`, `easy-template-x`) can fulfill the requirement. Only add a new dependency if it is actively maintained (recent releases, issues being answered), widely used, and has a compatible license; otherwise write a small local helper.
- **Check Existing Code First:** Before creating new utility functions or types under `src/utilities/` or `src/common/`, check if similar helper functions already exist in the workspace to prevent logic duplication.
- **Reusable Component Design:** Build React components to be modular, dry, and reusable. Avoid hardcoded page-specific logic inside shared components.
- **Extract Complex JSX:** Keep component return statements clean and readable. Extract complicated mappings, async logic, or large conditional branches into dedicated helpers or sub-components outside the main component's body.
- **Verify Before Finishing:** Whenever a task or feature is done, run `yarn lint` and `yarn build` in `apps/backend-admin-v3` before considering it complete — catches type, lint, and build errors that unit-level checks (`tsc --noEmit` on individual files) can miss.
