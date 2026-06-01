# Basalt Arena

Платформа соревновательных спринтов по разработке. Участники зачисляются в спринт, отправляют репозиторий и демо; наставник проверяет работу и выставляет балл — лучшие решения попадают в зал славы. Есть профиль со статистикой, рейтинг, призовые и админ-панель.

**Прод:** [basalt-arena.onrender.com](https://basalt-arena.onrender.com)

## Возможности

- **Спринты** — один активный спринт на главной, история и зал славы с пагинацией.
- **Отправки** — репозиторий + демо, валидация ссылок, статусы (на проверке / принято / отозвано / удалено).
- **Проверка** — наставник одобряет отправку, выставляет балл (0–100), участник получает уведомление.
- **Зал славы** — топ решений по баллу и лайкам, ранги и призовые после дедлайна.
- **Профиль** — баллы, глобальный ранг, пройденные спринты, заработок, ачивки, in-app уведомления.
- **Realtime** — мгновенные обновления зала/лидерборда/статусов через SSE (`GET /v2/events`), с поллингом как фолбэком.
- **Админка** — пользователи, спринты, зачисления, проверка отправок, решения, каталог ачивок, журнал действий.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 19, React Router 7, Tailwind 4, Vite 8 |
| Backend | NestJS 11, class-validator, Swagger |
| ORM / БД | Prisma 6 · SQLite локально, PostgreSQL на проде (Supabase) |
| Auth | JWT access (15 мин) + refresh (30 дней, в БД), bcrypt |
| Монорепо | npm workspaces (`client`, `server`) |
| Деплой | Render (один сервис: API + статика клиента) |

## Архитектура

Один сервис NestJS отдаёт REST API и статику собранного клиента. Весь API под префиксом `/api/mock/v1` (вне префикса только `/health`).

- **HTTP-модули:** `auth` (логин/refresh/logout), `v2` (участник), `admin` (под `AdminGuard`).
- **Domain-сервисы** (`CoreModule`, `@Global`): бизнес-логика разбита по зонам — пользователи, спринты, отправки, решения, призовая логика, уведомления, аудит.
- **Guards:** `AuthGuard` → `req.basaltUser`, `OptionalAuthGuard` (публичные эндпоинты с опциональным пользователем), `AdminGuard` → `req.basaltAdmin`.
- **Realtime через SSE:** доменные сервисы публикуют событие «данные изменились», эндпоинт `GET /v2/events` транслирует его клиентам (без Redis/WebSocket — один сервис).
- **Производные метрики** (`globalRank`, число пройденных спринтов) считаются на чтении, а не денормализуются в БД.
- **Призовые** начисляются победителю автоматически после дедлайна (фоновый тик + пересчёт на чтении).
- Ошибки проходят через `GlobalExceptionFilter` — клиенту не уходит stack/Prisma-детали.

## Структура

```text
client/         — SPA (pages, components, hooks, api-клиент)
server/
  prisma/       — schema.prisma (SQLite) + schema.postgres.prisma (PostgreSQL)
  src/
    modules/    — HTTP-контроллеры: auth, v2, admin
    domain/     — бизнес-логика (домен-сервисы)
    auth/       — сессии и JWT
    common/     — guards, filters, presenters, utils, constants
scripts/        — smoke-тесты API и обслуживающие скрипты
docs/api.md     — краткий контракт эндпоинтов
```

## Быстрый старт

```bash
npm install
cp server/.env.example server/.env   # заполнить JWT_SECRET и BASALT_DEV_REGISTER_KEY
npm run dev
```

| URL | |
|-----|---|
| http://localhost:5173 | фронтенд (прокси `/api` → :3001) |
| http://localhost:3001/health | healthcheck |
| http://localhost:3001/api/docs | Swagger UI |

### Первый администратор

В `server/.env`:

```env
BASALT_BOOTSTRAP_ADMIN_HANDLE=admin
BASALT_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BASALT_BOOTSTRAP_ADMIN_PASSWORD=ваш-пароль
```

```bash
npm run bootstrap:admin -w server
```

Вход на `/login` по email или handle. Саморегистрация (`POST /auth/register`) включается только при заданном `BASALT_DEV_REGISTER_KEY` и требует одноимённый заголовок.

## Переменные окружения

Шаблон: [`server/.env.example`](server/.env.example).

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | `file:./dev.db` локально; PostgreSQL URI на проде |
| `JWT_SECRET` | Секрет JWT — **обязателен в production** (иначе сервер не стартует) |
| `BASALT_DEV_REGISTER_KEY` | Ключ для `POST /auth/register` (без него регистрация отключена) |
| `BASALT_CORS_ORIGIN` | Разрешённые origin через запятую (прод) |
| `BASALT_APP_BUILD`, `BASALT_PRIZE_*` | Метаданные для `GET /v2/meta` (опционально) |
| `BASALT_BOOTSTRAP_ADMIN_*` | Создание первого администратора |

## Команды

| Команда | Действие |
|---------|----------|
| `npm run dev` | клиент + сервер в режиме разработки |
| `npm run build` | сборка клиента |
| `npm run build:render` | сборка для Render (клиент + Prisma postgres + сервер) |
| `npm run start` | production-сервер |
| `npm test` | unit-тесты клиента |
| `npm run test:server:unit` | unit-тесты сервера (Jest + утилиты) |
| `npm run test:server:api` | интеграционный smoke-тест API |

## API

Префикс `/api/mock/v1` · Swagger `/api/docs` · контракт [`docs/api.md`](docs/api.md).

- `auth` — login, register, refresh, logout
- `v2` — meta, профиль, спринты, отправки, лайки
- `admin` — управление платформой (роль admin)

> Префикс `/mock` исторический — это полноценный бэкенд на Prisma и JWT, не мок.

## Тестирование

```bash
npm test                  # клиент (node:test)
npm run test:server:unit  # сервер (Jest)
npm run test:server:api   # интеграционный прогон API
```

CI (GitHub Actions) гоняет линт/сборку клиента и серверные тесты на каждый push.

## Миграции БД

Прод (PostgreSQL) использует версионируемые **Prisma-миграции** (`server/prisma/migrations/`):

- `prisma:deploy:postgres` применяет миграции на деплое. Скрипт самобейзлайнящийся: на свежей БД применяет всё, на существующей БД из `db push` — помечает `0_init` как применённую и катит только новое.
- Новую миграцию сгенерировать офлайн (без локального Postgres): обновите `schema.postgres.prisma`, затем `npm run prisma:migrate:diff:postgres -w server` и сохраните вывод в `prisma/migrations/<timestamp>_<name>/migration.sql`.

Локальная разработка работает на SQLite через `prisma db push` (нулевые внешние зависимости).

## Деплой (Render + Supabase)

- **Build:** `npm run build:render` (применяет миграции через `migrate deploy`).
- **Start:** `npm run start`
- **Env на Render:** `DATABASE_URL` (Supabase), `JWT_SECRET`, `BASALT_CORS_ORIGIN`, `NODE_ENV=production`.

После первого деплоя с пустой БД создать администратора:

```bash
npm run bootstrap:admin:remote -w server   # нужен postgres DATABASE_URL в server/.env
```

## Соглашения для разработки

- Минимальные диффы в стиле существующих сервисов.
- Не коммитить `.env` и `*.db`.
- Новые эндпоинты — DTO + class-validator (+ Swagger по возможности).
- Админские действия логируются через журнал аудита.
- Изменения схемы — **в обеих** схемах Prisma (SQLite и PostgreSQL) + сгенерировать миграцию (`prisma:migrate:diff:postgres`).
- В production задавать сильный `JWT_SECRET` и конкретный `BASALT_CORS_ORIGIN`.
