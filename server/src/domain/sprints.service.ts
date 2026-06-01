import { Injectable, NotFoundException } from '@nestjs/common'
import { submissionStatusLabel } from '../common/presenters/submission.presenter'
import { SUBMISSION_BLOCKING_STATUSES } from '../common/constants/submission-status'
import { computeSprintHallMetrics, sprintTimingFields } from '../common/utils/sprint-timing.util'
import { PrismaService } from '../prisma/prisma.service'
import type { BasaltSessionUser } from '../types/session-user'

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSprints(opts?: { limit?: number; offset?: number }) {
    const limit = Math.min(100, Math.max(1, opts?.limit ?? 20))
    const offset = Math.max(0, opts?.offset ?? 0)

    const include = {
      solutions: { include: { likes: true, user: { select: { handle: true } } } },
      submissions: true,
    }

    const mainActive = await this.prisma.sprint.findFirst({
      where: { published: true, isMainActive: true },
      include,
    })
    const othersWhere = {
      published: true,
      ...(mainActive ? { id: { not: mainActive.id } } : {}),
    }
    const total = (await this.prisma.sprint.count({ where: { published: true } })) || 0

    let sprints
    if (offset === 0) {
      const othersTake = mainActive ? Math.max(0, limit - 1) : limit
      const others = await this.prisma.sprint.findMany({
        where: othersWhere,
        take: othersTake,
        include,
        orderBy: { createdAt: 'desc' },
      })
      sprints = mainActive ? [mainActive, ...others] : others
    } else {
      const othersSkip = mainActive ? Math.max(0, offset - 1) : offset
      sprints = await this.prisma.sprint.findMany({
        where: othersWhere,
        skip: othersSkip,
        take: limit,
        include,
        orderBy: { createdAt: 'desc' },
      })
    }

    const sprintItems = sprints.map((s) => {
      const parsedMetrics = JSON.parse(s.metricsJson || '{}') as Record<string, unknown>
      const metrics = computeSprintHallMetrics(s.submissions, s.solutions.length, parsedMetrics)
      const timing = sprintTimingFields(s)
      return {
        id: s.id,
        tabLabel: s.tabLabel,
        tabIcon: s.tabIcon,
        title: s.title,
        description: s.description ?? '',
        completedLabel: timing.completedLabel,
        endsAt: timing.endsAt,
        systemActive: timing.systemActive,
        isMainActive: s.isMainActive === true,
        prizeMoney: s.prizeMoney ?? 0,
        metrics,
      }
    })

    const pastWinners = await this.buildPastWinnersPreview()
    const loaded = sprintItems.length
    const loadMoreRemaining = Math.max(0, total - offset - loaded)

    return {
      page: {
        breadcrumbs: [{ label: 'Главная', muted: true }, { label: 'Зал славы' }],
        title: 'Зал славы',
        description: 'Лучшие решения спринтов Basalt Arena.',
      },
      quote: { text: 'Хороший код — это не магия, а дисциплина.', attribution: 'Basalt Team' },
      pastWinners,
      loadMoreRemaining,
      pagination: { total, limit, offset, hasMore: loadMoreRemaining > 0 },
      sprints: sprintItems,
    }
  }

  async getSprintById(id: string, viewer?: BasaltSessionUser | null) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    if (!sprint.published) throw new NotFoundException('Спринт не найден')

    const solutionRows = await this.prisma.solution.findMany({
      where: { sprintId: id },
      orderBy: [{ mentorScore: 'desc' }, { likes: { _count: 'desc' } }],
      include: {
        user: true,
        _count: { select: { likes: true } },
      },
    })

    const solutionIds = solutionRows.map((r) => r.id)
    const likedIdSet =
      viewer && solutionIds.length > 0
        ? new Set(
            (
              await this.prisma.solutionLike.findMany({
                where: { userId: viewer.id, solutionId: { in: solutionIds } },
                select: { solutionId: true },
              })
            ).map((row) => row.solutionId),
          )
        : null

    const tags = JSON.parse(sprint.tagsJson || '[]')
    const parsedMetrics = JSON.parse(sprint.metricsJson || '{}') as Record<string, unknown>
    const brief = JSON.parse(sprint.briefJson || '{}')
    const submissionRows = await this.prisma.submission.findMany({
      where: { sprintId: id },
      select: { status: true },
    })
    const metrics = computeSprintHallMetrics(
      submissionRows,
      solutionRows.length,
      parsedMetrics,
    )

    const solutions = solutionRows.map((s) => ({
      id: s.id,
      userId: s.userId,
      rank: s.rank,
      rankBadge: s.rankBadge ?? 'muted',
      avatarUrl: s.user.avatarUrl ?? '',
      displayName: s.user.displayName?.trim() ? s.user.displayName : s.user.handle,
      handle: s.user.handle,
      dateLabel: this.formatSolutionDateLabel(s.createdAt),
      createdAt: s.createdAt.toISOString(),
      mentorScore: s.mentorScore,
      profileUrl: '#',
      codeUrl: s.codeUrl,
      demoUrl: s.demoUrl ?? '#',
      likes: s._count.likes,
      likedByMe: !!(viewer && likedIdSet?.has(s.id)),
      showCrown: s.showCrown,
    }))

    const timing = sprintTimingFields(sprint)

    return {
      sprint: {
        id: sprint.id,
        tabLabel: sprint.tabLabel,
        tabIcon: sprint.tabIcon,
        title: sprint.title,
        heroTitle: sprint.title,
        description: sprint.description ?? '',
        completedLabel: timing.completedLabel,
        endsAt: timing.endsAt,
        systemActive: timing.systemActive,
        isMainActive: sprint.isMainActive === true,
        prizeMoney: sprint.prizeMoney ?? 0,
        tags,
        brief,
        metrics,
        solutions,
      },
    }
  }

  async getSprintSolutions(id: string, viewer?: BasaltSessionUser | null) {
    const data = await this.getSprintById(id, viewer)
    return data.sprint.solutions
  }

  async listMySprints(user: BasaltSessionUser) {
    const rows = await this.prisma.sprintEnrollment.findMany({
      where: { userId: user.id },
      include: { sprint: true },
      orderBy: { enrolledAt: 'desc' },
    })
    const sprintIds = rows.map((r) => r.sprint.id)
    const activeSubs =
      sprintIds.length > 0
        ? await this.prisma.submission.findMany({
            where: {
              userId: user.id,
              sprintId: { in: sprintIds },
              status: { in: [...SUBMISSION_BLOCKING_STATUSES] },
            },
            orderBy: { createdAt: 'desc' },
          })
        : []
    const activeBySprint = new Map<string, (typeof activeSubs)[number]>()
    for (const s of activeSubs) {
      if (!activeBySprint.has(s.sprintId)) activeBySprint.set(s.sprintId, s)
    }
    return {
      sprints: rows.map((r) => {
        const active = activeBySprint.get(r.sprint.id)
        const timing = sprintTimingFields(r.sprint)
        return {
          id: r.sprint.id,
          tabLabel: r.sprint.tabLabel,
          title: r.sprint.title,
          description: r.sprint.description ?? '',
          published: r.sprint.published,
          enrolledAt: r.enrolledAt.toISOString(),
          endsAt: timing.endsAt,
          systemActive: timing.systemActive,
          activeSubmission: active
            ? {
                id: active.id,
                status: active.status,
                statusLabel: submissionStatusLabel(active.status),
                canSubmit: false,
              }
            : null,
        }
      }),
    }
  }

  private formatSolutionDateLabel(d: Date) {
    const day = String(d.getUTCDate()).padStart(2, '0')
    const months = [
      'янв',
      'фев',
      'мар',
      'апр',
      'май',
      'июн',
      'июл',
      'авг',
      'сен',
      'окт',
      'ноя',
      'дек',
    ]
    return `${day} ${months[d.getUTCMonth()]}`
  }

  private async buildPastWinnersPreview(takeSprints = 40) {
    const rows = await this.prisma.sprint.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: takeSprints,
      include: {
        solutions: {
          where: { rank: 1 },
          take: 1,
          include: { user: { select: { handle: true } } },
        },
      },
    })
    const ordered = await this.prisma.sprint.findMany({
      where: { published: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    const orderById = new Map(ordered.map((s, i) => [s.id, i + 1]))

    return rows
      .filter((s) => s.solutions.length > 0)
      .slice(0, 5)
      .map((s) => {
        const x = s.solutions[0]
        const sprintRank = orderById.get(s.id) ?? 0
        return {
          sprintRank,
          title: sprintRank > 0 ? `Спринт #${sprintRank}` : s.title,
          handle: x.user.handle,
        }
      })
  }
}
