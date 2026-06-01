export function sprintDeadlinePassed(endsAt: Date | null, at = Date.now()): boolean {
  return endsAt != null && endsAt.getTime() <= at
}

export function sprintAcceptsSubmissions(sprint: {
  published: boolean
  endsAt: Date | null
}): boolean {
  return sprint.published && !sprintDeadlinePassed(sprint.endsAt)
}

export function sprintCountdownLabel(endsAt: Date | null, at = Date.now()): string {
  if (endsAt == null) return 'Дедлайн не задан'
  const ms = endsAt.getTime() - at
  if (ms <= 0) return 'Спринт завершён'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `До завершения: ${pad(h)}:${pad(m)}:${pad(s)}`
}

export function sprintTimingFields(sprint: { published: boolean; endsAt: Date | null }) {
  return {
    endsAt: sprint.endsAt?.toISOString() ?? null,
    systemActive: sprintAcceptsSubmissions(sprint),
    completedLabel: sprintCountdownLabel(sprint.endsAt),
  }
}

export function parseOptionalIsoDate(value?: string | null): Date | null {
  const v = value?.trim()
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function computeSprintHallMetrics(
  submissions: { status: string }[],
  solutionsCount: number,
  parsedMetrics: Record<string, unknown>,
) {
  const total = submissions.length
  const approved = submissions.filter((s) => s.status === 'approved').length
  const deletedByUser = submissions.filter((s) => s.status === 'deleted_by_user').length
  const resolved = approved + deletedByUser
  const successRate =
    resolved > 0
      ? `${Math.round((approved / resolved) * 100)}%`
      : total > 0
        ? `${Math.round((approved / total) * 100)}%`
        : '0%'

  return {
    submissions: total,
    submissionsBarPct: total > 0 ? Math.min(100, Math.max(8, Math.round((total / 50) * 100))) : 0,
    deltaLabel:
      typeof parsedMetrics.deltaLabel === 'string' ? parsedMetrics.deltaLabel : '+0 за сутки',
    successRate,
    verifiedSolutions: solutionsCount,
  }
}
