import { useMemo, useState } from 'react'
import { userMatchesSearch } from '../../lib/adminUsers.js'
import { ADMIN_USERS_PAGE_SIZE, useListPagination } from '../../hooks/useListPagination.js'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { adminPanelClass, adminTableScrollClass } from './adminStyles.js'

export function AdminAchievementsPanel({
  definitions = [],
  achievements = [],
  definitionsLoading,
  onCreateDefinition,
  createBusy,
  newTitle,
  setNewTitle,
  newSubtitle,
  setNewSubtitle,
  newIcon,
  setNewIcon,
  newVariant,
  setNewVariant,
  updateDefinitionBusyId,
  onUpdateDefinition,
  onDeleteDefinition,
  users = [],
  grantDefinitionId,
  setGrantDefinitionId,
  grantUserSearch,
  setGrantUserSearch,
  grantSelectedUserIds,
  onToggleGrantUser,
  onSelectAllGrantUsers,
  onClearGrantUsers,
  onGrant,
  grantBusy,
  onRevokeAchievement,
  revokeAchievementBusyId,
}) {
  const safeDefinitions = Array.isArray(definitions) ? definitions : []
  const safeAchievements = Array.isArray(achievements) ? achievements : []
  const safeUsers = Array.isArray(users) ? users : []
  const selectedUsersSet = grantSelectedUserIds instanceof Set ? grantSelectedUserIds : new Set()
  const [achievementSearch, setAchievementSearch] = useState('')
  const [editDefinitionId, setEditDefinitionId] = useState(null)
  const [editDrafts, setEditDrafts] = useState({})
  const [statusSortDir, setStatusSortDir] = useState('desc')
  const filteredGrantUsers = useMemo(
    () => safeUsers.filter((u) => userMatchesSearch(u, grantUserSearch)),
    [safeUsers, grantUserSearch],
  )

  const selectedDefinition = useMemo(
    () => safeDefinitions.find((d) => d.id === grantDefinitionId) ?? null,
    [safeDefinitions, grantDefinitionId],
  )
  const grantedAchievementByUserId = useMemo(() => {
    if (!selectedDefinition) return new Map()
    const byDefId = String(selectedDefinition.id)
    const map = new Map()
    for (const a of safeAchievements) {
      const sameDefinition = a?.definitionId && String(a.definitionId) === byDefId
      if (!sameDefinition) continue
      const userId = String(a?.userId ?? '')
      if (!userId || map.has(userId)) continue
      map.set(userId, a)
    }
    return map
  }, [safeAchievements, selectedDefinition])
  const grantedUserIdsForSelectedDefinition = useMemo(() => {
    return new Set([...grantedAchievementByUserId.keys()])
  }, [grantedAchievementByUserId])
  const sortedGrantUsers = useMemo(() => {
    const sign = statusSortDir === 'asc' ? 1 : -1
    return [...filteredGrantUsers].sort((a, b) => {
      const aGranted = grantedUserIdsForSelectedDefinition.has(String(a.id)) ? 1 : 0
      const bGranted = grantedUserIdsForSelectedDefinition.has(String(b.id)) ? 1 : 0
      if (aGranted !== bGranted) return (aGranted - bGranted) * sign
      return String(a?.handle ?? '').localeCompare(String(b?.handle ?? ''), 'ru')
    })
  }, [filteredGrantUsers, grantedUserIdsForSelectedDefinition, statusSortDir])
  const grantUsersPagination = useListPagination(
    sortedGrantUsers,
    ADMIN_USERS_PAGE_SIZE,
    `${grantUserSearch}:${statusSortDir}:${grantDefinitionId}`,
  )
  const filteredDefinitions = useMemo(() => {
    const q = String(achievementSearch ?? '').trim().toLowerCase()
    if (!q) return safeDefinitions
    return safeDefinitions.filter((d) => {
      const title = String(d?.title ?? '').toLowerCase()
      const subtitle = String(d?.subtitle ?? '').toLowerCase()
      const icon = String(d?.icon ?? '').toLowerCase()
      const variant = String(d?.variant ?? '').toLowerCase()
      return title.includes(q) || subtitle.includes(q) || icon.includes(q) || variant.includes(q)
    })
  }, [safeDefinitions, achievementSearch])
  const definitionsPagination = useListPagination(filteredDefinitions, 5, achievementSearch)

  function draftFor(definition) {
    return (
      editDrafts[definition.id] ?? {
        title: definition.title ?? '',
        subtitle: definition.subtitle ?? '',
        icon: definition.icon ?? 'military_tech',
        variant: definition.variant ?? 'earned',
      }
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-8">
      <section className={`xl:sticky xl:top-24 ${adminPanelClass}`}>
        <AdminBlockHeader
          title="Добавление ачивок"
          icon={<MaterialIcon name="add_circle" size={18} className="shrink-0 text-turquoise" />}
        />
        <form onSubmit={onCreateDefinition} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Заголовок (&gt;=2 симв.)
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            />
          </label>
          <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Подпись (&gt;=2 симв.)
            <input
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            />
          </label>
          <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Иконка (Material)
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="military_tech"
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 font-mono text-sm text-catskill"
            />
          </label>
          <label className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Вариант
            <select
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            >
              <option value="earned">earned</option>
              <option value="locked">locked</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={createBusy}
            className="h-8 w-full rounded-lg bg-turquoise px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-aztec disabled:opacity-50"
          >
            {createBusy ? '…' : 'Добавить в каталог'}
          </button>
        </form>
      </section>

      <div className="flex min-w-0 flex-col gap-6">
        <section className={adminPanelClass}>
          <AdminBlockHeader
            title="Каталог ачивок"
          />
          <label className="mb-3 mt-2 flex max-w-md flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Поиск по ачивкам
            <input
              type="search"
              value={achievementSearch}
              onChange={(e) => setAchievementSearch(e.target.value)}
              placeholder="Название, подпись, иконка…"
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            />
          </label>
          <div className={`mt-3 ${adminTableScrollClass}`}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                  <th className="py-2 pr-3">Заголовок</th>
                  <th className="py-2 pr-3">Подпись</th>
                  <th className="py-2 pr-3">Иконка</th>
                  <th className="py-2 pr-3">Вариант</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {definitionsPagination.total === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 font-mono text-sm text-gull">
                      {achievementSearch.trim()
                        ? 'По запросу ничего не найдено'
                        : 'Каталог пуст — добавьте первую ачивку'}
                    </td>
                  </tr>
                ) : (
                  definitionsPagination.pageItems.map((d) => (
                    <tr key={d.id} className="border-b border-plantation/60">
                      {editDefinitionId === d.id ? (
                        <>
                          <td className="py-2 pr-3">
                            <input
                              value={draftFor(d).title}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [d.id]: { ...draftFor(d), title: e.target.value },
                                }))
                              }
                              className="h-8 w-full rounded border border-plantation bg-aztec px-2 text-xs text-catskill"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              value={draftFor(d).subtitle}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [d.id]: { ...draftFor(d), subtitle: e.target.value },
                                }))
                              }
                              className="h-8 w-full rounded border border-plantation bg-aztec px-2 text-xs text-catskill"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              value={draftFor(d).icon}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [d.id]: { ...draftFor(d), icon: e.target.value },
                                }))
                              }
                              className="h-8 w-full rounded border border-plantation bg-aztec px-2 font-mono text-xs text-catskill"
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <select
                              value={draftFor(d).variant}
                              onChange={(e) =>
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [d.id]: { ...draftFor(d), variant: e.target.value },
                                }))
                              }
                              className="h-8 w-full rounded border border-plantation bg-aztec px-2 text-xs text-catskill"
                            >
                              <option value="earned">earned</option>
                              <option value="locked">locked</option>
                            </select>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 pr-3 text-catskill">{d.title}</td>
                          <td className="max-w-[220px] truncate py-2 pr-3 font-mono text-xs text-gull">
                            {d.subtitle}
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs text-half-baked">{d.icon}</td>
                          <td className="py-2 pr-3 font-mono text-xs text-half-baked">{d.variant}</td>
                        </>
                      )}
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {editDefinitionId === d.id ? (
                            <>
                              <button
                                type="button"
                                disabled={updateDefinitionBusyId === d.id}
                                onClick={async () => {
                                  const ok = await onUpdateDefinition(d.id, draftFor(d))
                                  if (!ok) return
                                  setEditDefinitionId(null)
                                  setEditDrafts((prev) => {
                                    const next = { ...prev }
                                    delete next[d.id]
                                    return next
                                  })
                                }}
                                className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-turquoise hover:bg-turquoise/10 disabled:opacity-50"
                              >
                                {updateDefinitionBusyId === d.id ? '…' : 'Сохранить'}
                              </button>
                              <button
                                type="button"
                                disabled={updateDefinitionBusyId === d.id}
                                onClick={() => {
                                  setEditDefinitionId(null)
                                  setEditDrafts((prev) => {
                                    const next = { ...prev }
                                    delete next[d.id]
                                    return next
                                  })
                                }}
                                className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-gull hover:bg-white/5 disabled:opacity-50"
                              >
                                Отмена
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditDefinitionId(d.id)
                                setEditDrafts((prev) => ({
                                  ...prev,
                                  [d.id]: draftFor(d),
                                }))
                              }}
                              className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-turquoise hover:bg-turquoise/10"
                            >
                              Править
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteDefinition(d.id, d.title)}
                            className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-300 hover:bg-red-950/40"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={definitionsPagination.page}
            pageCount={definitionsPagination.pageCount}
            total={definitionsPagination.total}
            pageSize={5}
            disabled={definitionsLoading}
            onPrev={definitionsPagination.onPrev}
            onNext={definitionsPagination.onNext}
          />
        </section>

        <section className={adminPanelClass}>
          <AdminBlockHeader
            title="Поиск пользователей и выдача ачивок"
            icon={<MaterialIcon name="card_giftcard" size={18} className="shrink-0 text-turquoise" />}
          />
          <label className="mb-4 flex max-w-lg flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Ачивка из каталога
            <select
              value={grantDefinitionId}
              onChange={(e) => setGrantDefinitionId(e.target.value)}
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            >
              <option value="">— выберите —</option>
              {safeDefinitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} · {d.subtitle}
                </option>
              ))}
            </select>
          </label>

          <label className="mb-3 flex max-w-md flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Поиск пользователей
            <input
              type="search"
              value={grantUserSearch}
              onChange={(e) => setGrantUserSearch(e.target.value)}
              placeholder="Ник, email, имя…"
              className="h-8 rounded-lg border border-plantation bg-aztec px-3 font-mono text-xs text-catskill"
            />
          </label>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-gull">Выбрано: {selectedUsersSet.size}</span>
            <button
              type="button"
              onClick={() => {
                const allowed = sortedGrantUsers
                  .map((u) => String(u.id))
                  .filter((id) => !grantedUserIdsForSelectedDefinition.has(id))
                onSelectAllGrantUsers(allowed)
              }}
              disabled={grantUsersPagination.total === 0}
              className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] font-bold uppercase tracking-wide text-half-baked transition hover:border-turquoise/30 disabled:opacity-40"
            >
              Все в выдаче
            </button>
            <button
              type="button"
              onClick={onClearGrantUsers}
              disabled={selectedUsersSet.size === 0}
              className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] uppercase text-gull transition hover:bg-white/5 disabled:opacity-40"
            >
              Сбросить
            </button>
            <button
              type="button"
              disabled={grantBusy || !grantDefinitionId || selectedUsersSet.size === 0}
              onClick={() => void onGrant()}
              className="h-8 rounded-lg bg-turquoise px-4 font-mono text-[10px] font-bold uppercase tracking-wide text-aztec disabled:opacity-50"
            >
              {grantBusy ? '…' : 'Выдать выбранным'}
            </button>
          </div>

          <div className={adminTableScrollClass}>
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                  <th className="w-10 py-2 pl-2" />
                  <th className="py-2 pr-3">Handle</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => setStatusSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-half-baked transition hover:text-catskill"
                      title="Сортировка по статусу"
                    >
                      Статус
                      <MaterialIcon
                        name={statusSortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        size={14}
                        className="text-turquoise"
                      />
                    </button>
                  </th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {grantUsersPagination.total === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center font-mono text-sm text-gull">
                      {grantUserSearch.trim() ? 'Никого не найдено' : 'Нет пользователей'}
                    </td>
                  </tr>
                ) : (
                  grantUsersPagination.pageItems.map((u) => (
                    <tr key={u.id} className="border-b border-plantation/60">
                      <td className="py-2 pl-2">
                        <input
                          type="checkbox"
                          checked={selectedUsersSet.has(u.id)}
                          onChange={() => onToggleGrantUser(u.id)}
                          disabled={selectedDefinition && grantedUserIdsForSelectedDefinition.has(String(u.id))}
                          className="size-4 rounded border-plantation bg-aztec"
                        />
                      </td>
                      <td className="py-2 pr-3 font-mono text-catskill">@{u.handle}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-gull">
                        {u.email}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] uppercase tracking-wide">
                        {selectedDefinition && grantedUserIdsForSelectedDefinition.has(String(u.id)) ? (
                          <span className="text-spring">выдана</span>
                        ) : (
                          <span className="text-half-baked">нет</span>
                        )}
                      </td>
                      <td className="py-2">
                        {selectedDefinition && grantedUserIdsForSelectedDefinition.has(String(u.id)) ? (
                          <button
                            type="button"
                            onClick={() =>
                              typeof onRevokeAchievement === 'function'
                                ? onRevokeAchievement(grantedAchievementByUserId.get(String(u.id)))
                                : undefined
                            }
                            disabled={revokeAchievementBusyId === grantedAchievementByUserId.get(String(u.id))?.id}
                            className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                          >
                            {revokeAchievementBusyId === grantedAchievementByUserId.get(String(u.id))?.id ? '…' : 'Снять'}
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] text-gull">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={grantUsersPagination.page}
            pageCount={grantUsersPagination.pageCount}
            total={grantUsersPagination.total}
            pageSize={ADMIN_USERS_PAGE_SIZE}
            disabled={grantBusy}
            onPrev={grantUsersPagination.onPrev}
            onNext={grantUsersPagination.onNext}
          />
        </section>
      </div>
    </div>
  )
}
