import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TaskDescriptionCard } from '../main/TaskDescriptionCard.jsx'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { normalizeSprintBriefView } from '../../lib/sprintTaskBrief.js'

const EXIT_MS = 280

/** Превью задания на главной (только админка). */
export function AdminSprintPreviewModal({ open, sprint, onClose }) {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    if (!open) return undefined
    setPhase('enter')
    let innerId = 0
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => setPhase('open'))
    })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(outerId)
      if (innerId) cancelAnimationFrame(innerId)
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleClose() {
    setPhase('exit')
    window.setTimeout(onClose, EXIT_MS)
  }

  if (!open || !sprint) return null

  const brief = normalizeSprintBriefView(sprint)
  const title = sprint.title || brief.taskTitle || 'Спринт'

  const backdropOpacity = phase === 'open' ? 'opacity-100' : 'opacity-0'
  const panelMotion =
    phase === 'enter'
      ? 'scale-[0.97] opacity-0 translate-y-3'
      : phase === 'exit'
        ? 'scale-[0.99] opacity-0 translate-y-1'
        : 'scale-100 opacity-100 translate-y-0'

  return createPortal(
    <div className="fixed inset-0 z-[10040] flex items-start justify-center overflow-y-auto p-4 pt-20 sm:p-6 sm:pt-24">
      <button
        type="button"
        aria-label="Закрыть"
        className={[
          'fixed inset-0 bg-aztec/85 backdrop-blur-md transition-opacity duration-300',
          backdropOpacity,
        ].join(' ')}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sprint-preview-title"
        className={[
          'relative w-full max-w-3xl transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          panelMotion,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-half-baked">Превью главной</p>
            <h2 id="sprint-preview-title" className="text-lg font-bold text-catskill">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-10 items-center justify-center rounded-lg border border-plantation text-catskill hover:bg-white/5"
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>
        <TaskDescriptionCard sprint={sprint} />
        <p className="mt-3 text-center font-mono text-[10px] text-gull">
          Таймер и терминал отправки на главной не показаны — только карточка задания.
        </p>
      </div>
    </div>,
    document.body,
  )
}
