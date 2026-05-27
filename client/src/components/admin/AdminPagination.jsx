import { MaterialIcon } from '../ui/MaterialIcon.jsx'

export function AdminPagination({ page, pageCount, total, onPrev, onNext, disabled, pageSize }) {
  const from = total > 0 ? (page - 1) * (pageSize ?? 10) + 1 : 0
  const to = total > 0 ? Math.min(page * (pageSize ?? 10), total) : 0

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-gull">
      <span>
        {total > 0
          ? `${from}–${to} из ${total} · стр. ${page} / ${pageCount}`
          : 'Нет записей'}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={onPrev}
          className="admin-page-nav-btn"
          aria-label="Предыдущая страница"
        >
          <MaterialIcon name="chevron_left" size={18} />
          <span className="hidden sm:inline">Назад</span>
        </button>
        <button
          type="button"
          disabled={disabled || page >= pageCount}
          onClick={onNext}
          className="admin-page-nav-btn"
          aria-label="Следующая страница"
        >
          <span className="hidden sm:inline">Вперёд</span>
          <MaterialIcon name="chevron_right" size={18} />
        </button>
      </div>
    </div>
  )
}
