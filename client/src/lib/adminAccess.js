/** @param {Set<string>} enrolled @param {Set<string>} draft */
export function countAccessEnrollmentDiff(enrolled, draft) {
  let n = 0
  for (const id of enrolled) {
    if (!draft.has(id)) n += 1
  }
  for (const id of draft) {
    if (!enrolled.has(id)) n += 1
  }
  return n
}

/** Зачисленные (отмеченные) — первыми, затем по handle. */
export function sortUsersForAccessList(users, selectedIds) {
  return [...users].sort((a, b) => {
    const ac = selectedIds.has(a.id) ? 0 : 1
    const bc = selectedIds.has(b.id) ? 0 : 1
    if (ac !== bc) return ac - bc
    return String(a.handle ?? '').localeCompare(String(b.handle ?? ''), 'ru', {
      sensitivity: 'base',
    })
  })
}

export function enrolledUserIdsFromParticipants(participants) {
  return new Set(
    (Array.isArray(participants) ? participants : [])
      .map((p) => p.user?.id)
      .filter(Boolean),
  )
}
