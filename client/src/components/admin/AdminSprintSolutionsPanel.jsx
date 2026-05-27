import { useMemo, useState } from 'react'
import { ADMIN_USERS_PAGE_SIZE, useListPagination } from '../../hooks/useListPagination.js'
import { solutionMatchesSearch } from '../../lib/adminSolutions.js'
import { truncateWithEllipsis } from '../../lib/truncate.js'
import { MENTOR_SCORE_MAX, mentorScoreRangeHint } from '../../lib/mentorScore.js'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminNumberInput } from './AdminNumberInput.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { AdminSaveToolbar } from './AdminSaveToolbar.jsx'
import { adminPanelClass, adminSearchInputClass, adminTableScrollClass } from './adminStyles.js'

const TABLE_INPUT =
  'h-8 w-full max-w-full rounded border border-plantation bg-aztec px-2 font-mono text-xs text-catskill'

export function AdminSprintSolutionsPanel({
  sprints,
  users,
  solutionsSprintId,
  onSolutionsSprintChange,
  detailLoading,
  solutions,
  solutionsSearchQuery,
  onSolutionsSearchChange,
  solutionDrafts,
  setSolutionDrafts,
  solUserId,
  onSolUserIdChange,
  solMentor,
  onSolMentorChange,
  solCodeUrl,
  onSolCodeUrlChange,
  solDemoUrl,
  onSolDemoUrlChange,
  solBusy,
  onAddSolution,
  onDeleteSolution,
  onSaveDirty,
  saveBusy,
  dirtyCount,
  statusText,
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editSolutionId, setEditSolutionId] = useState(null)

  const filtered = useMemo(
    () => solutions.filter((s) => solutionMatchesSearch(s, solutionsSearchQuery)),
    [solutions, solutionsSearchQuery],
  )

  const pagination = useListPagination(
    filtered,
    ADMIN_USERS_PAGE_SIZE,
    `${solutionsSprintId}:${solutionsSearchQuery}`,
  )

  const usersWithoutSolution = useMemo(() => {
    const taken = new Set(solutions.map((s) => s.userId).filter(Boolean))
    return users.filter((u) => !taken.has(u.id))
  }, [users, solutions])

  return (
    <section className={adminPanelClass}>
      <AdminBlockHeader
        title="Решения в зале славы"
        icon={<MaterialIcon name="emoji_events" size={20} className="shrink-0 text-turquoise" />}
      />
      <p className="mb-4 mt-1 font-mono text-[11px] leading-relaxed text-gull">
        Записи зала славы по выбранному спринту: баллы, ссылки, удаление. Модерация посылок — вкладка
        «Отправки».
      </p>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
          Спринт
          <select
            value={solutionsSprintId}
            onChange={(e) => onSolutionsSprintChange(e.target.value)}
            className="h-9 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
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
          Поиск в спринте
          <input
            type="search"
            value={solutionsSearchQuery}
            onChange={(e) => onSolutionsSearchChange(e.target.value)}
            placeholder="Участник, id…"
            disabled={!solutionsSprintId}
            className={adminSearchInputClass}
          />
        </label>
      </div>

      <AdminSaveToolbar
        className="mb-3"
        statusText={statusText}
        busy={saveBusy}
        dirtyCount={dirtyCount}
        onSave={onSaveDirty}
      />

      <details
        open={addOpen}
        onToggle={(e) => setAddOpen(e.currentTarget.open)}
        className="mb-4 rounded-lg border border-plantation/70 bg-aztec/25"
      >
        <summary className="cursor-pointer list-none px-3 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wide text-half-baked marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <MaterialIcon
              name={addOpen ? 'expand_less' : 'add'}
              size={18}
              className="text-turquoise"
            />
            Добавить решение
          </span>
        </summary>
        <form onSubmit={onAddSolution} className="flex flex-col gap-2 border-t border-plantation/50 px-3 pb-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={solUserId}
              onChange={(e) => onSolUserIdChange(e.target.value)}
              disabled={!solutionsSprintId}
              className="min-w-[10rem] flex-1 rounded-lg border border-plantation bg-aztec px-2 py-1.5 text-xs text-catskill disabled:opacity-50"
            >
              <option value="">Участник</option>
              {usersWithoutSolution.map((u) => (
                <option key={u.id} value={u.id}>
                  @{u.handle}
                </option>
              ))}
            </select>
            <AdminNumberInput
              min={0}
              max={MENTOR_SCORE_MAX}
              value={solMentor}
              onChange={(e) => onSolMentorChange(e.target.value)}
              className="w-24"
              title={`Балл (${mentorScoreRangeHint()})`}
            />
            <button
              type="submit"
              disabled={solBusy || !solUserId || !solutionsSprintId}
              className="h-8 rounded-lg bg-turquoise px-3 font-mono text-[10px] font-bold uppercase text-aztec disabled:opacity-40"
            >
              {solBusy ? '…' : 'Добавить'}
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={solCodeUrl}
              onChange={(e) => onSolCodeUrlChange(e.target.value)}
              placeholder="Ссылка на код (repo)"
              className={`${TABLE_INPUT} sm:flex-1`}
            />
            <input
              value={solDemoUrl}
              onChange={(e) => onSolDemoUrlChange(e.target.value)}
              placeholder="Демо (опц.)"
              className={`${TABLE_INPUT} sm:flex-1`}
            />
          </div>
        </form>
      </details>

      {detailLoading ? (
        <p className="mb-3 font-mono text-xs text-gull">Загрузка решений…</p>
      ) : null}

      <div className={adminTableScrollClass}>
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
              <th className="w-12 py-2 pr-2">#</th>
              <th className="py-2 pr-3">Участник</th>
              <th className="py-2 pr-3">Балл</th>
              <th className="w-14 py-2 pr-2">♥</th>
              <th className="py-2 pr-3">Ссылки</th>
              <th className="w-24 py-2 pr-2 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {pagination.total === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center font-mono text-sm text-gull">
                  {!solutionsSprintId
                    ? 'Выберите спринт'
                    : solutionsSearchQuery.trim()
                      ? 'Никого не найдено'
                      : 'В этом спринте пока нет решений'}
                </td>
              </tr>
            ) : null}
            {pagination.pageItems.map((sol) => {
              const draft = solutionDrafts[sol.id] ?? {
                mentorScore: String(sol.mentorScore ?? 0),
                codeUrl: sol.codeUrl ?? '',
                demoUrl: sol.demoUrl ?? '',
              }
              const editing = editSolutionId === sol.id
              const dirty =
                Number(draft.mentorScore) !== Number(sol.mentorScore ?? 0) ||
                String(draft.codeUrl ?? '') !== String(sol.codeUrl ?? '') ||
                String(draft.demoUrl ?? '') !== String(sol.demoUrl ?? '')
              return (
                <tr
                  key={sol.id}
                  className={[
                    'border-b border-plantation/60',
                    dirty ? 'bg-turquoise/[0.04]' : '',
                  ].join(' ')}
                >
                  <td className="py-2 pr-2 font-mono text-xs text-gull">{sol.rank}</td>
                  <td className="min-w-0 py-2 pr-3">
                    <div className="min-w-0">
                      {sol.displayName && String(sol.displayName).toLowerCase() !== String(sol.handle).toLowerCase() ? (
                        <>
                          <span className="block truncate font-mono text-xs text-catskill">
                            {sol.displayName}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-half-baked">
                            @{sol.handle}
                          </span>
                        </>
                      ) : (
                        <span className="block truncate font-mono text-xs text-catskill">
                          @{sol.handle}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <AdminNumberInput
                      min={0}
                      max={MENTOR_SCORE_MAX}
                      value={draft.mentorScore}
                      onChange={(e) =>
                        setSolutionDrafts((prev) => ({
                          ...prev,
                          [sol.id]: { ...draft, mentorScore: e.target.value },
                        }))
                      }
                      className="max-w-[5.5rem]"
                      title={mentorScoreRangeHint()}
                    />
                  </td>
                  <td className="py-2 pr-2 font-mono text-xs text-gull">{sol.likes ?? 0}</td>
                  <td className="py-2 pr-3">
                    {editing ? (
                      <div className="flex flex-col gap-1.5">
                        <input
                          value={draft.codeUrl ?? ''}
                          onChange={(e) =>
                            setSolutionDrafts((prev) => ({
                              ...prev,
                              [sol.id]: { ...draft, codeUrl: e.target.value },
                            }))
                          }
                          placeholder="https://..."
                          className={`${TABLE_INPUT} h-7 text-[11px]`}
                        />
                        <input
                          value={draft.demoUrl ?? ''}
                          onChange={(e) =>
                            setSolutionDrafts((prev) => ({
                              ...prev,
                              [sol.id]: { ...draft, demoUrl: e.target.value },
                            }))
                          }
                          placeholder="https://... (опционально)"
                          className={`${TABLE_INPUT} h-7 text-[11px]`}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 font-mono text-[11px]">
                        {sol.codeUrl ? (
                          <a
                            href={sol.codeUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={sol.codeUrl}
                            className="truncate text-turquoise hover:underline"
                          >
                            {truncateWithEllipsis(sol.codeUrl, 74)}
                          </a>
                        ) : (
                          <span className="text-gull">—</span>
                        )}
                        {sol.demoUrl ? (
                          <a
                            href={sol.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={sol.demoUrl}
                            className="truncate text-half-baked hover:text-catskill hover:underline"
                          >
                            {truncateWithEllipsis(sol.demoUrl, 74)}
                          </a>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditSolutionId((prev) => (prev === sol.id ? null : sol.id))}
                      className="inline-flex h-7 w-20 items-center justify-center rounded border border-turquoise/25 bg-turquoise/10 px-2 py-1 font-mono text-[10px] uppercase text-turquoise transition hover:bg-turquoise/20"
                    >
                      {editing ? 'Скрыть' : 'Править'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSolution(sol.id)}
                      className="inline-flex h-7 w-20 items-center justify-center rounded border border-red-500/30 bg-red-950/20 px-2 py-1 font-mono text-[10px] uppercase text-red-300 transition hover:bg-red-950/35"
                    >
                      Удалить
                    </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        total={pagination.total}
        pageSize={ADMIN_USERS_PAGE_SIZE}
        disabled={detailLoading || saveBusy}
        onPrev={pagination.onPrev}
        onNext={pagination.onNext}
      />
    </section>
  )
}
