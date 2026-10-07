# AI Coding Agent Instructions for `survey-doha-quest`

## General Instructions

- **Terminal Environment**: Always run `nvm use 22` when starting a new terminal session.
- **Package Management**: Use `yarn` for all applications (do not use pnpm or npm).

## Overview

Multi-tenant Doha Oasis application suite: employee surveys, perks, waivers, whistleblower forms, careers, KPI tracking, HR requests, business justifications, salary deductions. React frontend + Payload CMS backends (legacy deprecating, V3 active). Bilingual (en/ar) with workflow-based approvals.

## Architecture

### Frontend (`apps/frontend/`)

- **Stack**: React 18, TailwindCSS, DaisyUI, React Router
- **Dev**: `yarn start` (port 3000), `yarn test` (Jest), `yarn build`
- **Key Dirs**:
  - `src/components/form/`: Survey forms (customer-survey, employee-perks, ifly-waiver, roller-skating-waiver, chat, employee-whistle-blower-v2)
  - `src/utils/contents.ts`: Bilingual string mappings (`en`/`ar`)
- **Patterns**: Framer Motion animations, signature pads, QR scanning, PDF rendering

### Backend V3 (`apps/backend-admin-v3/`) - **PRIMARY**

- **Stack**: Next.js 15, Payload CMS 3.62, Postgres, yarn
- **Styling**: TailwindCSS (use utility classes, never inline styles)
- **Dev**: `yarn dev` (port 3015), `yarn test:int` (Vitest), `yarn test:e2e` (Playwright)
- **Engines**: Node ^18.20/>=20.9, yarn ^1
- **Collections** (`src/collections/`):
  - **Public**: `hr-requests`, `business-justifications`, `salary-deduction`, `e-recognition`, `link-shortener`, `internal-media`
  - **Core**: `users`, `departments`, `operators`, `workflow`, `media`
- **Globals** (`src/globals/`): `hr-requests-settings`, `business-justifications-settings`, `salary-deduction-settings`, `h2a-oasys-settings`
- **Endpoints** (`src/endpoints/`): `auth-microsoft` (Azure AD SSO)
- **Migrations**: Auto-generated JSON in `src/migrations/`, run via `yarn migrate:latest`
- **Seeding**: `src/seed/workflow.ts` creates default workflows per operator

### Backend Legacy (`apps/backend-admin/`) - **DEPRECATING**

- **Stack**: Payload CMS 2.x, Express, Postgres, yarn
- **Dev**: `yarn dev` (port 3000/admin), `yarn build`, `yarn start:pm2`
- **Collections**: `analytics`, `employee-whistle-blower`, `emp-benefits`, `net-promoter`
- **Routes**: `src/routes/ai.ts` - OpenAI chat endpoint (`/ai/chat`)

### GitHub Webhook (`apps/github-webhook/`)

- **Purpose**: Auto-deploy on push to `production` branch
- **Config**: `config.js` defines build scripts (frontend build, backend migrate, pm2 restart)
- **Dev**: `yarn dev`, Production: `yarn start:pm2`

### Utility Scripts (`misc/`)

- **Seeders**: `emp_question_new_add.js <API_KEY>` - Bulk add employee survey questions
- **CSV Import**: `add_do_vehicle_csv.js` - Vehicle data import

## Developer Workflows

### Local Development

1. **Root concurrent**: `yarn dev` (runs legacy backend + frontend)
2. **Per-app**:
   - Frontend: `cd apps/frontend && yarn start` (port 3000)
   - Backend V3: `cd apps/backend-admin-v3 && yarn dev` (port 3015)
   - Legacy: `cd apps/backend-admin && yarn dev` (port 3000/admin)
3. **Environment**: Copy `.env.example` → `.env` in each app dir

### Database & Migrations

- **V3 Migrations**: `cd apps/backend-admin-v3 && yarn migrate:latest`
- **Generate Types**: `yarn generate:types` (creates `src/payload-types.ts`)
- **Docker DB**: `docker-compose up` in backend dirs (Postgres)

### Testing

- **Frontend**: `yarn test` (Jest + React Testing Library)
- **Backend V3**:
  - Integration: `yarn test:int` (Vitest)
  - E2E: `yarn test:e2e` (Playwright, config: `playwright.config.ts`)

### Production Deployment

1. **Git Push**: `yarn push:production` (merges dev → production branch)
2. **Server Init**: `bash scripts/common/init-app.sh production survey_do --with-v3`
   - Pulls latest, runs `init-backend-admin-v3.sh`, `init-frontend.sh`
   - Builds apps, runs migrations, restarts PM2 processes
3. **PM2 Processes**:
   - `do-app-backend-admin-v3` (V3 backend)
   - `do-app-backend-admin` (legacy)
   - `do-app-github-webhook` (auto-deploy listener)
4. **Nginx**: Proxies `/payload` → backend, serves frontend static files (see root `README.md`)

### API Testing

- **REST Client**: `rest/local/*.http` (dev), `rest/production/*.http` (prod)
- **Examples**: `emp-benefits.http`, `hr-requests/add.http`, `chat.http`

## Conventions & Patterns

### Payload CMS (V3)

- **Collections**: Define in `src/collections/<name>/index.ts` with `CollectionConfig`
  - **Property Order**: Maintain the following order for `CollectionConfig`:
    1. `slug`
    2. `labels`
    3. `disableDuplicate`
    4. `admin`
    5. `versions`
    6. `dbName` (if applicable)
    7. `fields`
    8. `access`
    9. `hooks`
  - **Minimum Requirements**:
    1. Define a `SLUG` constant (e.g., `const SLUG = 'my-collection'`).
    2. `labels`: Include both `singular` and `plural`.
    3. `admin`:
       - `useAsTitle`: Define the display title field.
       - `group`: Set to `'Admin'`, `'Services'`, etc.
       - `listSearchableFields`: Array of searchable fields.
       - `hidden`: Use `accessHiddenBySlug(user, SLUG)`.
    4. `fields`: MUST include `CreatedByField` and `UpdatedByField`.
    5. `access`: Use `accessCheckResolver(SLUG, operation, { fallbackAccess: false })`.
    6. `hooks`:
       - `beforeChange`: Include `setUserCreatedOrUpdatedByCollection`.
       - `afterChange`: Include `auditLogAfterChange(SLUG)`.
       - `afterDelete`: Include `auditLogAfterDelete(SLUG)`.
  - `slug`: Unique identifier (e.g., `'hr-requests'`)
  - `access`: Control CRUD via `accessCheckResolver()` or custom `Access` functions
  - `hooks`: `beforeValidate`, `afterChange` for business logic
  - Example: `setOperatorSlugCollection('slug')` auto-generates `operator_slug` field
- **Globals**: Settings collections (e.g., `hr-requests-settings` for cutoff times, workflow assignment)
  - **Minimum Requirements**:
    1. Define a `SLUG` constant (e.g., `const SLUG = 'my-settings'`).
    2. `access`: Use `accessCheckResolver(SLUG, operation, { fallbackAccess: true })`.
    3. `admin.hidden`: Use `accessHiddenBySlug(user, SLUG)`.
    4. `admin.group`: Set to `'Settings'`.
    5. `hooks`:
       - `beforeChange`: Include `setUserCreatedOrUpdatedByGlobal`.
       - `afterChange`: Include `auditLogGlobalAfterChange(SLUG)`.
    6. `fields`: MUST include `CreatedByField` and `UpdatedByField`.
- **Workflows**: Multi-step approval system (`src/collections/workflow/`)
  - Steps: `{ label, slug, approverType: 'requestor_department' | 'department' | 'email' }`
  - Seeded per operator via `src/seed/workflow.ts`
- **Multi-tenancy**: `operators` collection, `operator_slug` field pattern (`{operator-slug}-{entity-slug}`)
- **Types**: Auto-generated `src/payload-types.ts` via `pnpm generate:types`

### Bilingual Support

- **Frontend**: `src/utils/contents.ts` - `{ en: "Text", ar: "نص" }` mappings
- **Backend**: Collections have `language` field, questions store `item: [{ type, language, title }]`

### Access Control

- **Pattern**: `accessCheckResolver(slug, operation, { fallbackAccess, refineAccess })`
- **Time-based**: `checkTimeBasedAccess(req, settingsSlug, workflowSlug)` - cutoff enforcement
- **Field-level**: `access: { update: ({ data }) => data?._workflow_status === 'draft' }`

### OpenAI Integration (Legacy)

- **Endpoint**: `/ai/chat` (POST `{ content, threadId }`)
- **Globals**: `OPEN_AI_KEY`, `OPEN_AI_ASSISTANT_KEY`, `OPEN_AI_INSTRUCTION`
- **Controller**: `src/controllers/ai.ts` - `createAndFetchMessage()`

### Styling

- **Tailwind**: Per-app configs, custom fonts (Poppins, Tajawal, Urbanist)
- **DaisyUI**: Frontend component library (buttons, modals, chat bubbles)

### JSX & React

- **Clean JSX**: Avoid writing `async` functions or complex logic inline within JSX.
  - **Pattern**: Extract complex mapping or data fetching into a separate async sub-component or a helper function defined outside the main return statement.
  - **Rationale**: Keeps the core component structure readable and maintainable.

## Backend V3 Folder Structure & Organization

### Directory Layout (`apps/backend-admin-v3/src/`)

```
src/
├── app/                    # Next.js app router pages
├── collections/            # Payload collections (data models)
│   ├── public/            # Public-facing collections
│   │   ├── hr-requests/
│   │   │   ├── components/     # Collection-specific UI components
│   │   │   ├── index.ts        # Collection config
│   │   │   └── email-template.ts  # Collection-specific helpers
│   │   └── link-shortener/
│   │       ├── hooks/          # Collection-specific hooks
│   │       └── index.ts
│   ├── users/
│   ├── departments/
│   └── workflow/
├── common/                 # Shared/reusable code
│   ├── components/        # Shared UI components (cutoff-notice, divider, slug, workflow-ui)
│   ├── fields/            # Reusable field configs (created-by, updated-by, workflow)
│   └── hooks/             # Shared hooks (operator-slug-update, workflow-init, workflow-update)
├── configs/               # Configuration files
├── endpoints/             # Custom API endpoints
│   └── auth-microsoft/    # Endpoint-specific logic
│       └── index.ts
├── globals/               # Payload global settings
│   └── hr-requests-settings/
├── jobs/                  # Background jobs/cron tasks
├── migrations/            # Database migrations (auto-generated)
├── seed/                  # Database seeders
├── services/              # Business logic services (h2aOasys, microsoft-auth)
├── utilities/             # Helper functions (access, validations, constants)
└── payload.config.ts      # Main Payload config
```

### Organization Rules

#### 1. **Collection-Specific Code** (stays within collection folder)

- **Components**: `src/collections/<name>/components/`
  - Example: `hr-requests/components/actions.ts`, `hr-requests/components/type-select.tsx`
  - Use when component is ONLY used by this collection
- **Hooks**: `src/collections/<name>/hooks/`
  - Example: `link-shortener/hooks/generateQRCode.ts`, `link-shortener/hooks/deleteQRCode.ts`
  - Collection-specific `beforeChange`, `afterChange` logic
- **Helpers**: Same level as `index.ts`
  - Example: `salary-deduction/email-template.ts`, `business-justifications/email-template.ts`
  - Import: `import { generateEmail } from './email-template'`

#### 2. **Shared Code** (goes in `src/common/`)

- **Components**: `src/common/components/`
  - Example: `cutoff-notice`, `divider`, `slug`, `workflow-ui`
  - Used by 2+ collections
  - Import: `path: '@/common/components/cutoff-notice'`
- **Fields**: `src/common/fields/`
  - Example: `created-by.ts`, `updated-by.ts`, `workflow.ts`
  - Reusable field configurations
  - Import: `import CreatedByField from '@/common/fields/created-by'`
- **Hooks**: `src/common/hooks/`
  - Example: `operator-slug-update.ts`, `workflow-init.ts`, `workflow-update.ts`, `workflow-notification.ts`
  - Shared collection hooks
  - Import: `import { setOperatorSlugCollection } from '@/common/hooks/operator-slug-update'`

#### 3. **Business Logic** (goes in `src/services/`)

- External integrations (Microsoft Auth, H2A Oasys)
- Complex business logic shared across collections
- Import: `import { authenticateUser } from '@/services/microsoft-auth'`

#### 4. **Utilities** (goes in `src/utilities/`)

- **Access control**: `access.ts`, `access-operator.ts`, `time-based-access.ts`
- **Validations**: `validations/user-access.ts`
- **Constants**: `constant.ts`
- Import: `import { accessCheckResolver } from '@/utilities/access'`

#### 5. **Endpoints** (goes in `src/endpoints/`)

- Custom API routes outside Payload's auto-generated APIs
- Structure: `src/endpoints/<endpoint-name>/index.ts`
- Example: `auth-microsoft/index.ts` exports `authMicrosoftEndpoint`

### Import Path Aliases (tsconfig.json)

```typescript
"@/*"              → "./src/*"
"@payload-config"  → "./src/payload.config.ts"
```

### Decision Tree: Where to Put Code?

**Component/Hook/Helper:**

1. Used by only ONE collection? → `src/collections/<name>/components|hooks/`
2. Used by 2+ collections? → `src/common/components|hooks|fields/`

**Business Logic:**

1. External service integration? → `src/services/`
2. Access control/validation? → `src/utilities/`
3. Collection-specific email template? → Same level as collection `index.ts`

**Example Patterns:**

```typescript
// ✅ Collection-specific component
// File: src/collections/public/hr-requests/components/type-select.tsx
import { fetchRequestLetterTypesAction } from "./actions";

// ✅ Shared field used by multiple collections
// File: src/collections/public/hr-requests/index.ts
import CreatedByField from "@/common/fields/created-by";
import { WorkflowFields } from "@/common/fields/workflow";

// ✅ Shared hook for operator slug generation
import { setOperatorSlugCollection } from "@/common/hooks/operator-slug-update";

// ✅ Utility for access control
import { accessCheckResolver } from "@/utilities/access";

// ✅ Service for external integration
import { authenticateUser } from "@/services/microsoft-auth";
```

## Key Files & Directories

### Root

- `TASKS.md`: Jira-style task tracker (statuses: Merged, Review, In progress)
- `package.json`: Root scripts (`yarn dev`, `yarn push:production`, `yarn start:production:public`)
- `README.md`: Nginx SSL/proxy config examples

### Backend V3 (`apps/backend-admin-v3/`)

- `payload.config.ts`: Main config (collections, globals, endpoints, plugins)
- `src/collections/public/`: Public-facing forms (hr-requests, business-justifications, salary-deduction)
- `src/common/hooks/operator-slug-update.ts`: Auto-slug generation hook
- `src/endpoints/auth-microsoft/`: Azure AD SSO endpoints
- `src/seed/`: Database seeders (workflow, users)
- `vitest.config.mts`, `playwright.config.ts`: Test configs

### Frontend (`apps/frontend/`)

- `src/components/form/`: Form components per feature (20+ forms)
- `src/utils/contents.ts`: Bilingual translations
- `src/hooks/use-payload.ts`: Payload API client hook

### Scripts

- `scripts/production/init-backend-admin-v3.sh`: V3 deploy script (install, build, migrate, pm2)
- `scripts/common/git-push-production.sh`: Merge dev → production
- `scripts/common/init-app.sh`: Orchestrates all deployment scripts

### Misc

- `misc/emp_question_new_add.js`: Bulk add employee survey questions (requires API key)
- `rest/`: VS Code REST Client files for API testing

## Critical Patterns for AI Agents

### Adding New Collections (V3)

1. Create `src/collections/<name>/index.ts` with `CollectionConfig`
2. Add to `payload.config.ts` collections array
3. Run `yarn generate:types` to update types
4. Create migration: `yarn payload migrate:create`
5. Test access controls with `rest/local/<name>.http`

### Workflow-Enabled Collections

- Extend from `hr-requests` pattern: cutoff notice UI, workflow status field, time-based access
- Link to global settings: `settingsSlug: '<collection>-settings'`
- Implement `getWorkflowSlug` in hooks

### Multi-tenant Data

- Always include `operator` (relation) and `operator_slug` (text) fields
- Use `setOperatorSlugCollection('slug')` hook in `beforeValidate`
- Filter queries by `operator_slug` in access controls

### Deployment

- **Never** commit `.env` files
- Test migrations locally before production
- PM2 process names: `do-app-backend-admin-v3`, `do-app-backend-admin`, `do-app-github-webhook`
- Update `TASKS.md` with task ID, description, status

### Prefer Backend V3

- All new features go in V3 (legacy is frozen)
- Migrate legacy collections incrementally
- Use yarn for all applications (including V3)

### Key Implementation Details

- **Workflow Status Management**: Collections use `_workflow_status` field for internal tracking and `workflow_status` for UI display
- **Access Control**: Complex access logic uses `accessCheck` function with `accessCheckResolver` for fine-grained permissions
- **Multi-tenancy**: All public collections have `operator` relation and `operator_slug` fields for tenant isolation
- **Time-based Access**: `checkTimeBasedAccess` function enforces cutoff times for workflow submissions
- **Email Templates**: Collection-specific email templates are defined in `email-template.ts` files within collection directories
- **Custom Endpoints**: Azure AD SSO implemented in `src/endpoints/auth-microsoft/`
- **Shared Hooks**: Common hooks like `workflowInit`, `workflowUpdate`, and `workflowNotification` are reused across collections
