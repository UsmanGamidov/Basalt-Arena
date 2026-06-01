# Basalt Arena — API

Префикс: **`/api/mock/v1`**  
Swagger (локально): http://localhost:3001/api/docs

## Авторизация

| Метод | Путь | Тело | Ответ |
|-------|------|------|--------|
| POST | `/auth/login` | `{ loginOrEmail, password, remember? }` | `{ accessToken, refreshToken?, user }` |
| POST | `/auth/refresh` | `{ refreshToken }` | новая пара токенов |
| POST | `/auth/logout` | Bearer + опционально `{ refreshToken }` | `{ ok: true }` |
| POST | `/auth/register` | + заголовок `x-dev-register-key` | как login |

Заголовок: `Authorization: Bearer <accessToken>`.

Access живёт **15 минут**, refresh — **30 дней** (opaque UUID в `AuthToken`). Сессия проверяется по `jti` в JWT и записи в БД.

## Участник (`/v2`)

- `GET /v2/meta` — маркетинг, версия, число спринтов
- `GET /v2/me` — профиль, sprintContext, stats, notifications, история
- `PATCH /v2/me/profile` — `{ form: { username?, email?, telegram?, about? } }`
- `POST /v2/me/notifications/read`
- `GET /v2/sprints?limit&offset` — зал славы
- `GET /v2/sprints/:id` — детали + solutions
- `GET /v2/sprints/:id/submissions/active` — текущая отправка (auth)
- `POST /v2/sprints/:id/submissions` — `{ repoUrl, demoUrl? }`
- `POST /v2/submissions` — в активный main-спринт
- `DELETE /v2/submissions/:id`
- `POST /v2/sprints/:id/solutions/:solutionId/like`

### Очки и ранг

- **Очки** = сумма `mentorScore` по `Solution` пользователя (хранятся в `User.points`).
- **Глобальный ранг** и **число пройденных спринтов** считаются при отдаче API (не из устаревших колонок БД).
- Балл в истории `approved` submission берётся из solution, если есть.

## Админ (`/admin/*`, роль `admin`)

- Пользователи: list (пагинация), create, patch, delete
- Спринты: CRUD, `isMainActive`, участники, приз `prizeMoney`
- Отправки: list, review (`approve` + mentorScore), delete
- Решения в зале: CRUD, ранги
- Ачивки: definitions + выдача
- `GET /admin/logs`

`completedLabel` в ответах строится из `endsAt` (таймер). Поле в БД не используется для UI.

Активный спринт: один с `isMainActive: true`. Отправка — только зачисленным (`SprintEnrollment`) до дедлайна.
