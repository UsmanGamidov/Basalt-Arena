import { useEffect, useMemo, useState } from 'react'
import { parseEndsAt } from '../../lib/sprintTime.js'

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function SprintTimer({ endAt }) {
  const target = useMemo(() => parseEndsAt(endAt), [endAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!target) {
    return (
      <section className="relative isolate overflow-hidden rounded-xl border border-plantation/80 bg-timber/40 p-8 text-center max-[360px]:p-4">
        <p className="font-mono text-sm text-half-baked">
          Дедлайн спринта не задан. Администратор укажет дату окончания в админке.
        </p>
      </section>
    )
  }

  const ms = Math.max(0, target.getTime() - now)
  const ended = ms <= 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const glow = '[text-shadow:0_0_10px_rgba(13,204,242,0.5)]'
  const digitHours = `tabular-nums text-[57.5px] font-bold leading-[60px] tracking-[-3px] text-turquoise max-[360px]:text-[48px] max-[360px]:leading-[50px] max-[360px]:tracking-[-2px] ${glow}`
  const digitMinutes = `tabular-nums text-[57.9px] font-bold leading-[60px] tracking-[-3px] text-turquoise max-[360px]:text-[48px] max-[360px]:leading-[50px] max-[360px]:tracking-[-2px] ${glow}`
  const digitSeconds = `tabular-nums text-[59.9px] font-bold leading-[60px] tracking-[-3px] text-spring max-[360px]:text-[50px] max-[360px]:leading-[50px] max-[360px]:tracking-[-2px] ${glow}`
  const colonClass =
    'shrink-0 text-[60px] font-bold leading-[60px] text-turquoise/30 translate-y-[-2px] max-[360px]:text-[48px] max-[360px]:leading-[50px]'

  return (
    <section className="relative isolate overflow-hidden rounded-xl border border-turquoise/20 bg-[rgba(26,46,50,0.3)] p-8 max-[360px]:p-4">
      <div
        className="pointer-events-none absolute inset-px rounded-[11px] bg-[linear-gradient(90deg,rgba(13,204,242,0.05)_0%,rgba(13,204,242,0)_50%,rgba(13,204,242,0.05)_100%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center">
        <p className="box-border min-h-9 pb-4 text-center text-sm font-bold uppercase leading-5 tracking-[4.2px] text-half-baked max-[360px]:pb-2 max-[360px]:text-[11px] max-[360px]:leading-4 max-[360px]:tracking-[3px] sm:whitespace-nowrap">
          {ended ? 'Спринт завершён' : 'До завершения спринта'}
        </p>
        <div className="flex w-full min-w-0 max-w-full items-start justify-center gap-[10px] max-[360px]:gap-2 md:gap-10">
          <div className="flex w-[69px] shrink-0 flex-col items-center max-[360px]:w-[56px]">
            <span className={digitHours}>{pad2(h)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-half-baked max-[360px]:mt-1 max-[360px]:text-[9px] max-[360px]:leading-3">
              Часов
            </span>
          </div>
          <span className={colonClass} aria-hidden>
            :
          </span>
          <div className="flex w-[69px] shrink-0 flex-col items-center max-[360px]:w-[56px]">
            <span className={digitMinutes}>{pad2(m)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-half-baked max-[360px]:mt-1 max-[360px]:text-[9px] max-[360px]:leading-3">
              Минут
            </span>
          </div>
          <span className={colonClass} aria-hidden>
            :
          </span>
          <div className="flex w-[60px] shrink-0 flex-col items-center max-[360px]:w-[50px]">
            <span className={digitSeconds}>{pad2(s)}</span>
            <span className="mt-2 text-[10px] font-normal uppercase leading-[15px] tracking-[1px] text-spring max-[360px]:mt-1 max-[360px]:text-[9px] max-[360px]:leading-3">
              Секунд
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
