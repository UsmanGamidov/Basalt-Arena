export const HALL_SOLUTION_SORT_OPTIONS = [
  { value: 'mentor-desc', label: 'Балл наставника' },
  { value: 'likes-desc', label: 'Лайки' },
  { value: 'rank-asc', label: 'Призовое место' },
  { value: 'date-desc', label: 'Дата публикации' },
]

function ts(iso) {
  const t = Date.parse(String(iso ?? ''))
  return Number.isFinite(t) ? t : 0
}

function byHandle(a, b) {
  return String(a.handle ?? '').localeCompare(String(b.handle ?? ''), 'ru', { sensitivity: 'base' })
}

/** @param {object[]} solutions @param {string} sortKey */
export function sortHallSolutions(solutions, sortKey) {
  const list = [...solutions]
  switch (sortKey) {
    case 'mentor-asc':
      list.sort((a, b) => (a.mentorScore ?? 0) - (b.mentorScore ?? 0) || (b.likes ?? 0) - (a.likes ?? 0))
      break
    case 'likes-desc':
      list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || (b.mentorScore ?? 0) - (a.mentorScore ?? 0))
      break
    case 'likes-asc':
      list.sort((a, b) => (a.likes ?? 0) - (b.likes ?? 0) || (b.mentorScore ?? 0) - (a.mentorScore ?? 0))
      break
    case 'rank-asc':
      list.sort(
        (a, b) =>
          (a.rank ?? 99) - (b.rank ?? 99) ||
          (b.mentorScore ?? 0) - (a.mentorScore ?? 0) ||
          byHandle(a, b),
      )
      break
    case 'date-desc':
      list.sort((a, b) => ts(b.createdAt) - ts(a.createdAt) || byHandle(a, b))
      break
    case 'date-asc':
      list.sort((a, b) => ts(a.createdAt) - ts(b.createdAt) || byHandle(a, b))
      break
    case 'handle-asc':
      list.sort(byHandle)
      break
    case 'mentor-desc':
    default:
      list.sort(
        (a, b) =>
          (b.mentorScore ?? 0) - (a.mentorScore ?? 0) || (b.likes ?? 0) - (a.likes ?? 0),
      )
  }
  return list
}
