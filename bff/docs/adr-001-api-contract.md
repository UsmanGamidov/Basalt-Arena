# ADR-001: API Contract and Domain Invariants

## Status
Accepted

## Context
- Frontend already depends on a stable data shape for auth, profile, hall of fame, sprint submissions, and metrics.
- Strapi admin API is useful for content management, but should not leak internal model shape to the public client contract.

## Decision
- Public contract is versioned REST: `/api/v1/*`.
- BFF owns DTO mapping and validation, and is the only API used by the React client.
- Strapi is the source of truth for entities and admin workflows; BFF wraps and normalizes data.

## Invariants
1. `solution` like is idempotent: one user can like a solution at most once.
2. `submission` requires `repoUrl`; `demoUrl` is optional.
3. Hall sorting is deterministic:
   - `efficiency`: by `mentorScore` desc, then `likes` desc.
   - `likes`: by `likes` desc, then `mentorScore` desc.
4. Auth tokens are Bearer JWT and can be revoked through logout.
5. Error responses follow `{ code, message, details? }`.

## Consequences
- Frontend integration remains stable even if Strapi model changes.
- Additional endpoints can evolve behind `/api/v2` without breaking existing clients.
