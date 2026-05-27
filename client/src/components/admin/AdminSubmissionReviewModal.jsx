import { useEffect, useState } from 'react'
import { MENTOR_SCORE_MAX, mentorScoreRangeHint } from '../../lib/mentorScore.js'
import { AdminNumberInput } from './AdminNumberInput.jsx'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'

export function AdminSubmissionReviewModal({
  open,
  submission,
  scoreValue,
  onScoreChange,
  noteValue,
  onNoteChange,
  busy,
  onApprove,
  onDelete,
  onClose,
}) {
  const [visible, setVisible] = useState(open)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    setEntered(false)
    const t = setTimeout(() => setVisible(false), 180)
    return () => clearTimeout(t)
  }, [open])

  if (!visible || !submission) return null

  return (
    <div
      className={[
        'fixed inset-0 z-[90] flex items-center justify-center p-4 transition-opacity duration-200',
        entered ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-aztec/80 backdrop-blur-[1px]"
        aria-label="Закрыть окно проверки"
      />
      <div
        className={[
          'relative z-[1] w-full max-w-lg rounded-xl border border-plantation bg-gradient-to-b from-timber to-aztec/95 p-4 shadow-2xl transition-all duration-200',
          entered ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.985]',
        ].join(' ')}
      >
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-plantation/70 pb-3">
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wide text-slate-arena">
              Проверка отправки
            </h3>
            <p className="mt-1 font-mono text-sm text-catskill">
              @{submission.handle}
              <span className="ml-1 text-gull">· {submission.sprintLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 font-mono text-xs text-gull hover:bg-white/5"
          >
            Закрыть
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {submission.repoUrl ? (
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-turquoise hover:border-turquoise/35"
              >
                <MaterialIcon name="code" size={14} />
                Открыть репозиторий
              </a>
            ) : null}
            {submission.demoUrl ? (
              <a
                href={submission.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-turquoise hover:border-turquoise/35"
              >
                <MaterialIcon name="rocket_launch" size={14} />
                Открыть демо
              </a>
            ) : null}
          </div>
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase text-half-baked">
            Балл наставника
            <AdminNumberInput
              min={0}
              max={MENTOR_SCORE_MAX}
              placeholder="Балл"
              title={`Балл за спринт (${mentorScoreRangeHint()})`}
              value={scoreValue}
              onChange={onScoreChange}
              className="w-[6.5rem]"
            />
          </label>
          <label className="block font-mono text-[10px] uppercase text-half-baked">
            Комментарий к проверке
            <textarea
              value={noteValue}
              onChange={onNoteChange}
              placeholder="Опционально: что исправить или что хорошо сделано"
              rows={3}
              maxLength={1000}
              className="mt-1.5 w-full resize-y rounded-lg border border-plantation bg-aztec/70 px-3 py-2 text-[12px] normal-case tracking-normal text-catskill outline-none transition focus:border-turquoise/35"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !submission.canApprove}
            onClick={onApprove}
            className="rounded-lg bg-spring/20 px-3 py-2 font-mono text-[11px] font-bold uppercase text-spring transition duration-150 hover:-translate-y-0.5 hover:bg-spring/30 active:translate-y-0 disabled:opacity-50"
          >
            {busy ? '…' : 'Принять'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-[11px] font-bold uppercase text-red-200 transition duration-150 hover:-translate-y-0.5 hover:bg-red-950/55 active:translate-y-0 disabled:opacity-50"
          >
            {busy ? '…' : 'Удалить'}
          </button>
        </div>
        {!submission.canApprove ? (
          <p className="mt-2 font-mono text-[10px] text-gull">
            Для принятия укажите корректный балл ({mentorScoreRangeHint()}).
          </p>
        ) : null}
      </div>
    </div>
  )
}
