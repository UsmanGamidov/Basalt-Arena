import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import {
  mapSubmissionForUser,
  submissionStatusLabel,
} from '../common/presenters/submission.presenter'
import { SUBMISSION_BLOCKING_STATUSES } from '../common/constants/submission-status'
import { isUniqueConstraintError } from '../common/utils/prisma-errors.util'
import { formatMoneyRub, normalizeMoneyRub } from '../common/utils/money.util'
import { sprintTimingFields } from '../common/utils/sprint-timing.util'
import { PrizeSettlementService } from './prize-settlement.service'
import { UserDerivedStatsService } from './user-derived-stats.service'
import { PrismaService } from '../prisma/prisma.service'
import type { BasaltSessionUser } from '../types/session-user'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prizeSettlement: PrizeSettlementService,
    private readonly derivedStats: UserDerivedStatsService,
  ) {}

  async getMe(user: BasaltSessionUser) {
    await this.prizeSettlement.settleClosedSprintPrizes()
    const fresh = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { achievements: true },
    })
    const u = fresh ?? user
    const prizeAgg = await this.prisma.sprint.aggregate({
      where: { prizeWinnerUserId: u.id, prizeAwardedAt: { not: null }, prizeMoney: { gt: 0 } },
      _sum: { prizeMoney: true },
    })
    const moneyEarnedRub = normalizeMoneyRub(prizeAgg._sum.prizeMoney ?? 0)
    if (moneyEarnedRub !== u.moneyEarned) {
      await this.prisma.user.update({
        where: { id: u.id },
        data: { moneyEarned: moneyEarnedRub },
      })
      u.moneyEarned = moneyEarnedRub
    }
    const moneyEarnedLabel = formatMoneyRub(u.moneyEarned)
    const [globalRank, sprintsCompleted] = await Promise.all([
      this.derivedStats.buildGlobalRankMap().then((m) =>
        this.derivedStats.globalRankFromMap(u.id, u.points, m),
      ),
      this.derivedStats.sprintsCompletedForUser(u.id),
    ])
    const cards = await this.buildStatsCards(u.id, { globalRank, sprintsCompleted, points: u.points })
    const leaderboard = await this.getLeaderboardStats(u.id)
    const notificationRows = await this.prisma.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
      take: 40,
    })

    return {
      user: {
        id: u.id,
        handle: u.handle,
        role: u.role,
        avatarUrl: u.avatarUrl ?? '',
        profile: {
          bio: u.bio,
          skillsLabel: u.skillsLabel,
          contacts: {
            telegram: u.telegram,
            email: u.email,
            github: u.github,
          },
          form: {
            username: u.handle,
            email: u.email,
            telegram: u.telegram,
            about: u.bio,
          },
        },
        stats: {
          points: u.points,
          globalRank,
          sprintsCompleted,
          moneyEarned: moneyEarnedLabel,
          leaderboardPosition: leaderboard.position,
          leaderboardSize: leaderboard.leaderboardSize,
          cards,
        },
        achievements: u.achievements.map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          icon: a.icon,
          variant: a.variant,
        })),
        sprintContext: await this.buildSprintContextForUser(u.id),
        sprintHistory: { items: await this.listUserSubmissionHistory(u.id) },
        notifications: {
          unreadCount: u.notificationsUnread,
          items: notificationRows.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            read: n.read,
            createdAt: n.createdAt.toISOString(),
          })),
        },
      },
    }
  }

  async patchMeProfile(
    user: BasaltSessionUser,
    payload: { form?: { username?: string; email?: string; telegram?: string; about?: string } },
  ) {
    if (!payload.form) {
      return { ok: true, profile: null }
    }
    const username =
      String(payload.form.username ?? user.handle).replace(/^@/, '').trim().toLowerCase() || user.handle
    if (username.length < 2) {
      throw new BadRequestException('Логин должен быть не короче 2 символов')
    }
    const about = String(payload.form.about ?? user.bio)
    const telegram = String(payload.form.telegram ?? user.telegram)
    const email = String(payload.form.email ?? user.email)
      .trim()
      .toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Укажите корректный email')
    }
    const emailTaken = await this.prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    })
    if (emailTaken) {
      throw new ConflictException('Этот email уже занят')
    }
    const handleTaken = await this.prisma.user.findFirst({
      where: { handle: username, NOT: { id: user.id } },
      select: { id: true },
    })
    if (handleTaken) {
      throw new ConflictException('Этот логин уже занят')
    }
    const github = `/${username}`
    let updated
    try {
      updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          handle: username,
          bio: about,
          telegram,
          email,
          github,
        },
      })
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw new ConflictException('Логин или email уже заняты')
      }
      throw e
    }

    return {
      ok: true,
      profile: {
        bio: updated.bio,
        skillsLabel: updated.skillsLabel,
        contacts: {
          telegram: updated.telegram,
          email: updated.email,
          github: updated.github,
        },
        form: {
          username: updated.handle,
          email: updated.email,
          telegram: updated.telegram,
          about: updated.bio,
        },
      },
    }
  }

  async readNotifications(user: BasaltSessionUser) {
    await this.prisma.$transaction([
      this.prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { notificationsUnread: 0 },
      }),
    ])
    return { unreadCount: 0 }
  }

  /** Главный спринт (isMainActive) — для главной и POST /v2/submissions. */
  async buildSprintContextForUser(userId: string) {
    const mainSprint = await this.prisma.sprint.findFirst({
      where: { isMainActive: true },
    })
    if (!mainSprint) {
      return {
        activeSprint: null,
        enrolled: false,
        activeSubmission: null,
        title: '',
        description: '',
        tabLabel: '',
        completedLabel: '',
        brief: {} as Record<string, unknown>,
        systemActive: false,
        endsAt: null as string | null,
      }
    }

    const enrollment = await this.prisma.sprintEnrollment.findUnique({
      where: { userId_sprintId: { userId, sprintId: mainSprint.id } },
      select: { id: true },
    })

    let activeSubmission: {
      id: string
      status: string
      statusLabel: string
      mentorScore: number | null
    } | null = null
    if (enrollment) {
      const blocking = await this.prisma.submission.findFirst({
        where: {
          userId,
          sprintId: mainSprint.id,
          status: { in: [...SUBMISSION_BLOCKING_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (blocking) {
        let validBlocking = true
        if (blocking.status === 'approved') {
          const hasSolution = await this.prisma.solution.findFirst({
            where: { sprintId: mainSprint.id, userId },
            select: { id: true },
          })
          if (!hasSolution) {
            validBlocking = false
          }
        }
        if (validBlocking) {
          let mentorScore: number | null = null
          if (blocking.status === 'approved') {
            const sol = await this.prisma.solution.findFirst({
              where: { sprintId: mainSprint.id, userId },
              select: { mentorScore: true },
            })
            mentorScore = sol?.mentorScore ?? blocking.mentorScore
          }
          activeSubmission = {
            id: blocking.id,
            status: blocking.status,
            statusLabel: submissionStatusLabel(blocking.status),
            mentorScore,
          }
        }
      }
    }

    let brief: Record<string, unknown>
    try {
      brief = JSON.parse(mainSprint.briefJson || '{}') as Record<string, unknown>
    } catch {
      brief = {}
    }

    const timing = sprintTimingFields(mainSprint)

    return {
      activeSprint: mainSprint.id,
      enrolled: Boolean(enrollment),
      activeSubmission,
      title: mainSprint.title,
      tabLabel: mainSprint.tabLabel,
      description: mainSprint.description ?? '',
      completedLabel: timing.completedLabel,
      brief,
      systemActive: timing.systemActive,
      endsAt: timing.endsAt,
    }
  }

  private async getLeaderboardStats(userId: string) {
    const leaderboardSize = await this.prisma.user.count()
    const ranked = await this.prisma.user.findMany({
      where: { points: { gt: 0 } },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
      select: { id: true },
    })
    const idx = ranked.findIndex((u) => u.id === userId)
    const position = idx >= 0 ? idx + 1 : 0
    return { position, leaderboardSize: Math.max(leaderboardSize, 1) }
  }

  private async solutionMentorScoreBySprint(
    userId: string,
    sprintIds: string[],
  ): Promise<Map<string, number>> {
    if (sprintIds.length === 0) return new Map()
    const solutions = await this.prisma.solution.findMany({
      where: { userId, sprintId: { in: sprintIds } },
      select: { sprintId: true, mentorScore: true },
    })
    return new Map(solutions.map((s) => [s.sprintId, s.mentorScore]))
  }

  private resolveApprovedMentorScore(
    status: string,
    sprintId: string,
    submissionScore: number | null,
    solutionScores: Map<string, number>,
  ): number | null {
    if (status !== 'approved') return null
    const fromSolution = solutionScores.get(sprintId)
    if (fromSolution != null) return fromSolution
    return submissionScore
  }

  private async listUserSubmissionHistory(userId: string, take = 50) {
    const rows = await this.prisma.submission.findMany({
      where: {
        userId,
        status: { in: ['pending_review', 'approved', 'deleted_by_user'] },
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        sprint: { select: { id: true, title: true, tabLabel: true } },
      },
    })
    const sprintIds = [...new Set(rows.map((r) => r.sprintId))]
    const solutionScores = await this.solutionMentorScoreBySprint(userId, sprintIds)
    return rows.map((r) => {
      const item = mapSubmissionForUser(r)
      item.mentorScore = this.resolveApprovedMentorScore(
        r.status,
        r.sprintId,
        r.mentorScore,
        solutionScores,
      )
      return item
    })
  }

  private pluralRu(n: number, one: string, few: string, many: string) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
  }

  private async buildStatsCards(
    userId: string,
    live: { points: number; globalRank: string; sprintsCompleted: number },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        moneyEarned: true,
      },
    })
    if (!user) return []

    const [lb, solutionsCount, enrollmentsCount] = await Promise.all([
      this.getLeaderboardStats(userId),
      this.prisma.solution.count({ where: { userId } }),
      this.prisma.sprintEnrollment.count({ where: { userId } }),
    ])
    const winsWithPrize = await this.prisma.sprint.count({
      where: { prizeWinnerUserId: userId, prizeAwardedAt: { not: null }, prizeMoney: { gt: 0 } },
    })

    const pointsTrend =
      solutionsCount > 0
        ? `${solutionsCount} ${this.pluralRu(solutionsCount, 'решение', 'решения', 'решений')} в зале`
        : 'Нет решений в зале славы'

    const rankTrend =
      live.points > 0 && lb.position > 0
        ? `Место ${lb.position} из ${lb.leaderboardSize}`
        : 'Нет баллов в рейтинге'

    const sprintsTrend =
      live.sprintsCompleted > 0
        ? `${live.sprintsCompleted} ${this.pluralRu(live.sprintsCompleted, 'спринт', 'спринта', 'спринтов')} одобрено`
        : enrollmentsCount > 0
          ? `${enrollmentsCount} ${this.pluralRu(enrollmentsCount, 'спринт', 'спринта', 'спринтов')} в работе`
          : 'Нет завершённых спринтов'

    const moneyTrend =
      winsWithPrize > 0
        ? `${winsWithPrize} ${this.pluralRu(winsWithPrize, 'победа', 'победы', 'побед')} в закрытых спринтах`
        : 'Пока нет призовых побед'

    return [
      {
        key: 'points',
        label: 'Всего баллов',
        value: String(live.points),
        trendLabel: pointsTrend,
        trendVariant: 'malachite',
        icon: 'military_tech',
        iconTint: 'turquoise',
      },
      {
        key: 'rank',
        label: 'Глобальный ранг',
        value: live.globalRank,
        trendLabel: rankTrend,
        trendVariant: 'malachite',
        icon: 'query_stats',
        iconTint: 'turquoise',
      },
      {
        key: 'sprints',
        label: 'Спринтов пройдено',
        value: String(live.sprintsCompleted),
        trendLabel: sprintsTrend,
        trendVariant: 'turquoise',
        icon: 'bolt',
        iconTint: 'turquoise',
      },
      {
        key: 'money',
        label: 'Заработано денег',
        value: formatMoneyRub(user.moneyEarned),
        trendLabel: moneyTrend,
        trendVariant: 'spring',
        icon: 'payments',
        iconTint: 'spring',
      },
    ]
  }
}
