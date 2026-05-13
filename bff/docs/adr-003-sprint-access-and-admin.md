# ADR-003: SprintAccess and custom admin

## Status

Accepted

## Context

The product requires per-user control over who may **submit** to a sprint and who may **view** hall/solutions for that sprint. Strapi is not the operational admin UI; a dedicated React admin shares the Basalt visual language.

## Decision

### SprintAccess model (Prisma)

- Table `SprintAccess(userId, sprintId, canSubmit, canView)` with `@@unique([userId, sprintId])`.
- **MEMBER** without a row: `canView=true`, `canSubmit=false` (safe default).
- **MEMBER** with a row: flags taken from the row.
- **ADMIN** and **MENTOR**: always treated as `canSubmit=true` and `canView=true` in `effectiveRights()` (bypass stored rows for operational freedom).

### Enforcement

- `SubmissionService` checks `canSubmit` before upsert.
- `HallService` / `sprintById` / solutions list: empty or forbidden when `canView=false`.
- `LikeService` requires `canView` on the submission’s sprint.

### Metrics

- `Sprint.metrics` JSON is recomputed after submission create/update and like/unlike, and after admin PATCH on submissions (`sprintMetricsService`).

### Admin

- REST under `/api/v1/admin/*`, **ADMIN** for users/sprints/access/achievements; **ADMIN** or **MENTOR** for submission list and PATCH.
- Separate Vite app `admin/` on port **5174**, same Tailwind theme tokens as `client/`.

## Consequences

- New registrations receive default access to the **active** sprint via `grantNewMemberActiveSprint` (can submit + view) so demos stay usable.
- Seeding grants all users access to all seeded sprints (`canSubmit` only on the active sprint).
