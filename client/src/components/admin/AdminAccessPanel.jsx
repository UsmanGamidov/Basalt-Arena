import { useMemo } from 'react'
import { ADMIN_USERS_PAGE_SIZE, useListPagination } from '../../hooks/useListPagination.js'
import {
  countAccessEnrollmentDiff,
  enrolledUserIdsFromParticipants,
  sortUsersForAccessList,
} from '../../lib/adminAccess.js'
import { userMatchesSearch } from '../../lib/adminUsers.js'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { AdminSaveButton } from './AdminSaveToolbar.jsx'
import { adminPanelClass, adminTableScrollClass } from './adminStyles.js'

export function AdminAccessPanel({
  sprints,
  accessSprintId,
  onAccessSprintChange,
  users,
  participants,
  participantsLoading,
  selectedUserIds,
  onToggleUserSelected,
  onSelectAll,
  onResetSelection,
  onSave,
  saveBusy,
  searchQuery,
  onSearchQueryChange,
}) {
  const enrolledIds = useMemo(
    () => enrolledUserIdsFromParticipants(participants),
    [participants],
  )

  const dirtyCount = useMemo(
    () => countAccessEnrollmentDiff(enrolledIds, selectedUserIds),
    [enrolledIds, selectedUserIds],
  )

  const filteredSortedUsers = useMemo(() => {
    const filtered = users.filter((u) => userMatchesSearch(u, searchQuery))
    return sortUsersForAccessList(filtered, selectedUserIds)
  }, [users, searchQuery, selectedUserIds])

  const usersPagination = useListPagination(
    filteredSortedUsers,
    ADMIN_USERS_PAGE_SIZE,
    `${accessSprintId}:${searchQuery}`,
  )

  const checkedOnPage = usersPagination.pageItems.filter((u) => selectedUserIds.has(u.id)).length

  return (
    <section className={adminPanelClass}>
      <AdminBlockHeader
        title="Доступ к спринту"
        icon={<MaterialIcon name="group" size={18} className="shrink-0 text-turquoise" />}
      />
      <p className="mb-4 mt-1 font-mono text-[11px] leading-relaxed text-gull">
        Отметьте участников спринта. Без зачисления пользователь не видит спринт в терминале и не может
        сдать работу. Сначала в списке — уже зачисленные.
      </p>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-half-baked">Спринт</span>
          <select
            value={accessSprintId}
            onChange={(e) => onAccessSprintChange(e.target.value)}
            className="h-8 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
          >
            {sprints.length === 0 ? <option value="">— нет спринтов —</option> : null}
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
          Поиск
          <input
            type="search"
            value={searchQuery}
            placeholder="Ник, email, имя…"
            onChange={(e) => onSearchQueryChange(e.target.value)}
            disabled={!accessSprintId}
            className="h-8 rounded-lg border border-plantation bg-aztec px-3 font-mono text-xs text-catskill disabled:opacity-50"
          />
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-gull">
          {participantsLoading
            ? 'Загрузка…'
            : `Зачислено: ${enrolledIds.size} · отмечено: ${selectedUserIds.size}`}
          {searchQuery.trim()
            ? ` · по фильтру ${usersPagination.total}`
            : users.length
              ? ` · всего ${users.length}`
              : null}
          {usersPagination.pageItems.length > 0
            ? ` · на странице ${checkedOnPage}/${usersPagination.pageItems.length}`
            : null}
        </span>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={saveBusy || participantsLoading || !accessSprintId || usersPagination.total === 0}
          className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] uppercase text-gull transition hover:bg-white/5 disabled:opacity-40"
        >
          Выделить всех
        </button>
        <button
          type="button"
          onClick={onResetSelection}
          disabled={saveBusy || participantsLoading || dirtyCount === 0}
          className="h-8 rounded-lg border border-plantation px-2.5 font-mono text-[10px] uppercase text-gull transition hover:bg-white/5 disabled:opacity-40"
        >
          Сбросить
        </button>
        <AdminSaveButton
          busy={saveBusy}
          dirtyCount={dirtyCount}
          onClick={onSave}
          className="!bg-turquoise !text-aztec disabled:!opacity-50"
        />
      </div>

      {participantsLoading && users.length === 0 ? (
        <p className="font-mono text-xs text-gull">Загрузка участников…</p>
      ) : (
        <>
          <div className={adminTableScrollClass}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                  <th className="w-10 py-2 pl-2" title="Участник спринта" />
                  <th className="py-2 pr-3">Handle</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Статус</th>
                </tr>
              </thead>
              <tbody>
                {usersPagination.total === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center font-mono text-sm text-gull">
                      {!accessSprintId
                        ? 'Выберите спринт'
                        : searchQuery.trim()
                          ? 'Никого не найдено'
                          : 'Нет пользователей'}
                    </td>
                  </tr>
                ) : null}
                {usersPagination.pageItems.map((u) => {
                  const checked = selectedUserIds.has(u.id)
                  const wasEnrolled = enrolledIds.has(u.id)
                  const pending = checked !== wasEnrolled
                  return (
                    <tr
                      key={u.id}
                      className={[
                        'border-b border-plantation/60',
                        checked ? 'bg-turquoise/[0.04]' : '',
                      ].join(' ')}
                    >
                      <td className="py-2 pl-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!accessSprintId || saveBusy}
                          onChange={() => onToggleUserSelected(u.id)}
                          className="size-4 rounded border-plantation bg-aztec"
                          aria-label={`@${u.handle}`}
                        />
                      </td>
                      <td className="py-2 pr-3 font-mono text-catskill">@{u.handle}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-gull">{u.email}</td>
                      <td className="py-2 pr-3 font-mono text-[10px] uppercase tracking-wide">
                        {pending ? (
                          <span className="text-amber-300/90">
                            {checked ? 'будет зачислен' : 'будет исключён'}
                          </span>
                        ) : checked ? (
                          <span className="text-turquoise">в спринте</span>
                        ) : (
                          <span className="text-gull">—</span>
                        )}
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
            disabled={saveBusy || participantsLoading}
            onPrev={usersPagination.onPrev}
            onNext={usersPagination.onNext}
          />
        </>
      )}
    </section>
  )
}
