# Backend Admin V3 (Payload CMS)

This is the primary backend application built on Next.js 15 + Payload CMS 3.x with PostgreSQL.

## Quick Start - Local Setup

1. Copy environment variables: `cp .env.example .env` and fill in your database/API credentials.
2. Install dependencies: `yarn`
3. Start the dev server: `yarn dev` (runs on port 3015)
4. Open `http://localhost:3015/payload` for the admin panel.

### Docker (Optional)

Use Docker Compose to spin up a local PostgreSQL instance:

```bash
docker-compose up -d
```

---

## Developer Workflow

### Adding or Modifying Collections / Fields

After making schema changes (adding/removing collections, fields, globals), you **must** use the Payload CLI to keep migrations and types in sync. **Do not manually edit `payload-types.ts` or create migration files by hand.**

#### 1. Generate TypeScript Types

After any schema change, regenerate `src/payload-types.ts`:

```bash
yarn generate:types
```

> This runs `payload generate:types` and updates `src/payload-types.ts` automatically.

#### 2. Create a Database Migration

After any schema change that affects the database (adding/removing columns, tables, enums), create a migration:

```bash
yarn payload migrate:create
```

> This auto-detects schema differences and generates a timestamped migration file in `src/migrations/`.
> Commit **both** the generated `.ts` and `.json` migration files.

#### 3. Run Migrations

Apply pending migrations to your local database:

```bash
yarn migrate:latest
```

### Commit Checklist for Schema Changes

- [ ] Run `yarn generate:types` → commit the updated `src/payload-types.ts`
- [ ] Run `yarn payload migrate:create` → commit the generated migration files in `src/migrations/`
- [ ] Never hand-write migration SQL or manually edit `payload-types.ts`

---

### Adding a Sidebar Nav Icon

Nav icons are plain CSS, not a Payload field — see `CLAUDE.md` → "Admin Sidebar Nav Icons" for the full convention. Short version: drop an `icon.svg` next to a collection/global's `index.ts`, add a matching block (keyed off its actual `slug`) to `apps/backend-admin-v3/src/app/(payload)/admin-theme/_nav-icons.scss`. No icon, or a wrong slug, just means it renders label-only — nothing breaks.

---

## Running Tests

- Integration tests: `yarn test:int` (Vitest)
- E2E tests: `yarn test:e2e` (Playwright)

## Production Deployment

Migrations are applied automatically during deployment via:

```bash
yarn migrate:latest
```

See `scripts/production/init-backend-admin-v3.sh` for the full deployment sequence.

---

## Questions

If you have any issues or questions, reach out on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
