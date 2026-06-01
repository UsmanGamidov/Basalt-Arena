# Basalt Arena

Платформа соревновательных спринтов по разработке: участники сдают решения (репозиторий + демо), наставники проверяют работы, лучшие попадают в **зал славы**, начисляются баллы, призовые и достижения. Админка управляет спринтами, зачислениями, проверкой и контентом.

**Прод:** [basalt-arena.onrender.com](https://basalt-arena.onrender.com)

---

## Что внутри

| Часть | Назначение |
|--------|------------|
| **Главная** (`/`) | Активный спринт (`isMainActive`), бриф, таймер до дедлайна, отправка решения |
| **Зал славы** (`/hall`) | Список спринтов, топ решений, лайки, пагинация |
| **Профиль** (`/profile`) | Статистика, история отправок, уведомления, редактирование профиля |
| **Админка** (`/admin`) | Пользователи, спринты, зачисления, проверка отправок, решения в зале, ачивки, журнал действий |
| **API** | REST под префиксом `/api/mock/v1` (историческое имя «mock» — бэкенд полноценный, с БД) |

---

## Стек

### Frontend (`client/`)

- **React 19** + **React Router 7**
- **Vite 8** — dev-сервер и сборка
- **Tailwind CSS 4** — стили
- Запросы к API через `client/src/api/basaltApi.js` (Bearer + авто-refresh при 401)

### Backend (`server/`)

- **NestJS 11** — модули, guards, validation pipe, Swagger
- **Prisma 6** — ORM
- **SQLite** — локальная разработка (`server/prisma/dev.db`)
- **PostgreSQL** — продакшен (Supabase + Render)
- **JWT** — access 15 мин + opaque refresh 30 дней, сессии в таблице `AuthToken`
- **bcrypt** — хеши паролей
- **@nestjs/throttler** — rate limit на login/register
- **class-validator** — валидация DTO

### Инфраструктура

- **npm workspaces** — монорепо `client` + `server`
- **GitHub Actions** — CI (тесты, сборка, smoke + integration API)
- **Render** — хостинг (один Web Service: API + статика фронта)
- **Supabase** — managed PostgreSQL (Session pooler URI)

---

## Архитектура

```text
basalt-arena/
├── client/                 # SPA (React)
│   └── src/
│       ├── pages/          # Main, Hall, Profile, Login, Admin
│       ├── auth/           # AuthProvider, guards маршрутов
│       ├── api/            # basaltApi.js
│       └── components/     # UI + admin panels
├── server/                 # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma           # SQLite (локально)
│   │   └── schema.postgres.prisma  # PostgreSQL (прод)
│   └── src/
│       ├── modules/
│       │   ├── auth/       # login, register, refresh, logout
│       │   ├── v2/         # публичное API участника
│       │   └── admin/      # API админки
│       ├── domain/         # бизнес-логика (сервисы)
│       ├── auth/           # AuthService, AuthSessionService
│       └── common/         # guards, filters, presenters, utils
├── scripts/                # интеграционные тесты API (Node)
└── docs/api.md             # краткий контракт эндпоинтов
```

### Серверные сервисы (основное)

| Сервис | Задача |
|--------|--------|
| `AuthService` / `AuthSessionService` | Логин, регистрация, refresh, отзыв JWT по `jti` в БД |
| `UsersService` | Профиль, уведомления, карточки статистики |
| `SprintsService` | Зал славы, детали спринта |
| `SubmissionsService` | Отправки участников |
| `SolutionsService` | Лайки решений |
| `AdminService` | Вся админская логика |
| `PrizeSettlementService` | Ранги решений в спринте, призовые после дедлайна |
| `UserDerivedStatsService` | Глобальный ранг и число спринтов **на чтении** (без рассинхрона в БД) |
| `AppBootstrapService` | Стартовые миграции данных, таймер призов |

### Авторизация

1. `POST /auth/login` → `accessToken` (15m) + `refreshToken` (30d, в БД).
2. Клиент хранит токены в `localStorage` / `sessionStorage` (`remember`).
3. При **401** клиент вызывает `POST /auth/refresh`, обновляет access.
4. `POST /auth/logout` отзывает access (`jti`) и удаляет refresh из `AuthToken`.
5. Guards: `AuthGuard`, `OptionalAuthGuard`, `AdminGuard` (роль `admin` в Prisma enum `UserRole`).

### Данные и правила

- **Очки** (`User.points`) = сумма `mentorScore` всех решений пользователя в зале (пересчёт в `PrizeSettlementService`).
- **Глобальный ранг** (`#N` / `#0`) считается при отдаче API по сортировке `points`.
- **Спринты пройдено** = число submission со статусом `approved`.
- **Призовые** (`moneyEarned`, Int, рубли) — из выигранных спринтов с `prizeMoney`.
- **Активный спринт** — ровно один с `isMainActive: true`; отправка только при зачислении (`SprintEnrollment`) и до `endsAt`.
- **Подпись спринта** (`completedLabel`) везде из `endsAt` (таймер / «Спринт завершён»), не из ручного поля в БД.

---

## Требования

- **Node.js 22+** (как в CI)
- **npm 10+**

---

## Быстрый старт (локально)

```bash
# 1. Зависимости
npm install

# 2. Конфиг сервера
cp server/.env.example server/.env
# Минимум для SQLite:
#   DATABASE_URL="file:./dev.db"
#   JWT_SECRET="любой-длинный-секрет-для-локалки"
#   BASALT_DEV_REGISTER_KEY="dev-key"

# 3. Фронт + API (Prisma push + generate выполняются автоматически)
npm run dev
```

Открыть:

| URL | Описание |
|-----|----------|
| http://localhost:5173 | Vite (фронт), прокси `/api` → :3001 |
| http://localhost:3001/health | Healthcheck |
| http://localhost:3001/api/docs | Swagger OpenAPI |
| http://localhost:3001/api/mock/v1/... | API |

### Ошибка входа: `moneyEarned` / «20 000 ₽»

Если после обновления схемы логин падает с Prisma `Could not convert value "… ₽" to type Int` — в SQLite остались старые строки в `moneyEarned`.

1. Перезапустите сервер (`npm run dev`) — при старте выполняется raw-миграция.
2. Или вручную: `npm run fix:money-earned`

### Первый администратор

В `server/.env` задать:

```env
BASALT_BOOTSTRAP_ADMIN_HANDLE=admin
BASALT_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BASALT_BOOTSTRAP_ADMIN_PASSWORD=надёжный-пароль
```

```bash
npm run bootstrap:admin -w server
```

Войти на `/login` с email или handle админа.

### Регистрация участника (dev)

`POST /api/mock/v1/auth/register` с заголовком `x-dev-register-key: <BASALT_DEV_REGISTER_KEY>` (значение из `.env`). Без ключа регистрация отключена.

---

## Переменные окружения

Шаблон: [`server/.env.example`](server/.env.example).

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `PORT` | нет (3001) | Порт NestJS |
| `DATABASE_URL` | да | Локально: `file:./dev.db`. Прод: PostgreSQL URI (Supabase pooler) |
| `JWT_SECRET` | да в prod | Секрет подписи access JWT (64+ символов) |
| `BASALT_DEV_REGISTER_KEY` | да для register | Dev-ключ саморегистрации |
| `BASALT_CORS_ORIGIN` | прод | Origin фронта через запятую или пусто/`true` локально |
| `BASALT_APP_BUILD` | нет | Строка версии в `GET /v2/meta` |
| `BASALT_PRIZE_POOL_SHORT` | нет | Маркетинг в meta (например `120K`) |
| `BASALT_PRIZE_CURRENCY` | нет | Валюта в meta (например `₽`) |
| `BASALT_BOOTSTRAP_ADMIN_*` | для bootstrap | Создание первого admin |

Клиент в dev: прокси Vite на `localhost:3001`. В production фронт и API на одном домене — `VITE_API_BASE_URL` можно не задавать (относительные `/api/...`).

---

## Команды

### Корень

| Команда | Действие |
|---------|----------|
| `npm run dev` | `client` (Vite) + `server` (Nest watch), подготовка Prisma |
| `npm run build` | Сборка фронта в `client/dist` |
| `npm run build:render` | Фронт + Prisma postgres + сборка сервера (деплой Render) |
| `npm run start` | Production: `node server/dist/main.js` (нужен собранный client) |
| `npm test` | Юнит-тесты клиента (Node test runner) |
| `npm run test:server:unit` | Сборка + money/auth скрипты + Jest на сервере |
| `npm run test:server:health` | GET `/health` |
| `npm run test:server:api` | Полный integration flow на временной SQLite БД |

### `server/`

| Команда | Действие |
|---------|----------|
| `npm run dev` | Nest watch |
| `npm run build` | `nest build` → `dist/` |
| `npm run start` | Запуск `dist/main.js` |
| `npm run test` | Jest (`*.spec.ts`) |
| `npm run prisma:push` | Схема → SQLite |
| `npm run prisma:generate` | Prisma Client |
| `npm run prisma:push:postgres` | Схема → PostgreSQL (прод) |
| `npm run bootstrap:admin` | Первый admin (локальная схема) |
| `npm run bootstrap:admin:remote` | Bootstrap с `schema.postgres.prisma` |

### `client/`

| Команда | Действие |
|---------|----------|
| `npm run dev` | Vite :5173 |
| `npm run build` | `client/dist` |
| `npm run lint` | ESLint |

---

## API

- **Префикс:** `/api/mock/v1`
- **Health:** `GET /health` (вне префикса)
- **Swagger:** `GET /api/docs`

### Группы

| Префикс | Доступ | Содержание |
|---------|--------|------------|
| `/auth` | публичный + throttling | `login`, `register`, `refresh`, `logout` |
| `/v2` | участник / опционально anon | `meta`, `me`, `sprints`, submissions, likes |
| `/admin` | Bearer + роль `admin` | users, sprints, submissions, solutions, achievements, logs |

Подробнее: [`docs/api.md`](docs/api.md).

### Rate limits

- Login: **5** запросов / минуту
- Register: **3** запроса / час
- Общий лимит модуля: 120 / мин

---

## Тесты и CI

Локально перед деплоем:

```bash
npm test
npm run test:server:unit
npm run test:server:api
```

GitHub Actions (`.github/workflows/ci.yml`): на push/PR в `main`/`master` — client tests, build client/server, health + full API integration test.

---

## Production-сборка

```bash
# 1. Собрать фронт
npm run build

# 2. Для PostgreSQL (Render): сгенерировать клиент и применить схему
npm run prisma:generate:postgres -w server
npm run prisma:push:postgres -w server

# 3. Собрать сервер
npm run build -w server

# 4. Запуск (раздаёт client/dist + API)
npm run start
```

Одной командой под Render:

```bash
npm run build:render
npm run start
```

После первого деплоя с пустой БД — создать админа (на машине с доступом к prod `DATABASE_URL`):

```bash
# в server/.env — postgres DATABASE_URL
npm run bootstrap:admin:remote -w server
```

---

## Деплой на Render + Supabase

### 1. Supabase

1. Создать проект PostgreSQL.
2. Взять **Session pooler** connection string (`postgresql://...pooler.supabase.com:5432/postgres?sslmode=require`).
3. Сохранить в секреты Render как `DATABASE_URL`.

### 2. Render Web Service

- **Build Command:** `npm run build:render`
- **Start Command:** `npm run start`
- **Environment:**
  - `DATABASE_URL` — из Supabase
  - `JWT_SECRET` — новый длинный секрет
  - `BASALT_DEV_REGISTER_KEY` — новый ключ (или отключить register в проде, оставив пустой ключ — register вернёт 401)
  - `BASALT_CORS_ORIGIN` — `https://<your-service>.onrender.com`
  - `NODE_ENV=production`
  - опционально `BASALT_APP_BUILD`, `BASALT_PRIZE_*`, bootstrap-переменные для одноразового admin

### 3. Git

```bash
git add .
git commit -m "..."
git push origin main
```

Подключить репозиторий к Render (auto-deploy с ветки `main`).

### 4. После деплоя

- Проверить `https://<host>/health`
- Открыть `https://<host>/api/docs`
- Залогиниться админом (bootstrap)
- Убедиться, что старые JWT без refresh недействительны — пользователям нужен re-login

---

## Безопасность

- Не коммитить `.env`, `*.db`, ключи.
- В production обязателен сильный `JWT_SECRET`.
- Ограничить `BASALT_CORS_ORIGIN` своим доменом (не `*` с credentials).
- Регистрация только с `BASALT_DEV_REGISTER_KEY` — в проде ключ не публиковать.
- Пароли только как bcrypt-хеш в БД.
- Access-токены отзываются при logout; refresh хранится в `AuthToken` и ротируется при refresh.

---

## Устаревшие файлы

В `server/` остались **`index.js`** и **`mock-api.js`** — старый Express-прототип. **Продакшен и `npm run dev` используют NestJS** (`server/src/main.ts`). Эти файлы можно удалить после проверки, что никто не запускает `node server/index.js`.

---

## Лицензия и контакты

Приватный учебный/продуктовый проект Basalt Arena. Вопросы по API — Swagger и `docs/api.md`.
