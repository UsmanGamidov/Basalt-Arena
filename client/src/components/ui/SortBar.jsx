import { MaterialIcon } from './MaterialIcon.jsx'

/**
 * @param {{ value: string, onChange: (v: string) => void, options: { value: string, label: string }[], label?: string, className?: string, variant?: 'default' | 'hall' }} props
 */
export function SortBar({
  value,
  onChange,
  options,
  label = 'Сортировка',
  className = '',
  variant = 'default',
}) {
  const selectClass = [
    'h-9 min-w-[11.5rem] max-w-full cursor-pointer appearance-none rounded-lg border border-plantation',
    'bg-timber py-0 pl-3 pr-9 font-mono text-[11px] text-catskill outline-none transition',
    'hover:border-[#334155] focus:border-turquoise/35 [color-scheme:dark]',
  ].join(' ')

  if (variant === 'hall') {
    return (
      <label
        className={`flex shrink-0 items-center gap-2.5 max-[360px]:w-full max-[360px]:flex-col max-[360px]:items-stretch max-[360px]:gap-1.5 sm:flex-row sm:items-center ${className}`}
      >
        <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.12em] text-half-baked">
          {label}
        </span>
        <span className="relative block min-w-0 max-[360px]:w-full sm:min-w-[11.5rem]">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${selectClass} max-[360px]:w-full`}
            aria-label={label}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <MaterialIcon
            name="expand_more"
            size={18}
            opticalSize={18}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gull"
          />
        </span>
      </label>
    )
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-plantation bg-timber/30 px-3 py-2 ${className}`}
    >
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-wide text-half-baked">
        <MaterialIcon name="sort" size={16} opticalSize={16} className="text-turquoise/80" />
        {label}
      </span>
      <span className="relative min-w-[11.5rem] flex-1 sm:max-w-xs">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${selectClass} w-full`}
          aria-label={label}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <MaterialIcon
          name="expand_more"
          size={18}
          opticalSize={18}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gull"
        />
      </span>
    </div>
  )
}
