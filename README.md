# Basalt Arena

Веб-приложение с фронтендом на React (Vite) и mock API на NestJS + Prisma (PostgreSQL) для разработки интерфейсов, авторизации, профиля, главного экрана и зала славы.

## Стек
- Frontend: React, React Router, Tailwind CSS, Vite
- Backend: NestJS, Prisma, PostgreSQL
- Монорепо через npm workspaces (`client`, `server`)

## Структура проекта
- `client` — фронтенд приложение
- `server` — API и раздача собранного фронта в production режиме

## Быстрый старт (локально)
1. Установить зависимости:
   - `npm install`
2. Скопировать `.env.example` в `.env` (корень и при необходимости `server/.env.example` → `server/.env`).
3. Применить схему БД и сгенерировать Prisma Client:
   - `npm run prisma:push -w server`
4. Запустить фронт и сервер вместе:
   - `npm run dev`
5. Открыть:
   - Frontend: `http://localhost:5173`
   - API server: `http://localhost:3001`

## Доступные команды
- В корне:
  - `npm run dev` — клиент + сервер одновременно
  - `npm run build` — сборка фронтенда
  - `npm run start` — запуск сервера
- В `client`:
  - `npm run dev` / `npm run build` / `npm run lint` / `npm run preview`
- В `server`:
  - `npm run dev` / `npm run build` / `npm run start`
  - `npm run prisma:push` / `npm run prisma:generate`

## Переменные окружения
Скопируйте `.env.example` в `.env` и заполните значения (см. также `server/.env.example`).

- `VITE_API_BASE_URL` — URL API для клиента (например `http://localhost:3001`)
- `PORT` — порт сервера (по умолчанию `3001`)
- `DATABASE_URL` — PostgreSQL URL для Prisma (например Supabase/Neon)
- `JWT_SECRET` — секрет для подписи access token (обязателен в production)
- `BASALT_DEV_REGISTER_KEY` — dev-ключ для регистрации через mock API
- `BASALT_CORS_ORIGIN` — разрешённые CORS origin (через запятую) или `*`

## Security перед деплоем
- Никогда не коммитьте `.env`, `.env.*`, приватные ключи и локальные `.db` файлы.
- Перед первым деплоем обязательно замените `JWT_SECRET` и `BASALT_DEV_REGISTER_KEY` на уникальные длинные значения.
- Если ключи уже утекали в историю git, сгенерируйте новые и отзовите старые.
- Для production ограничьте `BASALT_CORS_ORIGIN` конкретными доменами (не `*`).
- Используйте `npm run test:server:health` и `npm run test:server:api` как pre-deploy проверки.

## Очки и ранг
Очки пользователя = сумма `mentorScore` по решениям в зале. Глобальный ранг пересчитывается при approve отправки и правке балла в админке. Подробнее: [docs/api.md](docs/api.md).

## API
Сервер поднимает mock API по префиксу:
- `/api/mock/v1`

Основные группы эндпоинтов:
- `auth` — вход/выход/регистрация (регистрация защищена dev-ключом)
- `v2/me` — данные текущего пользователя
- `v2/sprints` — список/детали спринтов и связанные данные
- `v2/meta` — мета-информация приложения
## Тесты и CI
- Юнит-тесты (клиент): `npm test`
- GitHub Actions: workflow `.github/workflows/ci.yml` (тесты + сборка client/server)

## Сборка и production
1. Собрать фронт:
   - `npm run build`
2. Собрать и запустить сервер:
   - `npm run build -w server`
   - `npm run start -w server`
3. Если база пустая, создать первого администратора:
   - задать `BASALT_BOOTSTRAP_ADMIN_*` переменные (см. `server/.env.example`)
   - `npm run bootstrap:admin -w server`


[Ссылка на сайт](https://basalt-arena.onrender.com)
