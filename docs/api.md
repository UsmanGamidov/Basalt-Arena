# Basalt Arena — контракт mock API

Префикс: `/api/mock/v1`

## Авторизация

- `POST /auth/login` — `{ handle, password, rememberSession? }` → `{ accessToken, user }`
- `POST /auth/register` — dev-ключ + данные пользователя
- `POST /auth/logout` — Bearer

Заголовок: `Authorization: Bearer <token>` (JWT или legacy AuthToken).

## Участник (v2)

- `GET /v2/me` — профиль, `activeSprint`, `enrolled`, `brief`, stats, notifications
- `POST /v2/submissions` — `{ repoUrl, demoUrl? }` — только зачисленным в активный спринт; URL `http(s)://`
- `GET /v2/sprints`, `GET /v2/sprints/:id` — зал / детали спринта

### Очки и ранг

- **Очки пользователя** = сумма `Solution.mentorScore` по всем решениям.
- **Глобальный ранг** пересчитывается при изменении баллов (approve, правка решения в админке).
- Балл в истории отправок для `approved` берётся из решения, если оно есть.

## Админ (`/admin/*`, роль admin)

- CRUD спринтов, `tabLabel` / `title` (синхронизируются с префиксом `#id`)
- Зачисления: `POST /admin/sprints/:id/participants`
- Отправки, решения, пользователи, ачивки

Активный спринт на главной: `isMainActive: true` (автоматически `published: true`). Просмотр задания — всем; отправка — только зачисленным.
