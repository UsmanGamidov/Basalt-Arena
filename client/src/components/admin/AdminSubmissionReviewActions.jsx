export function AdminSubmissionReviewActions({
  submissionId,
  canReview,
  reviewBusyId,
  onOpenReview,
  onDelete,
}) {
  const busy = reviewBusyId === submissionId

  return (
    <div className="flex flex-col gap-2 border-t border-plantation/60 pt-3">
      {canReview ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onOpenReview}
            className="rounded-lg border border-turquoise/30 bg-turquoise/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-turquoise disabled:opacity-50"
          >
            Проверить
          </button>
        </div>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="self-start font-mono text-xs text-red-300 hover:underline"
        >
          Удалить
        </button>
      ) : null}
    </div>
  )
}
