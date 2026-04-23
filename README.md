# Basalt Arena

Веб-приложение с фронтендом на React (Vite) и mock API на Express для разработки интерфейсов, авторизации, профиля, главного экрана и зала славы.

## Стек
- Frontend: React, React Router, Tailwind CSS, Vite
- Backend: Node.js, Express, CORS
- Монорепо через npm workspaces (`client`, `server`)

## Структура проекта
- `client` — фронтенд приложение
- `server` — API и раздача собранного фронта в production режиме
- `main.py` — отдельный локальный python-скрипт (не участвует в работе сайта)

## Быстрый старт (локально)
1. Установить зависимости:
   - `npm install`
2. Запустить фронт и сервер вместе:
   - `npm run dev`
3. Открыть:
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
  - `npm run dev` / `npm run dev:watch` / `npm run start`

## Переменные окружения
Скопируйте `.env.example` в `.env` и заполните значения.

- `BASALT_DEV_REGISTER_KEY` — dev-ключ для регистрации через mock API
- `OPENROUTER_API_KEY` — используется только в `main.py`
- `PORT` — порт сервера (по умолчанию `3001`)

## API
Сервер поднимает mock API по префиксу:
- `/api/mock/v1`

Основные группы эндпоинтов:
- `auth` — вход/выход/регистрация (регистрация защищена dev-ключом)
- `v2/me` — данные текущего пользователя
- `v2/sprints` — список/детали спринтов и связанные данные
- `v2/meta` — мета-информация приложения

## Сборка и production
1. Собрать фронт:
   - `npm run build`
2. Запустить сервер:
   - `npm run start`

Если есть `client/dist`, сервер автоматически раздает статику и SPA-роуты.

Ссылка - `https://basalt-arena.onrender.com`
