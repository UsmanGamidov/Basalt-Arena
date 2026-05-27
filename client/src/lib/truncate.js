export function truncateWithEllipsis(value, max = 72) {
  const text = String(value ?? '')
  if (text.length <= max) return text
  if (max < 8) return `${text.slice(0, Math.max(1, max - 1))}…`
  return `${text.slice(0, max - 1)}…`
}
