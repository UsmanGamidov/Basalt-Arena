import { MaterialIcon } from '../ui/MaterialIcon.jsx'

/** Числовое поле со стрелками в стиле Basalt Arena. */
export function AdminNumberInput({ className = '', value, onChange, min, max, step = 1, ...rest }) {
  const n = Number(value)
  const canDec = min == null || !Number.isFinite(n) || n > Number(min)
  const canInc = max == null || !Number.isFinite(n) || n < Number(max)

  function emit(next) {
    if (!onChange) return
    let v = next
    if (min != null && v !== '' && Number.isFinite(Number(v))) {
      v = String(Math.max(Number(min), Number(v)))
    }
    if (max != null && v !== '' && Number.isFinite(Number(v))) {
      v = String(Math.min(Number(max), Number(v)))
    }
    onChange({ target: { value: v } })
  }

  function bump(delta) {
    const base = Number.isFinite(Number(value)) ? Number(value) : Number(min ?? 0)
    let next = base + delta
    if (min != null) next = Math.max(Number(min), next)
    if (max != null) next = Math.min(Number(max), next)
    emit(String(next))
  }

  return (
    <div className={`arena-spin-input inline-flex max-w-full align-middle ${className}`}>
      <input
        type="number"
        value={value}
        onChange={(e) => emit(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="arena-spin-input__field min-w-0 flex-1"
        {...rest}
      />
      <div className="arena-spin-input__controls" aria-hidden>
        <button
          type="button"
          tabIndex={-1}
          disabled={!canInc}
          onClick={() => bump(step)}
          className="arena-spin-input__btn arena-spin-input__btn--up"
          aria-label="Увеличить"
        >
          <MaterialIcon name="keyboard_arrow_up" size={14} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={!canDec}
          onClick={() => bump(-step)}
          className="arena-spin-input__btn arena-spin-input__btn--down"
          aria-label="Уменьшить"
        >
          <MaterialIcon name="keyboard_arrow_down" size={14} />
        </button>
      </div>
    </div>
  )
}
