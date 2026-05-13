# Basalt Arena CMS (Strapi)

## Назначение

Strapi используется как административный слой:

- спринты и их доступы,
- пользователи и баллы,
- ачивки,
- решения и оценки наставника.

Публичный клиент не ходит напрямую в Strapi: внешний контракт публикует BFF.

## Запуск

1. Поднять Postgres (локально или через `docker compose`).
2. В корне репозитория:
   - `npm install`
   - `npm run dev -w cms`
3. Открыть `http://localhost:1337/admin` и создать первого администратора.

## Основные схемы

- `src/api/sprint/content-types/sprint/schema.json`
- `src/api/submission/content-types/submission/schema.json`
- `src/api/achievement/content-types/achievement/schema.json`
- `src/api/solution-like/content-types/solution-like/schema.json`
- `src/api/sprint-access/content-types/sprint-access/schema.json`
- `src/extensions/users-permissions/content-types/user/schema.json`

## Рекомендованные роли

- `Admin`: управление всеми сущностями, начисление баллов, выдача ачивок.
- `Mentor`: оценка решений (`mentorScore`), изменение статусов submission.
- `Participant`: read-only в публичной части, submit через BFF.
