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
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: bcryptjs + express-session + connect-pg-simple
- **Frontend**: React + Vite + wouter + TanStack Query + shadcn/ui + Tailwind v4
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/api-server` — Express API at `/api`
- `artifacts/club-portal` — Web app at `/`
- `artifacts/mockup-sandbox` — Design sandbox at `/__mockup`

## MU Club Portal — Key Features

- Multi-role auth (Student / Faculty / Club Admin / System Overseer); seeded overseer is `admin / admin123`.
- 13 pre-seeded MU clubs (no user-created clubs): MU Islamic Society, MU CSE Society, MU Sports Club, MU Research Society, MU Hult Prize, MU Cultural Club, MU MUN, MU Cycling Association, MU Photographic Society, MU Robotics Club, SWE Innovators Forum, MU Debating Club, MUGAS.
- Club detail pages: Overview, Members (with leadership roles), Events (RSVP), Posts, Notices, Achievements, Gallery.
- Join/approve flow: admin sees full member details (name, email, student ID, department).
- Event creation + overseer approval, university + club notices (club admins can publish to their own club).
- Presigned-URL image uploads via Replit App Storage (GCS-backed, `PRIVATE_OBJECT_DIR` set).
- Overseer can create new clubs with an optional admin account assigned at creation time.
- Role-aware dashboard (`/dashboard`).

## Recent Changes (May 2026)

- **Critical Fix**: Removed MongoDB startup requirement from `artifacts/api-server/src/index.ts`. All routes use PostgreSQL/drizzle-orm; MongoDB was unused but blocking server startup.
- **Batch Field**: Added `batch` column to `usersTable`, OpenAPI spec (RegisterBody, User, JoinRequest), auth route, clubs route, serializers, registration form (shown for Student role), and join request display in Club Admin dashboard.
- **Join Request Display**: Club Admin dashboard shows Member ID, Email, Department, and Batch — all clearly labeled, color-coded, with "Not provided" fallback.
- **Image Upload Fixed**: Provisioned Replit Object Storage (GCS bucket) — `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, and `PRIVATE_OBJECT_DIR` env vars are now set. Upload endpoint (`POST /api/storage/uploads/request-url`) returns valid presigned GCS URLs.
- **Gallery/Media Upload**: Works now that object storage is provisioned. `ImageUploadField` component handles the two-step presigned-URL flow (request URL → PUT to GCS).
- **Overseer Create Club**: Fully functional (was always in backend, now confirmed working with DB seeded).
- **UI/UX Overhaul**: Vibrant indigo-violet primary theme, enhanced home hero, colorful stats banner, modern club cards with gradient covers, improved notices page with color-coded badges, better header navigation with active state highlighting.
- **`.env.example`**: Created at project root with all required variables and local setup instructions.

## Important Notes (api-zod)

`lib/api-zod/src/index.ts` is **manually managed** — do NOT restore `export * from "./generated/types"`. The Zod codegen generates both `generated/api.ts` (Zod schemas) and `generated/types/` (TypeScript interfaces) with the same export names for request bodies, causing TypeScript ambiguity errors. The `index.ts` selectively re-exports only enum const objects from `generated/types/` that aren't duplicated in `api.ts`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/api-server run seed` — re-seed users, clubs, members, events, posts, notices

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
