export const MENTOR_SCORE_MIN = 0
export const MENTOR_SCORE_MAX = 100

/** Целый балл за спринт в допустимом диапазоне. */
export function clampMentorScore(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return MENTOR_SCORE_MIN
  return Math.min(MENTOR_SCORE_MAX, Math.max(MENTOR_SCORE_MIN, Math.round(n)))
}

export function isValidMentorScore(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= MENTOR_SCORE_MIN && n <= MENTOR_SCORE_MAX
}

export function mentorScoreRangeHint() {
  return `${MENTOR_SCORE_MIN}–${MENTOR_SCORE_MAX}`
}
