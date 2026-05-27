import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { AdminSubmissionCards } from './AdminSubmissionCards.jsx'
import { adminPanelClass, adminTableScrollClass } from './adminStyles.js'
import { formatSubmissionSprintLabel } from '../../lib/adminSubmissions.js'
import { truncateWithEllipsis } from '../../lib/truncate.js'

export function AdminSubmissionsPanel({
  sprints,
  sprintFilter,
  onSprintFilterChange,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  rows,
  loading,
  statusClassFn,
  reviewBusyId,
  onReview,
  onDelete,
  dateSortDir,
  onToggleDateSort,
  pagination,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-start xl:gap-8">
      <section className={`xl:sticky xl:top-24 ${adminPanelClass}`}>
        <AdminBlockHeader title="Отправки: фильтры" />
        <div className="mt-2 flex flex-col gap-3">
          <label className="flex min-w-0 flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Спринт
            <select
              value={sprintFilter}
              onChange={(e) => onSprintFilterChange(e.target.value)}
              className="h-9 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            >
              <option value="">Все спринты</option>
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
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="ник, email, спринт…"
              className="h-9 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill placeholder:text-gull"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
            Статус
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-9 rounded-lg border border-plantation bg-aztec px-3 text-sm text-catskill"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={adminPanelClass}>
        <AdminBlockHeader title="Отправки (реестр и модерация)" />
        {loading ? <p className="mb-3 mt-2 font-mono text-xs text-gull">Загрузка…</p> : null}
        <div className="mt-2">
          <AdminSubmissionCards
            rows={rows}
            showSprint
            statusClassFn={statusClassFn}
            reviewBusyId={reviewBusyId}
            onReview={onReview}
            onDelete={onDelete}
          />
        </div>
        <div className={`hidden md:block ${adminTableScrollClass}`}>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                <th className="py-2 pr-3">Спринт</th>
                <th className="py-2 pr-3">Участник</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2 pr-3">Репозиторий</th>
                <th className="py-2 pr-3">Демо</th>
                <th className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={onToggleDateSort}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-half-baked transition hover:text-catskill"
                  >
                    Дата
                    <MaterialIcon
                      name={dateSortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                      size={14}
                      className="text-turquoise"
                    />
                  </button>
                </th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 font-mono text-sm text-gull">
                    Нет отправок
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-plantation/60">
                    <td className="max-w-[140px] py-2 pr-3 font-mono text-xs text-catskill">
                      <span className="inline-block max-w-[140px] truncate" title={formatSubmissionSprintLabel(s)}>
                        {formatSubmissionSprintLabel(s)}
                      </span>
                    </td>
                    <td className="max-w-[160px] py-2 pr-3 font-mono text-xs text-catskill">
                      @{s.handle}
                      <span className="ml-1 block max-w-[160px] truncate text-gull">{s.email}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px]">
                      <span className={statusClassFn(s.status)}>{s.statusLabel ?? s.status ?? ''}</span>
                    </td>
                    <td className="max-w-[160px] py-2 pr-3">
                      {s.repoUrl ? (
                        <a
                          href={s.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={s.repoUrl}
                          className="break-all font-mono text-[11px] text-turquoise underline"
                        >
                          {truncateWithEllipsis(s.repoUrl, 74)}
                        </a>
                      ) : (
                        <span className="text-gull">—</span>
                      )}
                    </td>
                    <td className="max-w-[140px] py-2 pr-3">
                      {s.demoUrl ? (
                        <a
                          href={s.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={s.demoUrl}
                          className="break-all font-mono text-[11px] text-turquoise underline"
                        >
                          {truncateWithEllipsis(s.demoUrl, 74)}
                        </a>
                      ) : (
                        <span className="text-gull">—</span>
                      )}
                    </td>
                    <td className="max-w-[130px] py-2 pr-3 font-mono text-[11px] text-gull">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString('ru-RU') : ''}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-col gap-1">
                        {s.canReview ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              disabled={reviewBusyId === s.id}
                              onClick={() => onReview(s)}
                              className="rounded border border-turquoise/30 bg-turquoise/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-turquoise hover:bg-turquoise/20 disabled:opacity-50"
                            >
                              Проверить
                            </button>
                          </div>
                        ) : null}
                        {s.status !== 'pending_review' ? (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => onDelete(s)}
                              className="rounded px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-300 hover:bg-red-950/40"
                            >
                              Удалить
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination?.visible ? (
          <AdminPagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            total={pagination.total}
            pageSize={pagination.pageSize}
            disabled={pagination.disabled}
            onPrev={pagination.onPrev}
            onNext={pagination.onNext}
          />
        ) : null}
      </section>
    </div>
  )
}
