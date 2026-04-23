import { useEffect, useMemo, useState } from 'react'

function pad2(n) {
  return String(n).padStart(2, '0')
}

const defaultOffsetMs = () => Date.now() + 2 * 3600 * 1000 + 45 * 60 * 1000 + 12 * 1000

export function SprintTimer({ endAt }) {
  const target = useMemo(() => {
    if (endAt instanceof Date && !Number.isNaN(endAt.getTime())) return endAt
    if (typeof endAt === 'string' && endAt.trim()) {
      const parsed = new Date(endAt)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }
    return new Date(defaultOffsetMs())
  }, [endAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const ms = Math.max(0, target.getTime() - now)
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const glow = '[text-shadow:0_0_10px_rgba(13,204,242,0.5)]'
  const digitHours = `tabular-nums text-[57.5px] font-bold leading-[60px] tracking-[-3px] text-turquoise ${glow}`
  const digitMinutes = `tabular-nums text-[57.9px] font-bold leading-[60px] tracking-[-3px] text-turquoise ${glow}`
  const digitSeconds = `tabular-nums text-[59.9px] font-bold leading-[60px] tracking-[-3px] text-spring ${glow}`
  const colonClass =
    'shrink-0 text-[60px] font-bold leading-[60px] text-turquoise/30 translate-y-[-2px]'

  return (
    <section className="relative isolate overflow-hidden rounded-xl border border-turquoise/20 bg-[rgba(26,46,50,0.3)] p-8">
      <div
        className="pointer-events-none absolute inset-px rounded-[11px] bg-[linear-gradient(90deg,rgba(13,204,242,0.05)_0%,rgba(13,204,242,0)_50%,rgba(13,204,242,0.05)_100%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center">
        <p className="box-border min-h-9 pb-4 text-center text-sm font-bold uppercase leading-5 tracking-[4.2px] text-half-baked sm:whitespace-nowrap">
          До завершения спринта
        </p>
        <div className="flex w-full min-w-0 max-w-full items-start justify-center gap-[10px] md:gap-10">
          <div className="flex w-[69px] shrink-0 flex-col items-center">
            <span className={digitHours}>{pad2(h)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-half-baked">
              Часов
            </span>
          </div>
          <span className={colonClass} aria-hidden>
            :
          </span>
          <div className="flex w-[69px] shrink-0 flex-col items-center">
            <span className={digitMinutes}>{pad2(m)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-half-baked">
              Минут
            </span>
          </div>
          <span className={colonClass} aria-hidden>
            :
          </span>
          <div className="flex w-[60px] shrink-0 flex-col items-center">
            <span className={digitSeconds}>{pad2(s)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-spring">
              Секунд
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
