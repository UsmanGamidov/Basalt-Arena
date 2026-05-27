/** Следующий числовой id спринта: max(существующих) + 1. */
export function nextSprintId(sprints) {
  let max = 0
  for (const s of sprints ?? []) {
    const n = Number.parseInt(String(s?.id ?? ''), 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1)
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Префикс «#3 » для полного названия. */
export function sprintTitleHashPrefix(id) {
  const n = String(id ?? '').trim()
  return n ? `#${n} ` : ''
}

/** Часть названия без префикса — для поля ввода в админке. */
export function sprintTitleEditablePart(storedTitle, id) {
  const raw = String(storedTitle ?? '').trim()
  const n = String(id ?? '').trim()
  if (!raw) return ''
  if (!n) return raw
  const re = new RegExp(`^(?:Спринт\\s+)?#${escapeRegex(n)}(?:\\s+|$)`, 'i')
  return raw.replace(re, '').trim()
}

/**
 * Полное название: «#3 basalt arena (front)».
 * @param {string} id — id спринта
 * @param {string} namePart — ввод пользователя без хештега
 */
export function formatSprintTitle(id, namePart) {
  const n = String(id ?? '').trim()
  const part = String(namePart ?? '').trim()
  if (!n) return part
  if (!part) return `#${n}`
  return `${sprintTitleHashPrefix(n)}${part}`
}

/** Метка вкладки в зале по умолчанию. */
export function sprintDefaultTabLabel(id) {
  const n = String(id ?? '').trim()
  return n ? `#${n}` : ''
}

/** @deprecated Используйте formatSprintTitle */
export function sprintDisplayTitle(id) {
  return formatSprintTitle(id, '')
}
