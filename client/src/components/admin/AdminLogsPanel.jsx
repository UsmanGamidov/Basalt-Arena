import { AdminBlockHeader } from './AdminBlockHeader.jsx'
import { AdminPagination } from './AdminPagination.jsx'
import { adminPanelClass, adminSearchInputClass, adminTableScrollClass } from './adminStyles.js'

export function AdminLogsPanel({
  query,
  onQueryChange,
  rows,
  loading,
  pagination,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start xl:gap-8">
      <section className={`xl:sticky xl:top-24 ${adminPanelClass}`}>
        <AdminBlockHeader title="Логи: фильтры" />
        <label className="mb-1 mt-2 flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-half-baked">
          Поиск
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="админ, действие, сущность…"
            className={adminSearchInputClass}
          />
        </label>
      </section>

      <section className={adminPanelClass}>
        <AdminBlockHeader title="Логи действий админов" />
        {loading ? <p className="mb-3 mt-2 font-mono text-xs text-gull">Загрузка…</p> : null}
        <div className={adminTableScrollClass}>
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-plantation font-mono text-[10px] uppercase tracking-wider text-half-baked">
                <th className="py-2 pr-3">Дата</th>
                <th className="py-2 pr-3">Админ</th>
                <th className="py-2 pr-3">Действие</th>
                <th className="py-2 pr-3">Сущность</th>
                <th className="py-2 pr-3">Описание</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center font-mono text-sm text-gull">
                    {query.trim() ? 'Логи не найдены' : 'Логов пока нет'}
                  </td>
                </tr>
              ) : (
                rows.map((log) => (
                  <tr key={log.id} className="border-b border-plantation/60">
                    <td className="py-2 pr-3 font-mono text-[11px] text-gull">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : ''}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-catskill">@{log.actorHandle || 'admin'}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-turquoise">{log.action}</td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-half-baked">
                      {log.targetLabel || log.targetType}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-catskill">
                      <span className="line-clamp-3 break-words">{log.message}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={pagination.total}
          pageSize={pagination.pageSize}
          disabled={pagination.disabled}
          onPrev={pagination.onPrev}
          onNext={pagination.onNext}
        />
      </section>
    </div>
  )
}
