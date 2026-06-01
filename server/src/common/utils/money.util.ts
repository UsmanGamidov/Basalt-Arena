/** Сумма призовых в рублях (целое, ≥ 0). */
export function normalizeMoneyRub(amount: unknown): number {
  const n = Math.trunc(Number(amount) || 0)
  return Math.max(0, n)
}

/** Отображение для UI/API: «12 500 ₽». */
export function formatMoneyRub(amount: unknown): string {
  const safe = normalizeMoneyRub(amount)
  return `${safe.toLocaleString('ru-RU')} ₽`
}

/** Парсинг legacy-значения из БД (строка «12 500 ₽» или число). */
export function parseLegacyMoneyEarned(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return normalizeMoneyRub(value)
  }
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  return digits ? normalizeMoneyRub(Number(digits)) : 0
}
