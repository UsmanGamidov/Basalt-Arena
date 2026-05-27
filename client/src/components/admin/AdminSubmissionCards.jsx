import { AdminSubmissionReviewActions } from './AdminSubmissionReviewActions.jsx'
import { truncateWithEllipsis } from '../../lib/truncate.js'
import { formatSubmissionSprintLabel } from '../../lib/adminSubmissions.js'

function formatSubmittedShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminSubmissionCards({
  rows,
  statusClassFn,
  reviewBusyId,
  onReview,
  onDelete,
  showSprint = false,
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-plantation/70 bg-aztec/20 p-4 text-center md:hidden">
        <p className="font-mono text-sm text-gull">Нет отправок</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-plantation/80 bg-aztec/40 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {showSprint ? (
                <p className="truncate text-sm font-bold text-white">
                  {formatSubmissionSprintLabel(row)}
                </p>
              ) : null}
              <p className="font-mono text-[10px] text-gull">{formatSubmittedShort(row.submittedAt)}</p>
              <p className="mt-1 text-sm font-semibold text-catskill">@{row.handle}</p>
              <p className="truncate font-mono text-[10px] text-half-baked">{row.email}</p>
            </div>
            <span className={`shrink-0 font-mono text-[10px] font-semibold ${statusClassFn(row.status)}`}>
              {row.statusLabel ?? row.status}
            </span>
          </div>

          <div className="mt-3 space-y-2 font-mono text-xs">
            <div>
              <span className="text-half-baked">Репозиторий: </span>
              {row.repoUrl ? (
                <a
                  href={row.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={row.repoUrl}
                  className="break-all text-turquoise underline"
                >
                  {truncateWithEllipsis(row.repoUrl, 92)}
                </a>
              ) : (
                <span className="text-gull">—</span>
              )}
            </div>
            <div>
              <span className="text-half-baked">Демо: </span>
              {row.demoUrl ? (
                <a
                  href={row.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={row.demoUrl}
                  className="break-all text-turquoise underline"
                >
                  {truncateWithEllipsis(row.demoUrl, 92)}
                </a>
              ) : (
                <span className="text-gull">—</span>
              )}
            </div>
          </div>

          <AdminSubmissionReviewActions
            submissionId={row.id}
            canReview={row.canReview}
            reviewBusyId={reviewBusyId}
            onOpenReview={() => onReview(row)}
            onDelete={onDelete && row.status !== 'pending_review' ? () => onDelete(row) : undefined}
          />
        </li>
      ))}
    </ul>
  )
}
