/** Поиск отправки: участник, спринт, статус. */
export function submissionMatchesSearch(row, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  const handle = String(row?.handle ?? '').toLowerCase()
  const email = String(row?.email ?? '').toLowerCase()
  const sprintTitle = String(row?.sprintTitle ?? '').toLowerCase()
  const sprintTab = String(row?.sprintTabLabel ?? '').toLowerCase()
  const sprintId = String(row?.sprintId ?? '').toLowerCase()
  const status = String(row?.status ?? '').toLowerCase()
  const statusLabel = String(row?.statusLabel ?? '').toLowerCase()
  return (
    handle.includes(q) ||
    email.includes(q) ||
    `@${handle}`.includes(q) ||
    sprintTitle.includes(q) ||
    sprintTab.includes(q) ||
    sprintId.includes(q) ||
    status.includes(q) ||
    statusLabel.includes(q)
  )
}

export function formatSubmissionSprintLabel(row) {
  const title = String(row?.sprintTitle ?? '').trim()
  const tab = String(row?.sprintTabLabel ?? '').trim()
  if (!title) return tab || '—'
  if (!tab) return title
  return title.toLowerCase() === tab.toLowerCase() ? title : `${title} · ${tab}`
}

export function submissionStatusClass(status) {
  switch (status) {
    case 'pending_review':
      return 'text-turquoise'
    case 'deleted_by_user':
      return 'text-amber-300'
    case 'approved':
      return 'text-spring'
    case 'deleted_by_admin':
      return 'text-gull'
    default:
      return 'text-gull'
  }
}

export const SUBMISSION_STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending_review', label: 'На проверке' },
  { value: 'approved', label: 'Принято' },
  { value: 'deleted_by_admin', label: 'Удалено админом' },
  { value: 'deleted_by_user', label: 'Удалено пользователем' },
]

export const SUBMISSION_SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Дата (новые)' },
  { value: 'createdAt-asc', label: 'Дата (старые)' },
  { value: 'mentorScore-desc', label: 'Балл (больше)' },
  { value: 'mentorScore-asc', label: 'Балл (меньше)' },
  { value: 'handle-asc', label: 'Участник (А-Я)' },
  { value: 'handle-desc', label: 'Участник (Я-А)' },
  { value: 'status-asc', label: 'Статус (А-Я)' },
  { value: 'status-desc', label: 'Статус (Я-А)' },
]

export function submissionMatchesStatus(row, status) {
  const selected = String(status ?? '').trim()
  if (!selected) return true
  return String(row?.status ?? '') === selected
}

export function sortSubmissions(rows, sortKey) {
  const key = String(sortKey ?? 'createdAt-desc')
  const list = Array.isArray(rows) ? [...rows] : []
  const byDate = (a, b) =>
    new Date(a?.submittedAt ?? 0).getTime() - new Date(b?.submittedAt ?? 0).getTime()
  const byScore = (a, b) => Number(a?.mentorScore ?? -1) - Number(b?.mentorScore ?? -1)
  const byHandle = (a, b) => String(a?.handle ?? '').localeCompare(String(b?.handle ?? ''), 'ru')
  const byStatus = (a, b) =>
    String(a?.statusLabel ?? a?.status ?? '').localeCompare(String(b?.statusLabel ?? b?.status ?? ''), 'ru')

  switch (key) {
    case 'createdAt-asc':
      return list.sort(byDate)
    case 'mentorScore-desc':
      return list.sort((a, b) => byScore(b, a))
    case 'mentorScore-asc':
      return list.sort(byScore)
    case 'handle-asc':
      return list.sort(byHandle)
    case 'handle-desc':
      return list.sort((a, b) => byHandle(b, a))
    case 'status-asc':
      return list.sort(byStatus)
    case 'status-desc':
      return list.sort((a, b) => byStatus(b, a))
    case 'createdAt-desc':
    default:
      return list.sort((a, b) => byDate(b, a))
  }
}
