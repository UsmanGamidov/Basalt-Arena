/** Поиск решения: участник, спринт, id. */
export function solutionMatchesSearch(solution, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  const handle = String(solution?.handle ?? '').toLowerCase()
  const name = String(solution?.displayName ?? '').toLowerCase()
  const id = String(solution?.id ?? '').toLowerCase()
  const sprintTitle = String(solution?.sprintTitle ?? '').toLowerCase()
  const sprintId = String(solution?.sprintId ?? '').toLowerCase()
  return (
    handle.includes(q) ||
    name.includes(q) ||
    id.includes(q) ||
    `@${handle}`.includes(q) ||
    sprintTitle.includes(q) ||
    sprintId.includes(q)
  )
}
