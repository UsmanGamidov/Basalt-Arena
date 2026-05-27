import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { MaterialIcon } from '../components/ui/MaterialIcon.jsx'

const ConfirmContext = createContext(null)

const EXIT_MS = 280

function ConfirmModal({ config, onDone }) {
  const { title, message, confirmLabel, cancelLabel, danger } = config
  const [phase, setPhase] = useState('enter')
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const finish = useCallback((result) => {
    setPhase('exit')
    window.setTimeout(() => onDoneRef.current(result), EXIT_MS)
  }, [])

  useEffect(() => {
    let innerId = 0
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => setPhase('open'))
    })
    return () => {
      cancelAnimationFrame(outerId)
      if (innerId) cancelAnimationFrame(innerId)
    }
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [finish])

  const backdropOpacity = phase === 'open' ? 'opacity-100' : 'opacity-0'
  const panelMotion =
    phase === 'enter'
      ? 'scale-[0.96] opacity-0 translate-y-2'
      : phase === 'exit'
        ? 'scale-[0.98] opacity-0 translate-y-1'
        : 'scale-100 opacity-100 translate-y-0'

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Отмена"
        className={[
          'absolute inset-0 bg-aztec/80 backdrop-blur-md transition-opacity duration-300 ease-out',
          backdropOpacity,
        ].join(' ')}
        onClick={() => finish(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className={[
          'relative w-full max-w-[min(100%,26rem)] rounded-2xl border border-plantation bg-timber p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]',
          'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity]',
          panelMotion,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={[
            'mb-4 flex size-11 items-center justify-center rounded-xl border',
            danger
              ? 'border-red-400/25 bg-red-950/40 text-red-300'
              : 'border-turquoise/20 bg-turquoise/10 text-turquoise',
          ].join(' ')}
        >
          <MaterialIcon name={danger ? 'warning' : 'help'} size={24} />
        </div>
        <h2
          id="confirm-dialog-title"
          className="text-lg font-bold leading-snug tracking-tight text-catskill"
        >
          {title}
        </h2>
        {message ? (
          <p
            id="confirm-dialog-message"
            className="mt-2 text-sm leading-relaxed text-half-baked"
          >
            {message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => finish(false)}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-plantation bg-aztec/60 px-5 font-mono text-xs font-bold uppercase tracking-wide text-catskill transition hover:bg-aztec"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => finish(true)}
            className={[
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 font-mono text-xs font-bold uppercase tracking-wide transition',
              danger
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-turquoise text-aztec hover:brightness-110',
            ].join(' ')}
          >
            {confirmLabel}
            <MaterialIcon
              name={danger ? 'delete' : 'check'}
              size={18}
              className={danger ? 'text-white' : 'text-aztec'}
            />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null)
  const resolverRef = useRef(null)

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setConfig({
        title: options.title ?? 'Подтвердите действие',
        message: options.message ?? '',
        confirmLabel: options.confirmLabel ?? 'Подтвердить',
        cancelLabel: options.cancelLabel ?? 'Отмена',
        danger: Boolean(options.danger),
      })
    })
  }, [])

  const handleDone = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setConfig(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {config ? <ConfirmModal config={config} onDone={handleDone} /> : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}
