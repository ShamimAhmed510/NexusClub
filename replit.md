# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

Currently hosts the **Metropolitan University Club Management System** — a full-stack web app for browsing the 13 official MU clubs, managing memberships, posting events/notices, and running role-based dashboards (Student, Faculty, Club Admin, System Overseer).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: MongoDB + Mongoose (`@workspace/db`)
- **Validation**: Zod (via `@workspace/api-zod` — orval generated, single-mode)
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Auth**: bcryptjs + express-session + connect-mongo
- **Frontend**: React + Vite + wouter + TanStack Query + shadcn/ui + Tailwind v4
- **Build**: esbuild (ESM bundle via `build.mjs`)

## Artifacts

- `artifacts/api-server` — Express API at `/api`
- `artifacts/club-portal` — Web app at `/`
- `artifacts/mockup-sandbox` — Design sandbox at `/__mockup`

## MU Club Portal — Key Features

- Multi-role auth (Student / Faculty / Club Admin / System Overseer); seeded overseer is `admin / admin123`.
- 13 pre-seeded MU clubs. Overseer can create new clubs with an optional admin account assigned at creation time (admin email auto-set as `username@mu.edu`).
- Club detail pages: Overview, Members (with leadership roles), Events (RSVP), Posts, Notices, Achievements, Gallery.
- Join/approve flow: admin sees full member details (name, email, student ID, department).
- **Double-layer approval for Events**: Club admin creates → status `pending` → Overseer approves/rejects via dashboard. Only approved events show publicly.
- **Double-layer approval for Notices**: Club admin creates notice → status `pending` → Overseer approves/rejects via dedicated approval queue tab. Only approved notices show publicly. Overseer-created notices auto-approved.
- Notice status is exposed in the API (`status: pending | approved | rejected`) and shown in the club-admin dashboard with color-coded badges + warning banner.
- Presigned-URL image uploads via Replit App Storage (GCS-backed, `PRIVATE_OBJECT_DIR` set).
- Role-aware dashboard (`/dashboard`).

## API Design Notes

- All IDs are MongoDB ObjectId strings.
- Approve endpoints: `POST /events/{id}/approve` and `POST /notices/{id}/approve` take `{ decision: "approved" | "rejected" }` body, require overseer role.
- `serializeNotice` now includes `status` field in all notice responses.
- `NoticeBundle` type in `serializers.ts` includes optional `status?: string`.

## Codegen Notes

`lib/api-zod/src/index.ts` is **overwritten by the codegen script** — do NOT edit it manually. The Orval config uses `mode: "single"` (no `schemas` option) for the Zod target. After each Orval run, the codegen script overwrites `lib/api-zod/src/index.ts` with only `export * from "./generated/api"` to prevent barrel conflicts.

Run codegen after any OpenAPI spec change:
```
pnpm --filter @workspace/api-spec run codegen
```

## TypeScript / Mongoose Cast Pattern

Mongoose `.create()` and `.findOne().lean()` return complex typed documents. Access fields using `(doc as any).fieldName` pattern throughout api-server routes. This is consistent and correct — do NOT use `doc.fieldName as Type` directly on Mongoose Document types.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run seed` — re-seed users, clubs, members, events, posts, notices

## Deployment

- `vercel.json` at project root: SPA rewrite rules + security headers. Update the API proxy destination URL before deploying frontend to Vercel.
- API server can be deployed to Render/Railway/Fly (needs `MONGODB_URI`, `SESSION_SECRET`, `PORT`, `CORS_ORIGIN`, storage env vars).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
