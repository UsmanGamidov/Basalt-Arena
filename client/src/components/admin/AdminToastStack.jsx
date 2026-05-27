import { useCallback, useEffect, useRef, useState } from 'react'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'

const VISIBLE_MS = 2000
const EXIT_MS = 320

/**
 * Компактный тост: плавно появляется, ~2 с на экране, плавно скрывается.
 * `fixed` — не участвует в потоке документа, скролл страницы не сбрасывается.
 */
function SlimToast({ variant, message, onExited }) {
  const [phase, setPhase] = useState('enter')
  const onExitedRef = useRef(onExited)
  onExitedRef.current = onExited

  const startExit = useCallback(() => {
    setPhase((p) => (p === 'exit' ? p : 'exit'))
  }, [])

  useEffect(() => {
    let cancelled = false
    let innerId = 0
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => {
        if (!cancelled) setPhase('stay')
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(outerId)
      if (innerId) cancelAnimationFrame(innerId)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'stay') return undefined
    const t = window.setTimeout(startExit, VISIBLE_MS)
    return () => window.clearTimeout(t)
  }, [phase, startExit])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const t = window.setTimeout(() => onExitedRef.current(), EXIT_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  const isError = variant === 'error'
  const shell =
    isError
      ? 'border-red-400/20 bg-[rgba(24,12,16,0.88)] text-red-100 shadow-[0_10px_36px_rgba(0,0,0,0.4)]'
      : 'border-emerald-400/12 bg-[rgba(16,42,40,0.9)] text-emerald-100 shadow-[0_10px_36px_rgba(13,204,242,0.07)]'

  const motion =
    phase === 'enter'
      ? '-translate-y-2.5 scale-[0.97] opacity-0'
      : phase === 'exit'
        ? '-translate-y-1.5 scale-[0.99] opacity-0'
        : 'translate-y-0 scale-100 opacity-100'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={[
        'pointer-events-auto flex max-w-[min(92vw,21rem)] items-center gap-2 rounded-2xl border px-3 py-2 backdrop-blur-lg',
        'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity]',
        shell,
        motion,
      ].join(' ')}
    >
      <MaterialIcon
        name={isError ? 'error' : 'check_circle'}
        size={18}
        className={isError ? 'shrink-0 text-red-400/90' : 'shrink-0 text-emerald-300'}
      />
      <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug tracking-tight">{message}</span>
      <button
        type="button"
        onClick={startExit}
        aria-label="Закрыть"
        className={[
          'flex shrink-0 items-center justify-center rounded-lg p-1 opacity-55 transition hover:opacity-100',
          isError ? 'text-red-200 hover:bg-white/10' : 'text-emerald-100/90 hover:bg-white/10',
        ].join(' ')}
      >
        <MaterialIcon name="close" size={16} />
      </button>
    </div>
  )
}

export function AdminToastStack({ notice, error, onDismissNotice, onDismissError }) {
  const err = typeof error === 'string' ? error.trim() : ''
  const n = typeof notice === 'string' ? notice.trim() : ''
  const active = err ? { variant: 'error', message: err } : n ? { variant: 'notice', message: n } : null

  const handleExited = useCallback(() => {
    if (active?.variant === 'error') onDismissError()
    else onDismissNotice()
  }, [active?.variant, onDismissError, onDismissNotice])

  if (!active) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(84px+env(safe-area-inset-top))] z-[260] flex justify-center px-3 md:top-[calc(70px+env(safe-area-inset-top))]"
    >
      <SlimToast
        key={`${active.variant}-${active.message}`}
        variant={active.variant}
        message={active.message}
        onExited={handleExited}
      />
    </div>
  )
}
