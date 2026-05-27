/** Поиск по handle, email, имени. */
export function userMatchesSearch(user, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  const handle = String(user?.handle ?? '').toLowerCase()
  const email = String(user?.email ?? '').toLowerCase()
  const name = String(user?.displayName ?? '').toLowerCase()
  return (
    handle.includes(q) ||
    email.includes(q) ||
    name.includes(q) ||
    `@${handle}`.includes(q)
  )
}

/** Добавляет « ₽» в конец, если есть текст и ещё нет знака рубля. */
export function formatMoneyEarnedWithRub(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (/₽\s*$/u.test(trimmed)) return trimmed
  const core = trimmed.replace(/\s*₽\s*$/u, '').trim()
  if (!core) return ''
  return `${core} ₽`
}
