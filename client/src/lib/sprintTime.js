/** @param {string | Date | null | undefined} endsAt */
export function parseEndsAt(endsAt) {
  if (endsAt instanceof Date && !Number.isNaN(endsAt.getTime())) return endsAt
  if (typeof endsAt === 'string' && endsAt.trim()) {
    const d = new Date(endsAt)
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

/** @param {string | Date | null | undefined} endsAt @param {number} [now] */
export function isSprintDeadlinePassed(endsAt, now = Date.now()) {
  const d = parseEndsAt(endsAt)
  return d != null && d.getTime() <= now
}

/** @param {boolean | undefined} published @param {string | Date | null | undefined} endsAt */
export function isSprintAcceptingSubmissions(published, endsAt) {
  if (published === false) return false
  return !isSprintDeadlinePassed(endsAt)
}

/** @param {string | Date | null | undefined} endsAt @param {number} [now] */
export function formatSprintCountdownLabel(endsAt, now = Date.now()) {
  const d = parseEndsAt(endsAt)
  if (!d) return 'Дедлайн не задан'
  const ms = d.getTime() - now
  if (ms <= 0) return 'Спринт завершён'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `До завершения: ${pad(h)}:${pad(m)}:${pad(s)}`
}
