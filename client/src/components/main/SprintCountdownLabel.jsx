import { useEffect, useState } from 'react'
import { formatSprintCountdownLabel } from '../../lib/sprintTime.js'

/** Живой текст «До завершения: HH:MM:SS» по ISO-дедлайну из БД. */
export function SprintCountdownLabel({ endsAt, className = '' }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return <span className={className}>{formatSprintCountdownLabel(endsAt, now)}</span>
}
