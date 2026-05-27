/** Проверка формы спринта в админке перед сохранением. */
export function validateSprintForm({ endsAtLocal, tagsText, prizeMoney }) {
  const errors = []
  if (!String(endsAtLocal ?? '').trim()) {
    errors.push('Укажите дедлайн спринта')
  } else {
    const d = new Date(endsAtLocal)
    if (Number.isNaN(d.getTime())) errors.push('Некорректная дата дедлайна')
  }
  try {
    const tags = JSON.parse(tagsText ?? '[]')
    if (!Array.isArray(tags)) errors.push('tags: нужен JSON-массив')
  } catch {
    errors.push('tags: невалидный JSON (нужен массив)')
  }
  const prize = Number(prizeMoney)
  if (!Number.isFinite(prize) || prize < 0) {
    errors.push('Сумма призовых должна быть числом >= 0')
  }
  return errors
}
