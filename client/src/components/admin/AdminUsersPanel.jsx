import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { SortBar } from '../ui/SortBar.jsx'
import { USER_SORT_OPTIONS } from '../../lib/sortUsers.js'
import { ADMIN_USERS_PAGE_SIZE } from '../../hooks/useListPagination.js'
import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { AdminSaveButton } from './AdminSaveToolbar.jsx'
import { adminPanelClass, adminTableScrollClass } from './adminStyles.js'

const TABLE_INPUT_CLASS =
  'h-8 w-full max-w-full rounded border border-plantation bg-aztec px-2 font-mono text-xs leading-8 text-catskill'

export function AdminUsersPanel({
  newUserHandle,
  setNewUserHandle,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserDisplayName,
  setNewUserDisplayName,
  createUserBusy,
  showNewUserPassword,
  setShowNewUserPassword,
  onCreateUser,
  usersSearchQuery,
  setUsersSearchQuery,
  usersSortKey,
  setUsersSortKey,
  dirtyUserIds,
  usersSelectedIds,
  usersPagination,
  onSelectAllFilteredUsers,
  onClearUsersSelection,
  usersBulkBusy,
  onSaveDirtyUsers,
  onDeleteSelectedUsers,
  userDrafts,
  setUserDrafts,
  onToggleUserSelected,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-start xl:gap-8">
      <section className={`xl:sticky xl:top-24 ${adminPanelClass}`}>
        <AdminBlockHeader
          title="Добавление пользователя"
          icon={<MaterialIcon name="person_add" size={18} className="shrink-0 text-turquoise" />}
        />
        <p className="mb-4 mt-1 font-mono text-[11px] leading-relaxed text-gull">
          Создаётся учётная запись с паролем. Роль по умолчанию — user.
        </p>
        <form onSubmit={onCreateUser} className="flex flex-col gap-3">
          <label className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
            Handle
            <input
              value={newUserHandle}
              onChange={(e) => setNewUserHandle(e.target.value)}
              placeholder="nick"
              autoComplete="username"
              className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
            Email
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
              autoComplete="email"
              className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
            Пароль
            <span className="relative flex">
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-plantation bg-aztec py-2 pl-3 pr-10 text-sm text-catskill"
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword((v) => !v)}
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-half-baked transition hover:bg-white/5 hover:text-turquoise"
                aria-label={showNewUserPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                <MaterialIcon name={showNewUserPassword ? 'visibility_off' : 'visibility'} size={20} />
              </button>
            </span>
          </label>
          <label className="flex min-w-0 flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
            Имя (опц.)
            <input
              value={newUserDisplayName}
              onChange={(e) => setNewUserDisplayName(e.target.value)}
              className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill"
            />
          </label>
          <button
            type="submit"
            disabled={createUserBusy}
            className="h-11 w-full rounded-lg bg-turquoise px-5 font-mono text-xs font-bold text-aztec disabled:opacity-50"
          >
            {createUserBusy ? 'Создание…' : 'Создать'}
          </button>
        </form>
      </section>

      <section className={adminPanelClass}>
        <AdminBlockHeader title="Пользователи" />
        <div className="mb-3 mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[12rem] flex-1 max-w-md flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Поиск
            <input
              type="search"
              value={usersSearchQuery}
              placeholder="Ник, email, имя…"
              onChange={(e) => setUsersSearchQuery(e.target.value)}
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 font-mono text-xs text-catskill"
            />
          </label>
          <SortBar
            className="sm:mb-0 sm:flex-1 sm:max-w-sm"
            value={usersSortKey}
            onChange={setUsersSortKey}
            options={USER_SORT_OPTIONS}
          />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-gull">
            {dirtyUserIds.length > 0 ? `Несохранённых: ${dirtyUserIds.length} · ` : null}
            Выбрано: {usersSelectedIds.size}
            {usersSearchQuery.trim()
              ? ` · всего по фильтру ${usersPagination.total}`
              : ` · всего ${usersPagination.total}`}
          </span>
          <button
            type="button"
            onClick={onSelectAllFilteredUsers}
            disabled={usersPagination.total === 0}
            className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] font-bold uppercase tracking-wide text-half-baked transition hover:border-turquoise/30 disabled:opacity-40"
          >
            Выбрать всех
          </button>
          <button
            type="button"
            onClick={onClearUsersSelection}
            disabled={usersSelectedIds.size === 0}
            className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] uppercase text-gull transition hover:bg-white/5 disabled:opacity-40"
          >
            Снять выбор
          </button>
          <AdminSaveButton
            busy={usersBulkBusy === 'save'}
            dirtyCount={dirtyUserIds.length}
            onClick={onSaveDirtyUsers}
          />
          <button
            type="button"
            disabled={usersBulkBusy != null || usersSelectedIds.size === 0}
            onClick={onDeleteSelectedUsers}
            className="h-8 rounded-lg border border-red-500/40 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-red-300 transition hover:bg-red-950/30 disabled:opacity-40"
          >
            {usersBulkBusy === 'delete' ? '…' : 'Удалить выбранных'}
          </button>
        </div>

        <ul className="flex flex-col gap-3 md:hidden">
          {usersPagination.total === 0 ? (
            <li className="rounded-lg border border-plantation/70 bg-aztec/20 p-4 text-center">
              <p className="font-mono text-sm text-gull">
                {usersSearchQuery.trim() ? 'Никого не найдено' : 'Нет пользователей'}
              </p>
            </li>
          ) : (
            usersPagination.pageItems.map((u) => {
              const d = userDrafts[u.id] ?? {
                role: u.role,
                displayName: u.displayName != null ? String(u.displayName) : '',
                password: '',
              }
              return (
                <li key={u.id} className="rounded-lg border border-plantation/80 bg-aztec/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-catskill">@{u.handle}</p>
                      <p className="truncate font-mono text-[11px] text-gull">{u.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={usersSelectedIds.has(u.id)}
                      onChange={() => onToggleUserSelected(u.id)}
                      className="mt-0.5 size-4 rounded border-plantation bg-aztec"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <label className="flex flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
                      Имя
                      <input
                        type="text"
                        value={d.displayName ?? ''}
                        onChange={(e) =>
                          setUserDrafts((prev) => ({
                            ...prev,
                            [u.id]: { ...d, displayName: e.target.value },
                          }))
                        }
                        className={TABLE_INPUT_CLASS}
                        placeholder="—"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-plantation/60 bg-aztec/40 px-2 py-1.5">
                        <p className="font-mono text-[10px] uppercase text-half-baked">Ранг</p>
                        <p className="font-mono text-xs text-catskill">{u.globalRank ?? '#0'}</p>
                      </div>
                      <div className="rounded-lg border border-plantation/60 bg-aztec/40 px-2 py-1.5">
                        <p className="font-mono text-[10px] uppercase text-half-baked">Заработок</p>
                        <p className="font-mono text-xs text-catskill">{u.moneyEarned ?? '0 ₽'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
                        Роль
                        <select
                          value={d.role}
                          onChange={(e) =>
                            setUserDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...d, role: e.target.value },
                            }))
                          }
                          className={TABLE_INPUT_CLASS}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 font-mono text-[10px] uppercase text-half-baked">
                        Новый пароль
                        <input
                          type="password"
                          value={d.password ?? ''}
                          onChange={(e) =>
                            setUserDrafts((prev) => ({
                              ...prev,
                              [u.id]: { ...d, password: e.target.value },
                            }))
                          }
                          className={TABLE_INPUT_CLASS}
                          placeholder="Не менять"
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>

        <div className={`hidden md:block ${adminTableScrollClass}`}>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                <th className="w-10 py-2 pl-2" />
                <th className="py-2 pr-3">Handle</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Имя</th>
                <th className="py-2 pr-3">Регистрация</th>
                <th className="py-2 pr-3">Ранг</th>
                <th className="py-2 pr-3">Заработок</th>
                <th className="py-2 pr-3">Роль</th>
                <th className="py-2 pr-3">Новый пароль</th>
                <th className="py-2 pr-3" title="Сумма баллов за все спринты (профиль и рейтинг)">
                  Общие баллы
                </th>
              </tr>
            </thead>
            <tbody>
              {usersPagination.total === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center font-mono text-sm text-gull">
                    {usersSearchQuery.trim() ? 'Никого не найдено' : 'Нет пользователей'}
                  </td>
                </tr>
              ) : null}
              {usersPagination.pageItems.map((u) => {
                const d = userDrafts[u.id] ?? {
                  role: u.role,
                  displayName: u.displayName != null ? String(u.displayName) : '',
                  password: '',
                }
                return (
                  <tr key={u.id} className="border-b border-plantation/60">
                    <td className="py-2 pl-2">
                      <input
                        type="checkbox"
                        checked={usersSelectedIds.has(u.id)}
                        onChange={() => onToggleUserSelected(u.id)}
                        className="size-4 rounded border-plantation bg-aztec"
                      />
                    </td>
                    <td className="py-2 pr-3 font-mono text-catskill">@{u.handle}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-gull">
                      <span className="inline-block max-w-[180px] truncate align-bottom">{u.email}</span>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={d.displayName ?? ''}
                        onChange={(e) =>
                          setUserDrafts((prev) => ({
                            ...prev,
                            [u.id]: { ...d, displayName: e.target.value },
                          }))
                        }
                        className={`${TABLE_INPUT_CLASS} max-w-[160px]`}
                        placeholder="—"
                      />
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-gull">
                      {u.createdAt
                        ? new Intl.DateTimeFormat('ru-RU', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(u.createdAt))
                        : '—'}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-catskill">{u.globalRank ?? '#0'}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-catskill">{u.moneyEarned ?? '0 ₽'}</td>
                    <td className="py-2 pr-3">
                      <select
                        value={d.role}
                        onChange={(e) =>
                          setUserDrafts((prev) => ({
                            ...prev,
                            [u.id]: { ...d, role: e.target.value },
                          }))
                        }
                        className={`${TABLE_INPUT_CLASS} max-w-[6.5rem]`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="password"
                        value={d.password ?? ''}
                        onChange={(e) =>
                          setUserDrafts((prev) => ({
                            ...prev,
                            [u.id]: { ...d, password: e.target.value },
                          }))
                        }
                        className={`${TABLE_INPUT_CLASS} max-w-[9rem]`}
                        placeholder="Не менять"
                        autoComplete="new-password"
                      />
                    </td>
                    <td
                      className="py-2 pr-3 font-mono text-xs font-semibold text-turquoise"
                      title="Сумма баллов за решения в зале славы (из БД)"
                    >
                      {u.points ?? 0}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={usersPagination.page}
          pageCount={usersPagination.pageCount}
          total={usersPagination.total}
          pageSize={ADMIN_USERS_PAGE_SIZE}
          disabled={usersBulkBusy != null}
          onPrev={usersPagination.onPrev}
          onNext={usersPagination.onNext}
        />
      </section>
    </div>
  )
}
