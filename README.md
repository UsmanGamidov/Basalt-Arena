# Basalt Arena

Платформа соревновательных спринтов: участники отправляют решения, наставники проверяют работы, лучшие попадают в зал славы. Есть профиль, рейтинг, призовые и админ-панель.

**Прод:** [basalt-arena.onrender.com](https://basalt-arena.onrender.com)

## Стек

- **Frontend:** React, React Router, Tailwind, Vite (`client/`)
- **Backend:** NestJS, Prisma, JWT (`server/`)
- **БД:** SQLite локально, PostgreSQL на проде (Supabase)
- **Монорепо:** npm workspaces

## Структура

```text
client/     — SPA
server/     — API + Prisma
scripts/    — smoke-тесты API
docs/api.md — краткий контракт эндпоинтов
```

## Быстрый старт

```bash
npm install
cp server/.env.example server/.env   # заполнить JWT_SECRET и BASALT_DEV_REGISTER_KEY
npm run dev
```

| URL | |
|-----|---|
| http://localhost:5173 | фронт (прокси `/api` → :3001) |
| http://localhost:3001/health | healthcheck |
| http://localhost:3001/api/docs | Swagger |

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

Вход на `/login` по email или handle.

## Переменные окружения

Шаблон: [`server/.env.example`](server/.env.example).

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | `file:./dev.db` локально; PostgreSQL URI на проде |
| `JWT_SECRET` | Секрет JWT (обязателен в production) |
| `BASALT_DEV_REGISTER_KEY` | Ключ для `POST /auth/register` |
| `BASALT_CORS_ORIGIN` | Разрешённые origin (прод) |
| `BASALT_BOOTSTRAP_ADMIN_*` | Создание первого admin |

## Команды

| Команда | |
|---------|---|
| `npm run dev` | фронт + сервер |
| `npm run build` | сборка клиента |
| `npm run build:render` | сборка для Render |
| `npm run start` | production-сервер |
| `npm test` | тесты клиента |
| `npm run test:server:unit` | тесты сервера |
| `npm run test:server:api` | интеграционный тест API |

## API

Префикс: `/api/mock/v1` · Swagger: `/api/docs`

- `auth` — login, register, refresh, logout
- `v2` — meta, профиль, спринты, отправки
- `admin` — управление (роль admin)

Подробнее: [`docs/api.md`](docs/api.md).

## Деплой (Render + Supabase)

**Build:** `npm run build:render`  
**Start:** `npm run start`

Переменные на Render: `DATABASE_URL`, `JWT_SECRET`, `BASALT_CORS_ORIGIN`, `NODE_ENV=production`.

После первого деплоя с пустой БД:

```bash
npm run bootstrap:admin:remote -w server
```

(нужен postgres `DATABASE_URL` в `server/.env`).

## Безопасность

Не коммитить `.env` и `*.db`. В production — сильный `JWT_SECRET` и конкретный `BASALT_CORS_ORIGIN`.
