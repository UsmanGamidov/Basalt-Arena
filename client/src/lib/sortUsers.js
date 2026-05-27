/** @typedef {{ id: string, handle?: string, points?: number, globalRank?: string, sprintsCompleted?: number, createdAt?: string }} AdminUser */

export const USER_SORT_OPTIONS = [
  { value: 'points-desc', label: 'Баллы ↓' },
  { value: 'points-asc', label: 'Баллы ↑' },
  { value: 'createdAt-desc', label: 'Регистрация (новые)' },
  { value: 'createdAt-asc', label: 'Регистрация (старые)' },
  { value: 'handle-asc', label: 'Handle A→Я' },
  { value: 'handle-desc', label: 'Handle Я→A' },
  { value: 'rank-asc', label: 'Место в рейтинге' },
  { value: 'sprints-desc', label: 'Спринтов ↓' },
]

function rankNum(rank) {
  const n = Number(String(rank ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 999999
}

function ts(iso) {
  const t = Date.parse(String(iso ?? ''))
  return Number.isFinite(t) ? t : 0
}

/** @param {AdminUser[]} users @param {string} sortKey */
export function sortUsers(users, sortKey) {
  const list = [...users]
  const byHandle = (a, b) =>
    String(a.handle ?? '').localeCompare(String(b.handle ?? ''), 'ru', { sensitivity: 'base' })

  switch (sortKey) {
    case 'points-asc':
      list.sort((a, b) => (a.points ?? 0) - (b.points ?? 0) || byHandle(a, b))
      break
    case 'createdAt-desc':
      list.sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || byHandle(a, b))
      break
    case 'createdAt-asc':
      list.sort((a, b) => ts(a.createdAt) - ts(b.createdAt) || byHandle(a, b))
      break
    case 'handle-asc':
      list.sort(byHandle)
      break
    case 'handle-desc':
      list.sort((a, b) => byHandle(b, a))
      break
    case 'rank-asc':
      list.sort((a, b) => rankNum(a.globalRank) - rankNum(b.globalRank) || byHandle(a, b))
      break
    case 'sprints-desc':
      list.sort(
        (a, b) =>
          (b.sprintsCompleted ?? 0) - (a.sprintsCompleted ?? 0) || byHandle(a, b),
      )
      break
    case 'points-desc':
    default:
      list.sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0) || rankNum(a.globalRank) - rankNum(b.globalRank),
      )
  }
  return list
}
