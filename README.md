# Basalt Arena

Production-grade монорепозиторий: React-фронт (`client`), **кастомная админка** (`admin`), TypeScript REST BFF (`bff`) на Postgres + Prisma + Redis,
Strapi (`cms`) опционально для отдельного CMS-контура. Публичный фронт и админка ходят в **`/api/v1/*` BFF**.

## Архитектура

```
client (React/Vite) ─► BFF (Express/TS) ─► Postgres (Prisma, schema bff)
admin (React/Vite) ─► BFF /api/v1/admin
                                  └─────► Redis (сессии, rate-limit)
Strapi (cms, optional) ────────────────► Postgres (schema public)
```

- BFF — единственная публичная поверхность API. Слои: `routes → services → repositories → prisma`.
- Прислоняемое состояние (rate-limit, ревокация refresh-токенов) живёт в Redis.
- Strapi работает в той же базе, но в схеме `public`. BFF использует схему `bff`. Прямого пересечения схем нет.

## Workspaces

- `client` — React + Vite UI (арена)
- `admin` — React + Vite панель оператора (тема как у клиента, порт `5174`)
- `bff` — TypeScript REST API (Prisma, Argon2id, JWT access+refresh, pino, helmet, `/api/v1/admin`)
- `cms` — Strapi 4 (опционально; данные BFF не синхронизируются со Strapi автоматически)
- `server` — legacy mock backend (только для разрабов, не используется в проде)

## Быстрый старт (локально)

1. `npm install`
2. `cp .env.example .env`
3. Поднять Postgres + Redis (через Docker, например):
   - `docker compose up -d postgres redis`
4. Применить миграции и засидить данные:
   - `npm run -w bff db:migrate:dev`
   - `npm run -w bff db:seed`
5. Запустить фронт + BFF (и при необходимости админку):
   - `npm run dev` — только `client` + `bff`
   - `npm run dev:all` — `client` + `bff` + `admin`

URLs:
- Клиент арены — `http://localhost:5173`
- **Админка** — `http://localhost:5174` (логин: после `db:seed` пользователь `admin@admin.com`, пароль из `SEED_ADMIN_PASSWORD` в `.env` или `admin1234` по умолчанию в сиде)
- BFF — `http://localhost:3001/api/v1/health`
- Strapi (если поднят) — `http://localhost:1337/admin`

## Docker Compose

`docker compose up --build` поднимет postgres + redis + strapi + bff (с healthchecks
и автоматическим `prisma migrate deploy`).

## Скрипты

В корне:
- `npm run dev` — `client` + `bff`
- `npm run dev:all` — `client` + `bff` + `admin`
- `npm run dev:mock` — `client` + legacy `server`
- `npm run build` / `npm run build:all` — `bff` + `client` + `admin`
- `npm run build:client`, `npm run build:bff`, `npm run build:admin` — точечные сборки
- `npm run test` — unit-тесты BFF
- `npm run test:integration` — full-stack BFF тесты на testcontainers

В `bff/`:
- `npm run dev` — tsx watch
- `npm run build` — `tsc`
- `npm run start` — запуск собранного приложения (`dist/index.js`)
- `npm run prisma:generate` — клиент Prisma
- `npm run db:migrate` / `db:migrate:dev` / `db:seed`
- `npm run test:unit` — детерминированные unit-тесты (вне Docker, без сети)
- `INTEGRATION=1 npm run test:integration` — full-stack тесты на testcontainers (нужен Docker)

## Переменные окружения

См. `.env.example`. Критически важны для прода:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | строка подключения к Postgres |
| `REDIS_URL` | обязательна в проде |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32 символа, различаются |
| `JWT_ACCESS_TTL_SECONDS` / `JWT_REFRESH_TTL_SECONDS` | TTL access/refresh |
| `CORS_ORIGINS` | CSV origins; для локалки добавьте `http://localhost:5174` если используете явный allow-list |
| `DEV_REGISTER_KEY` | если задан — обязателен в `x-dev-register-key` для `/auth/register` |

Fail-fast: при отсутствии любых обязательных значений (или при `RATE_LIMIT_DISABLED=true` в проде) BFF
не запустится.

## API v1

OpenAPI: `bff/openapi/openapi.yaml`.

| Группа | Эндпойнты |
|---|---|
| auth | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout` |
| me | `GET /me`, `PATCH /me/profile`, `POST /me/notifications/read` |
| sprints | `GET /sprints`, `/sprints/:id`, `/sprints/:id/solutions`; `POST /sprints/:id/submissions` |
| submissions | `POST /submissions` (отправка в активный спринт) |
| solutions | `PUT /solutions/:id/like`, `DELETE /solutions/:id/like` |
| hall | `GET /hall?sortBy=efficiency\|likes\|mentor` |
| meta | `GET /meta` |
| admin | users, sprints, access, submissions, achievements, metrics, audit logs |

Все ошибки идут в формате `{ code, message, details?, requestId }`.

## Тесты

- `npm run test:unit -w bff` — чистые unit-тесты: authService (логин/регистрация/refresh/logout),
  likeService (идемпотентность), сортировка зала славы, маппинг ошибок (Zod / Prisma P2002 / AppError / Internal).
- `INTEGRATION=1 npm run test:integration -w bff` — full-stack сценарий
  `register → me → submission → like idempotency → hall → refresh rotation → logout`,
  а также проверка `409 CONFLICT` на дубликаты и админского PATCH submission. Нужен запущенный Docker (testcontainers).

## Качество и инварианты

- ADR-001 (контракт API и инварианты) — `bff/docs/adr-001-api-contract.md`.
- ADR-002 (Argon2id, access+refresh с jti rotation, Postgres+Prisma, rate-limit) — `bff/docs/adr-002-auth-and-persistence.md`.
- ADR-003 (SprintAccess, метрики спринта, кастомная админка) — `bff/docs/adr-003-sprint-access-and-admin.md`.
- Сортировка зала славы:
  - `efficiency` — `mentorScore desc, likesCount desc, createdAt asc`.
  - `likes` — `likesCount desc, mentorScore desc, createdAt asc`.
- Like — идемпотентный: `UNIQUE(userId, submissionId)` + транзакционный инкремент счётчика.
- Refresh — single-use: `jti` сразу ротируется после успешного обновления.

## Strapi админка

Контент-тайпы в `cms/src/api/*/content-types/*/schema.json`. Рекомендуем Node 18/20 (Strapi 4 не поддерживает
официально Node 22; в логах будут `EBADENGINE` предупреждения, но процесс стартует).
