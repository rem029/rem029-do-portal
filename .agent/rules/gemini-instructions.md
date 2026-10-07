---
trigger: always_on
---

# AI Coding Agent Core Instructions

## 1. System Environment & Tooling

- **Node/Env:** Always `nvm use 22`.
- **Package Manager:** Strictly `yarn` (no npm/pnpm).
- **Primary Backend:** Backend V3 (`apps/backend-admin-v3`). Note: Legacy (`apps/backend-admin`) is frozen/deprecating — do not modify it.
- **Frontend:** React 18, Tailwind, DaisyUI v5 (use [https://daisyui.com/llms.txt](https://daisyui.com/llms.txt) as reference), React Router.

---

## 2. Security & Access Control

- **Access Resolver:** Use `accessCheckResolver(slug, operation, { fallbackAccess, refineAccess })` for all collections.
- **Multi-tenancy:** Every collection must include an `operator` (relation) and `operator_slug`.
- **Operator Slug:** Use `setOperatorSlugCollection(slug)` in `beforeValidate` hooks.
- **Time Enforcement:** Use `checkTimeBasedAccess` for workflow-based submissions.
- **SSO:** Azure AD SSO is handled via `src/endpoints/auth-microsoft/`.

---

## 3. Architecture: Backend V3 (Next.js 15, Payload 3.x)

### Directory Organization Rules

- **Rule:** If a component/hook is used by one collection, keep it local. If used by two or more, move to `src/common/`.

| Category              | Path                                 | Usage                                             |
| :-------------------- | :----------------------------------- | :------------------------------------------------ |
| **Local Components**  | `src/collections/<name>/components/` | Specific UI (e.g., specialized selects).          |
| **Local Hooks**       | `src/collections/<name>/hooks/`      | Collection-specific `beforeChange`/`afterChange`. |
| **Shared Components** | `src/common/components/`             | `cutoff-notice`, `workflow-ui`, `slug`.           |
| **Shared Fields**     | `src/common/fields/`                 | `created-by`, `updated-by`, `workflow`.           |
| **Shared Hooks**      | `src/common/hooks/`                  | `workflow-init`, `operator-slug-update`.          |
| **Services**          | `src/services/`                      | External APIs (Microsoft, Oasys).                 |
| **Utilities**         | `src/utilities/`                     | Access logic, constants, validations.             |

### Collection Configuration (`CollectionConfig`)

Maintain this strict property order:

1. `slug`
2. `labels`
3. `disableDuplicate`
4. `admin`
5. `versions`
6. `dbName`
7. `fields`
8. `access`
9. `hooks`

**Required Fields & Hooks:**

- **Fields:** Must include `CreatedByField` and `UpdatedByField`.
- **Hooks:** `beforeChange` must include `setUserCreatedOrUpdatedByCollection`. Audit logs required in `afterChange` and `afterDelete`.

### Global Settings Configuration

- **Path:** `src/globals/` (e.g., `hr-requests-settings`).
- **Group:** Always `'Settings'`.
- **Hooks:** Must include `setUserCreatedOrUpdatedByGlobal` and `auditLogGlobalAfterChange`.

---

## 4. Frontend & Bilingualism

- **Bilingual (EN/AR):** Mappings in `src/utils/contents.ts`.
- **CMS Integration:** Use `src/hooks/use-payload.ts` for API interaction.
- **Styling:** Use Tailwind utility classes. **No inline styles.** Prioritize Tailwind utility classes for all custom styling. Follow DaisyUI v5 patterns as documented in [daisyui.com/llms.txt](https://daisyui.com/llms.txt).
- **Admin UI:** When extending the Payload CMS admin panel, prioritize using components from `@payloadcms/ui` where available to ensure consistency.
- **JSX Rule:** Keep JSX clean. Extract complex logic or async mapping into sub-components or helpers outside the return statement.

---

## 5. TypeScript & Casting Rules

- **Never use `as any`:** Use proper types or `as unknown as T` only when TypeScript's structural check requires it (divergent types). Always document why with a short inline comment.
- **Seed create data:** Use `RequiredDataFromCollectionSlug<'collection-slug'>` from `payload` instead of `as unknown as CollectionType`. This makes `id`, `createdAt`, and `updatedAt` optional while keeping all domain fields strongly typed.
- **Admin `hidden` callbacks:** The user object `u.user` matches the `ClientUser` shape. Cast with `u.user as unknown as User` to resolve structural mismatches.
- **JSON fields:** Placed as type `json` in Payload are generated as `unknown`. A double-cast is required when reading them into a specific type shape.

---

## 6. Database & Migrations Workflow

After any schema changes (adding fields, new collections):
1. **Regenerate types:** `yarn generate:types`
2. **Create migration:** `yarn payload migrate:create "descriptive name"` (ALWAYS pass a quoted description label)
3. **Apply migration:** `yarn payload migrate`

### Idempotency Migration Rules

All SQL in `up()` migration blocks must be written to be fully idempotent:
- **CREATE TYPE:** Wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
- **ALTER TYPE ... ADD VALUE:** Wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
- **CREATE TABLE:** Always use `CREATE TABLE IF NOT EXISTS`.
- **ALTER TABLE ... ADD COLUMN:** Always use `ADD COLUMN IF NOT EXISTS`.
- **ADD CONSTRAINT:** Wrap in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`
- **CREATE INDEX / CREATE UNIQUE INDEX:** Always use `IF NOT EXISTS`.
- **down() counterpart:** Use `DROP TABLE IF EXISTS`, `DROP COLUMN IF EXISTS`, `DROP CONSTRAINT IF EXISTS`, `DROP INDEX IF EXISTS`, and `DROP TYPE IF EXISTS`.

---

## 7. Testing & Local Development

- **Dev server:** Run `yarn dev` in `apps/backend-admin-v3` → accessible at http://localhost:3015/pv3/admin
- **Super user account:** `default@payload.com` / `default@payload.com`
- **Local E2E Testing:** Use the Playwright MCP tools to interact with and drive the admin UI.

### Email Notification Testing

Local dev sends mail through Ethereal (a fake SMTP catcher). Inspect sent emails by logging into https://ethereal.email/ with these credentials:
- **SMTP_HOST:** `smtp.ethereal.email`
- **SMTP_PORT:** `587`
- **SMTP_USER:** `agustin55@ethereal.email`
- **SMTP_PASS:** `KuqjB4TWqSaxNfuXx4`
- **SMTP_FROM_ADDRESS:** `agustin55@ethereal.email`
- **SMTP_FROM_NAME:** `'Info Mail'`

---

## 8. Deployment & PM2 Processes

- **Branching:** Merge `dev` → `production` via `yarn push:production`.
- **Server Script:** `bash scripts/common/init-app.sh production survey_do --with-v3`.
- **PM2 Processes:**
  - `do-app-backend-admin-v3`
  - `do-app-backend-admin` (Legacy)
  - `do-app-github-webhook`

---

## 9. Critical Implementation Patterns

- **Workflows:** Multi-step approvals (`requestor_department`, `department`, or `email`). Use `_workflow_status` for internal logic and `workflow_status` for UI.
- **New Collections:** Create config → add to `payload.config.ts` → `yarn generate:types` → `yarn migrate:create`.
- **AI Chat:** Legacy `/ai/chat` (OpenAI Assistant) persists in `apps/backend-admin`.

---

## 10. Feature Minimum Requirements

When creating a new collection or feature, adhere to the following standards (based on `src/collections/public/link-shortener/index.ts`):

- **Configuration:** If settings are required, create a global named `<collection-name>-settings` under the 'Settings' group.
- **Labels:** Determine appropriate singular/plural labels or ask for clarification.
- **Admin Group:** Always categorize the collection under a specific `group` in the `admin` configuration.
- **Required Fields:**
  - `slug`: Text field, unique, required (often used as `useAsTitle`).
  - `CreatedByField` and `UpdatedByField`.
- **Required Hooks:**
  - `beforeChange`: Include `setUserCreatedOrUpdatedByCollection`.
  - `afterChange` / `afterDelete`: Include audit logs (`auditLogAfterChange`, `auditLogAfterDelete`).
- **Access Control Pattern:**
  ```typescript
  access: {
    admin: accessCheckResolver(SLUG, 'super_user', {
      fallbackAccess: false,
    }) as AccessAdmin,
    read: accessCheckFields,
    create: accessCheckFields,
    update: accessCheckFields,
    delete: accessCheckFields,
  }
  ```
- **Access Check Utility (`accessCheckFields`):** Implement a utility to restrict access to creators (unless super_user) using `accessCheck` and `refineAccess`.

---

## 11. Development Best Practices

- **Keep It Simple:** Prefer the smallest change that fits existing patterns — Payload hooks, access helpers, existing utilities, Payload/Next built-ins — over new abstractions or extra plumbing. E.g. a value derivable server-side from the saved document belongs in a collection hook, not passed through the UI from the client.
- **Avoid Reinventing the Wheel:** Before implementing custom engine blocks, state machines, or complex utilities from scratch, check `package.json` for something already installed, then research whether a reputable, standard, community-accepted package (e.g., `lodash`, `date-fns`, `easy-template-x`) can fulfill the requirement. Only add a new dependency if it is actively maintained (recent releases, issues being answered), widely used, and has a compatible license; otherwise write a small local helper.
- **Check Existing Code First:** Before creating new utility functions or types under `src/utilities/` or `src/common/`, check if similar helper functions already exist in the workspace to prevent logic duplication.
- **Reusable Component Design:** Build React components to be modular, dry, and reusable. Avoid hardcoded page-specific logic inside shared components.
- **Extract Complex JSX:** Keep component return statements clean and readable. Extract complicated mappings, async logic, or large conditional branches into dedicated helpers or sub-components outside the main component's body.

---

## 12. Working Style

- **Long-task delegation:** If a prompt looks like a long piece of work that could be handed off to another AI agent, say so before starting. Write the plan as a `.md` file (context, files to change, step-by-step tasks, verification steps) so it can be delegated.
