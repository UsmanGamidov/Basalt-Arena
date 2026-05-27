import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from './prisma/prisma.service'
import type { BasaltSessionUser } from './types/session-user'

const PASSWORD_HASH_ROUNDS = 10

/** Статусы, при которых участник не может отправить новую посылку в тот же спринт. */
const SUBMISSION_BLOCKING_STATUSES = ['pending_review', 'deleted_by_user', 'approved'] as const
type AdminActor = { id: string; handle?: string | null } | null | undefined

const PRIZE_SETTLEMENT_INTERVAL_MS = 60_000

@Injectable()
export class MockDbService implements OnModuleInit, OnModuleDestroy {
  private prizeSettlementTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.migrateLegacySubmissionStatuses()
    await this.backfillAchievementDefinitionLinks()
    await this.reconcileAllUsersPointsFromSolutions()
    await this.upgradeLegacyPasswordHashes()
    this.prizeSettlementTimer = setInterval(() => {
      void this.runPrizeSettlementTick()
    }, PRIZE_SETTLEMENT_INTERVAL_MS)
    this.prizeSettlementTimer.unref?.()
  }

  onModuleDestroy() {
    if (this.prizeSettlementTimer) {
      clearInterval(this.prizeSettlementTimer)
      this.prizeSettlementTimer = null
    }
  }

  private async runPrizeSettlementTick() {
    try {
      await this.settleClosedSprintPrizes()
    } catch (error) {
      console.error('[prize-settlement] tick failed', error)
    }
  }

  private async migrateLegacySubmissionStatuses() {
    await this.prisma.submission.updateMany({
      where: { status: 'rejected' },
      data: {
        status: 'deleted_by_admin',
        reviewNote:
          'Статус автоматически мигрирован: "на доработке" больше не используется, запись переведена в "удалено админом".',
        reviewedAt: new Date(),
      },
    })
  }

  private isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value)
  }

  private hashPassword(plain: string) {
    return bcrypt.hash(plain, PASSWORD_HASH_ROUNDS)
  }

  private async verifyPassword(stored: string, plain: string) {
    if (this.isBcryptHash(stored)) return bcrypt.compare(plain, stored)
    return stored === plain
  }

  /** Однократный апгрейд старых записей с паролем в открытом виде. */
  private async upgradeLegacyPasswordHashes() {
    const users = await this.prisma.user.findMany({
      select: { id: true, passwordHash: true },
    })
    for (const u of users) {
      if (this.isBcryptHash(u.passwordHash)) continue
      await this.prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: await this.hashPassword(u.passwordHash) },
      })
    }
  }

  /** Дата публикации решения для карточки в зале (UTC, «06 май»). */
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

  /** ISO-строка → Date или null; пустая строка → null. */
  private parseOptionalIsoDate(value?: string | null): Date | null {
    const v = value?.trim()
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }

  private sprintDeadlinePassed(endsAt: Date | null, at = Date.now()): boolean {
    return endsAt != null && endsAt.getTime() <= at
  }

  /** Приём решений: опубликован и дедлайн ещё не наступил. */
  private sprintAcceptsSubmissions(sprint: { published: boolean; endsAt: Date | null }): boolean {
    return sprint.published && !this.sprintDeadlinePassed(sprint.endsAt)
  }

  private sprintCountdownLabel(endsAt: Date | null, at = Date.now()): string {
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

  private sprintTimingFields(sprint: { published: boolean; endsAt: Date | null }) {
    return {
      endsAt: sprint.endsAt?.toISOString() ?? null,
      systemActive: this.sprintAcceptsSubmissions(sprint),
      completedLabel: this.sprintCountdownLabel(sprint.endsAt),
    }
  }

  /** Метрики зала славы из реальных отправок спринта. */
  private computeSprintHallMetrics(
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
      deltaLabel: typeof parsedMetrics.deltaLabel === 'string' ? parsedMetrics.deltaLabel : '+0 за сутки',
      successRate,
      verifiedSolutions: solutionsCount,
    }
  }

  private async issueAccessToken(userId: string, longLived: boolean) {
    return this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: longLived ? '30d' : '12h' },
    )
  }

  async login(loginOrEmail: string, password: string, rememberSession = true) {
    const normalized = loginOrEmail.trim().toLowerCase().replace(/^@/, '')
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { handle: normalized }],
      },
    })
    if (!user || !(await this.verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException('Неверный логин или пароль')
    }
    const token = await this.issueAccessToken(user.id, rememberSession)
    return { token, user: this.toPublicUser(user) }
  }

  async register(payload: { handle: string; email: string; password: string }) {
    const handle = payload.handle.trim().replace(/^@/, '').toLowerCase()
    const email = payload.email.trim().toLowerCase()
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { handle }] },
      select: { id: true },
    })
    if (exists) throw new UnauthorizedException('Пользователь уже существует')

    const user = await this.prisma.user.create({
      data: {
        handle,
        email,
        passwordHash: await this.hashPassword(payload.password),
        role: 'user',
        avatarUrl: '',
        notificationsUnread: 0,
        points: 0,
        globalRank: '#0',
        sprintsCompleted: 0,
        moneyEarned: '0 ₽',
        bio: 'Новый участник Basalt Arena.',
        skillsLabel: 'JavaScript',
        displayName: '',
        telegram: `@${handle}`,
        github: `/${handle}`,
      },
    })
    const token = await this.issueAccessToken(user.id, true)
    return { token, user: this.toPublicUser(user) }
  }

  async logout(token?: string) {
    void token
    return { ok: true }
  }

  private async getUserByTokenOrThrow(token?: string) {
    if (!token) throw new UnauthorizedException('Требуется авторизация')

    let payload: { sub?: string } | null = null
    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string }>(token)
    } catch {
      payload = null
    }
    const userId = payload?.sub
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { achievements: true },
      })
      if (user) return user
    }
    throw new UnauthorizedException('Токен невалиден')
  }

  private async getAdminByTokenOrThrow(token?: string) {
    const user = await this.getUserByTokenOrThrow(token)
    if (user.role !== 'admin') {
      throw new UnauthorizedException('Требуются права администратора')
    }
    return user
  }

  private extractBearerToken(authHeader?: string) {
    const raw = String(authHeader ?? '').trim()
    if (!raw) return undefined
    const m = raw.match(/^Bearer\s+(.+)$/i)
    if (!m?.[1]) return undefined
    const token = m[1].trim()
    return token || undefined
  }

  /** Проверка `Authorization: Bearer …` и роли admin (для AdminGuard). */
  async assertAdminFromAuthHeader(authHeader?: string) {
    const token = this.extractBearerToken(authHeader)
    return this.getAdminByTokenOrThrow(token)
  }

  /** Любой валидный Bearer JWT — для AuthGuard. */
  async assertSessionFromAuthHeader(authHeader?: string): Promise<BasaltSessionUser> {
    const token = this.extractBearerToken(authHeader)
    const user = await this.getUserByTokenOrThrow(token)
    return user as BasaltSessionUser
  }

  /** То же, что assertSession, но без исключения — для опциональной авторизации. */
  async trySessionFromAuthHeader(authHeader?: string): Promise<BasaltSessionUser | null> {
    const token = this.extractBearerToken(authHeader)
    if (!token) return null
    try {
      const user = await this.getUserByTokenOrThrow(token)
      return user as BasaltSessionUser
    } catch {
      return null
    }
  }

  private static readonly MENTOR_SCORE_MAX = 100

  private normalizeMentorScore(score: number): number {
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new BadRequestException('Балл за спринт должен быть числом от 0 до 100')
    }
    const n = Math.round(score)
    if (n < 0 || n > MockDbService.MENTOR_SCORE_MAX) {
      throw new BadRequestException(`Балл за спринт: от 0 до ${MockDbService.MENTOR_SCORE_MAX}`)
    }
    return n
  }

  private submissionStatusLabel(status: string, forAdmin = false) {
    switch (status) {
      case 'pending_review':
        return 'На проверке'
      case 'deleted_by_user':
        return forAdmin ? 'Удалено пользователем' : 'Отозвано вами'
      case 'approved':
        return 'Принято'
      case 'rejected':
        return 'Удалено админом'
      case 'deleted_by_admin':
        return 'Удалено админом'
      default:
        return status
    }
  }

  private mapSubmissionForUser(
    r: {
      id: string
      sprintId: string
      repoUrl: string
      demoUrl: string | null
      status: string
      mentorScore: number | null
      reviewNote: string | null
      createdAt: Date
      reviewedAt: Date | null
      sprint?: { title: string; tabLabel: string }
    },
  ) {
    const deleted = r.status === 'deleted_by_user' || r.status === 'deleted_by_admin'
    return {
      id: r.id,
      sprintId: r.sprintId,
      sprintTitle: r.sprint?.title,
      tabLabel: r.sprint?.tabLabel,
      repoUrl: r.repoUrl,
      demoUrl: r.demoUrl ?? null,
      status: r.status,
      statusLabel: this.submissionStatusLabel(r.status),
      isDeleted: deleted,
      mentorScore: r.status === 'approved' ? r.mentorScore : null,
      reviewNote: r.reviewNote,
      submittedAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      canDelete: r.status === 'pending_review',
    }
  }

  private mapSubmissionForAdmin(
    r: {
      id: string
      sprintId: string
      userId: string
      repoUrl: string
      demoUrl: string | null
      status: string
      mentorScore: number | null
      reviewNote: string | null
      createdAt: Date
      reviewedAt: Date | null
      user?: { handle: string; email: string }
      sprint?: { title: string; tabLabel: string }
    },
  ) {
    return {
      id: r.id,
      sprintId: r.sprintId,
      sprintTitle: r.sprint?.title,
      sprintTabLabel: r.sprint?.tabLabel,
      userId: r.userId,
      handle: r.user?.handle,
      email: r.user?.email,
      repoUrl: r.repoUrl,
      demoUrl: r.demoUrl,
      status: r.status,
      statusLabel: this.submissionStatusLabel(r.status, true),
      mentorScore: r.mentorScore,
      reviewNote: r.reviewNote,
      submittedAt: r.createdAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      canReview: r.status === 'pending_review' || r.status === 'deleted_by_user',
    }
  }

  /** Балл в истории/контексте: из решения в зале славы, если есть (актуальнее submission). */
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

  /** Посылки пользователя для блока «История спринтов» в ЛК. */
  private async listUserSubmissionHistory(userId: string, take = 50) {
    const rows = await this.prisma.submission.findMany({
      where: {
        userId,
        // В профиле показываем пользовательские статусы, кроме служебного удаления админом.
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
    return rows.map((r: (typeof rows)[number]) => {
      const item = this.mapSubmissionForUser(r)
      item.mentorScore = this.resolveApprovedMentorScore(
        r.status,
        r.sprintId,
        r.mentorScore,
        solutionScores,
      )
      return item
    })
  }

  async getMyActiveSubmissionForSprint(user: BasaltSessionUser, sprintId: string) {
    const row = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        sprintId,
        status: { in: [...SUBMISSION_BLOCKING_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: { sprint: { select: { title: true, tabLabel: true } } },
    })
    if (!row) return { submission: null }
    if (row.status === 'approved') {
      const hasSolution = await this.prisma.solution.findFirst({
        where: { sprintId, userId: user.id },
        select: { id: true },
      })
      if (!hasSolution) return { submission: null }
    }
    return { submission: this.mapSubmissionForUser(row) }
  }

  async deleteMySubmission(user: BasaltSessionUser, submissionId: string) {
    const sub = await this.prisma.submission.findFirst({
      where: { id: submissionId, userId: user.id },
    })
    if (!sub) throw new NotFoundException('Отправка не найдена')
    if (sub.status !== 'pending_review') {
      throw new BadRequestException('Удалить можно только отправку, которая ещё на проверке')
    }
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'deleted_by_user' },
      include: { sprint: { select: { title: true, tabLabel: true } } },
    })
    return { submission: this.mapSubmissionForUser(updated) }
  }

  /** Один спринт с isMainActive — виден на главной всем; отправка только при зачислении. */
  private async setMainActiveSprint(sprintId: string) {
    const prevMain = await this.prisma.sprint.findFirst({
      where: { isMainActive: true },
      select: { id: true },
    })
    if (prevMain?.id === sprintId) return

    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, title: true, tabLabel: true, published: true },
    })
    if (!sprint) return

    await this.prisma.$transaction([
      this.prisma.sprint.updateMany({ data: { isMainActive: false }, where: { isMainActive: true } }),
      this.prisma.sprint.update({
        where: { id: sprintId },
        data: { isMainActive: true, published: true },
      }),
    ])

    if (sprint.published) {
      await this.notifyMainSprintActivated(sprintId, sprint)
    }
  }

  private async notifyMainSprintActivated(
    sprintId: string,
    sprint: { title: string; tabLabel: string | null },
  ) {
    const label = sprint.tabLabel || sprint.title || sprintId
    const enrolled = await this.prisma.sprintEnrollment.findMany({
      where: { sprintId },
      select: { userId: true },
    })
    if (enrolled.length === 0) return
    const body = `«${label}» на главной. Отправьте решение до дедлайна.`
    for (const { userId } of enrolled) {
      await this.pushNotification(userId, 'Активный спринт', body)
    }
  }

  /** Главный спринт (isMainActive) на главной — всем; enrolled — можно отправлять решение. */
  private async buildSprintContextForUser(userId: string) {
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
            // Защита от рассинхрона: approved без решения не должен блокировать новую отправку.
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
            statusLabel: this.submissionStatusLabel(blocking.status),
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

    const timing = this.sprintTimingFields(mainSprint)

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

  async getMeta() {
    const fighters = await this.prisma.user.count()
    const latestSprint = await this.prisma.sprint.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    const sprintNumber = Number(String(latestSprint?.id ?? '0').replace(/[^\d]/g, '')) || 0
    return {
      app: { build: 'v2.2.0-nest-jwt', copyrightYear: new Date().getUTCFullYear() },
      server: { timeUtcDisplay: new Date().toISOString().slice(11, 16) },
      sprintTeaser: { sprintNumber },
      marketing: { fighters, prizePoolShort: '120K', prizeCurrency: '₽' },
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

  private async pushNotification(userId: string, title: string, body: string) {
    await this.prisma.$transaction([
      this.prisma.notification.create({
        data: { userId, title, body },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { notificationsUnread: { increment: 1 } },
      }),
    ])
  }

  private async appendAdminLog(
    actor: AdminActor,
    action: string,
    targetType: string,
    targetId: string | null,
    message: string,
  ) {
    if (!actor?.id) return
    await this.prisma.adminLog.create({
      data: {
        actorId: actor.id,
        actorHandle: String(actor.handle ?? ''),
        action,
        targetType,
        targetId,
        message,
      },
    })
  }

  private async userHandleById(userId: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })
    return row?.handle ?? userId
  }

  async getMe(user: BasaltSessionUser) {
    await this.settleClosedSprintPrizes()
    const fresh = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { achievements: true },
    })
    const u = fresh ?? user
    const prizeAgg = await this.prisma.sprint.aggregate({
      where: { prizeWinnerUserId: u.id, prizeAwardedAt: { not: null }, prizeMoney: { gt: 0 } },
      _sum: { prizeMoney: true },
    })
    const moneyEarnedRub = this.formatMoneyRub(prizeAgg._sum.prizeMoney ?? 0)
    if (moneyEarnedRub !== u.moneyEarned) {
      await this.prisma.user.update({
        where: { id: u.id },
        data: { moneyEarned: moneyEarnedRub },
      })
      u.moneyEarned = moneyEarnedRub
    }
    const cards = await this.buildStatsCards(u.id)
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
          globalRank: u.globalRank,
          sprintsCompleted: u.sprintsCompleted,
          moneyEarned: moneyEarnedRub,
          leaderboardPosition: leaderboard.position,
          leaderboardSize: leaderboard.leaderboardSize,
          cards,
        },
        achievements: u.achievements.map((a: { id: string; title: string; subtitle: string; icon: string; variant: string }) => ({
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

  async patchMeProfile(user: BasaltSessionUser, payload: { form?: Record<string, string> }) {
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
      if (this.isUniqueConstraintError(e)) {
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

  /** Победители (rank 1) по последним спринтам — не зависит от страницы списка. */
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
    return rows
      .filter((s: (typeof rows)[number]) => s.solutions.length > 0)
      .slice(0, 5)
      .map((s: (typeof rows)[number]) => {
        const x = s.solutions[0]
        return {
          sprintRank: Number(String(s.id).replace(/[^\d]/g, '')) || 0,
          title: `Спринт #${s.id}`,
          handle: x.user.handle,
        }
      })
  }

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

    const sprintItems = sprints.map((s: (typeof sprints)[number]) => {
      const parsedMetrics = JSON.parse(s.metricsJson || '{}') as Record<string, unknown>
      const metrics = this.computeSprintHallMetrics(s.submissions, s.solutions.length, parsedMetrics)
      const timing = this.sprintTimingFields(s)
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

    const solutionIds = solutionRows.map((r: (typeof solutionRows)[number]) => r.id)
    const likedIdSet =
      viewer && solutionIds.length > 0
        ? new Set(
            (
              await this.prisma.solutionLike.findMany({
                where: { userId: viewer.id, solutionId: { in: solutionIds } },
                select: { solutionId: true },
              })
            ).map((row: { solutionId: string }) => row.solutionId),
          )
        : null

    const tags = JSON.parse(sprint.tagsJson || '[]')
    const parsedMetrics = JSON.parse(sprint.metricsJson || '{}') as Record<string, unknown>
    const brief = JSON.parse(sprint.briefJson || '{}')
    const submissionRows = await this.prisma.submission.findMany({
      where: { sprintId: id },
      select: { status: true },
    })
    const metrics = this.computeSprintHallMetrics(
      submissionRows,
      solutionRows.length,
      parsedMetrics,
    )

    const solutions = solutionRows.map((s: (typeof solutionRows)[number]) => ({
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

    const timing = this.sprintTimingFields(sprint)

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

  /** Как getSprintById, но без проверки published — для админки (черновики). */
  async adminGetSprintById(id: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id } })
    if (!sprint) throw new NotFoundException('Спринт не найден')

    const solutionRows = await this.prisma.solution.findMany({
      where: { sprintId: id },
      orderBy: [{ mentorScore: 'desc' }, { likes: { _count: 'desc' } }],
      include: {
        user: true,
        _count: { select: { likes: true } },
      },
    })

    const tags = JSON.parse(sprint.tagsJson || '[]')
    const metrics = JSON.parse(sprint.metricsJson || '{}')
    const brief = JSON.parse(sprint.briefJson || '{}')

    const solutions = solutionRows.map((s: (typeof solutionRows)[number]) => ({
      id: s.id,
      userId: s.userId,
      rank: s.rank,
      rankBadge: s.rankBadge ?? 'muted',
      avatarUrl: s.user.avatarUrl ?? '',
      displayName: s.user.displayName?.trim() ? s.user.displayName : s.user.handle,
      handle: s.user.handle,
      dateLabel: this.formatSolutionDateLabel(s.createdAt),
      mentorScore: s.mentorScore,
      profileUrl: '#',
      codeUrl: s.codeUrl,
      demoUrl: s.demoUrl ?? '#',
      likes: s._count.likes,
      showCrown: s.showCrown,
    }))

    return {
      sprint: {
        id: sprint.id,
        tabLabel: sprint.tabLabel,
        tabIcon: sprint.tabIcon,
        title: sprint.title,
        heroTitle: sprint.title,
        description: sprint.description ?? '',
        published: sprint.published,
        completedLabel: sprint.completedLabel,
        endsAt: sprint.endsAt?.toISOString() ?? null,
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

  private assertHttpUrl(url: string, fieldLabel: string) {
    const raw = String(url ?? '').trim()
    if (!raw) throw new BadRequestException(`${fieldLabel}: укажите ссылку`)
    try {
      const parsed = new URL(raw)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('bad protocol')
      }
    } catch {
      throw new BadRequestException(`${fieldLabel}: нужна ссылка вида https://…`)
    }
    return raw
  }

  async createSubmission(
    user: BasaltSessionUser,
    sprintId: string,
    payload: { repoUrl: string; demoUrl?: string },
  ) {
    const repoUrl = this.assertHttpUrl(payload.repoUrl, 'Репозиторий')
    const demoUrl =
      payload.demoUrl != null && String(payload.demoUrl).trim()
        ? this.assertHttpUrl(payload.demoUrl, 'Демо')
        : null

    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint || !sprint.published) throw new NotFoundException('Спринт не найден')
    const enrolled = await this.prisma.sprintEnrollment.findUnique({
      where: { userId_sprintId: { userId: user.id, sprintId } },
      select: { id: true },
    })
    if (!enrolled) {
      throw new ForbiddenException('Ты не зачислен в этот спринт')
    }
    if (sprint.endsAt != null && sprint.endsAt.getTime() < Date.now()) {
      throw new BadRequestException('Спринт уже завершён, приём решений закрыт')
    }
    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        sprintId,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })
    if (existingSubmission) {
      if (existingSubmission.status === 'pending_review' || existingSubmission.status === 'deleted_by_user') {
        throw new ConflictException(
          'У тебя уже есть отправка на проверке в этом спринте. Дождись решения наставника или отзови текущую в профиле.',
        )
      }
      if (existingSubmission.status === 'approved') {
        const hasSolution = await this.prisma.solution.findFirst({
          where: { sprintId, userId: user.id },
          select: { id: true },
        })
        if (hasSolution) {
          throw new ConflictException('В этом спринте у тебя уже есть принятая отправка')
        }
        const recovered = await this.prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            repoUrl,
            demoUrl,
            status: 'pending_review',
            mentorScore: null,
            reviewNote: null,
            reviewedAt: null,
          },
        })
        return {
          id: recovered.id,
          status: recovered.status,
          statusLabel: this.submissionStatusLabel(recovered.status),
        }
      }
      // deleted_by_admin (и legacy rejected) разрешаем переотправить,
      // но строго в рамках той же записи, без создания дубля.
      const reused = await this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          repoUrl,
          demoUrl,
          status: 'pending_review',
          mentorScore: null,
          reviewNote: null,
          reviewedAt: null,
        },
      })
      return {
        id: reused.id,
        status: reused.status,
        statusLabel: this.submissionStatusLabel(reused.status),
      }
    }
    let sub
    try {
      sub = await this.prisma.submission.create({
        data: {
          sprintId,
          userId: user.id,
          repoUrl,
          demoUrl,
          status: 'pending_review',
        },
      })
    } catch (e) {
      if (this.isUniqueConstraintError(e)) {
        throw new ConflictException(
          'У тебя уже есть отправка на этот спринт. Обнови страницу и проверь статус в профиле.',
        )
      }
      throw e
    }
    await this.prisma.sprintEnrollment.upsert({
      where: { userId_sprintId: { userId: user.id, sprintId } },
      create: { userId: user.id, sprintId },
      update: {},
    })
    return {
      id: sub.id,
      status: sub.status,
      statusLabel: this.submissionStatusLabel(sub.status),
    }
  }

  /** POST /v2/submissions — репозиторий привязывается к активному опубликованному спринту пользователя. */
  async createSubmissionForActiveSprint(
    user: BasaltSessionUser,
    payload: { repoUrl: string; demoUrl?: string },
  ) {
    const ctx = await this.buildSprintContextForUser(user.id)
    const sprintId = ctx.activeSprint
    if (!sprintId) {
      throw new BadRequestException('Нет активного спринта для отправки решения')
    }
    if (!ctx.enrolled) {
      throw new ForbiddenException('Ты не зачислен в этот спринт')
    }
    if (!ctx.systemActive) {
      throw new BadRequestException('Спринт завершён или приём решений закрыт')
    }
    return this.createSubmission(user, sprintId, payload)
  }

  async listMySprints(user: BasaltSessionUser) {
    const rows = await this.prisma.sprintEnrollment.findMany({
      where: { userId: user.id },
      include: { sprint: true },
      orderBy: { enrolledAt: 'desc' },
    })
    const sprintIds = rows.map((r: (typeof rows)[number]) => r.sprint.id)
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
      sprints: rows.map((r: (typeof rows)[number]) => {
        const active = activeBySprint.get(r.sprint.id)
        const timing = this.sprintTimingFields(r.sprint)
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
                statusLabel: this.submissionStatusLabel(active.status),
                canSubmit: false,
              }
            : null,
        }
      }),
    }
  }

  async likeSolution(user: BasaltSessionUser, sprintId: string, solutionId: string) {
    const solution = await this.prisma.solution.findFirst({
      where: { id: solutionId, sprintId },
      select: { id: true },
    })
    if (!solution) throw new NotFoundException('Решение не найдено')

    const existing = await this.prisma.solutionLike.findUnique({
      where: { solutionId_userId: { solutionId, userId: user.id } },
      select: { id: true },
    })
    if (existing) {
      await this.prisma.solutionLike.delete({
        where: { solutionId_userId: { solutionId, userId: user.id } },
      })
    } else {
      await this.prisma.solutionLike.create({
        data: { solutionId, userId: user.id },
      })
    }

    const likes = await this.prisma.solutionLike.count({ where: { solutionId } })
    return { likes, liked: !existing }
  }

  async adminCreateUser(payload: { handle: string; email: string; password: string; displayName?: string }) {
    const rawHandle = payload.handle.trim()
    const handle = rawHandle.startsWith('@') ? rawHandle.slice(1).trim() : rawHandle
    if (handle.length < 2) {
      throw new BadRequestException('Некорректный никнейм')
    }

    const email = payload.email.trim().toLowerCase()
    const password = payload.password
    const displayName = payload.displayName != null ? String(payload.displayName).trim() : ''

    const clash = await this.prisma.user.findFirst({
      where: { OR: [{ handle }, { email }] },
      select: { id: true, handle: true, email: true },
    })
    if (clash) {
      throw new ConflictException(
        clash.handle === handle ? 'Пользователь с таким handle уже есть' : 'Этот email уже занят',
      )
    }

    const user = await this.prisma.user.create({
      data: {
        handle,
        email,
        displayName,
        passwordHash: await this.hashPassword(password),
        role: 'user',
      },
      select: {
        id: true,
        handle: true,
        email: true,
        displayName: true,
        role: true,
        points: true,
        globalRank: true,
        sprintsCompleted: true,
        moneyEarned: true,
        notificationsUnread: true,
        avatarUrl: true,
        telegram: true,
        github: true,
      },
    })
    return { user }
  }

  async adminListUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        handle: true,
        email: true,
        displayName: true,
        role: true,
        points: true,
        globalRank: true,
        sprintsCompleted: true,
        moneyEarned: true,
        notificationsUnread: true,
        avatarUrl: true,
        telegram: true,
        github: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return {
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    }
  }

  async adminUpdateUser(
    userId: string,
    payload: {
      role?: string
      displayName?: string
      password?: string
    },
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(payload.role ? { role: payload.role } : {}),
        ...(payload.displayName !== undefined ? { displayName: payload.displayName } : {}),
        ...(payload.password ? { passwordHash: await this.hashPassword(payload.password) } : {}),
      },
    })
    await this.reconcileUserDerivedStats(userId)
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        handle: true,
        displayName: true,
        role: true,
        points: true,
        globalRank: true,
        sprintsCompleted: true,
        moneyEarned: true,
      },
    })
    if (!updated) throw new NotFoundException('Пользователь не найден')
    return { user: updated }
  }

  /** Привязывает ранее выданные ачивки к шаблонам по title (для старых данных без definitionId). */
  private async backfillAchievementDefinitionLinks() {
    const [defs, legacy] = await Promise.all([
      this.prisma.achievementDefinition.findMany({
        select: { id: true, title: true, subtitle: true, icon: true, variant: true },
      }),
      this.prisma.achievement.findMany({
        where: { definitionId: null },
        select: { id: true, title: true, subtitle: true, icon: true, variant: true },
      }),
    ])
    if (defs.length === 0 || legacy.length === 0) return

    for (const ach of legacy) {
      const byTitle = defs.find((d) => d.title === ach.title)
      const byFull = defs.find(
        (d) => d.subtitle === ach.subtitle && d.icon === ach.icon && d.variant === ach.variant,
      )
      const bySubtitle = defs.filter((d) => d.subtitle === ach.subtitle)
      const pick = byTitle ?? byFull ?? (bySubtitle.length === 1 ? bySubtitle[0] : null)
      if (!pick) {
        // Шаблон удалён из каталога — убираем «осиротевшую» выданную ачивку.
        await this.prisma.achievement.delete({ where: { id: ach.id } })
        continue
      }
      await this.prisma.achievement.update({
        where: { id: ach.id },
        data: {
          definitionId: pick.id,
          title: pick.title,
          subtitle: pick.subtitle,
          icon: pick.icon,
          variant: pick.variant,
        },
      })
    }
  }

  async adminCreateAchievementDefinition(payload: {
    title: string
    subtitle: string
    icon: string
    variant?: string
  }) {
    const title = payload.title.trim()
    const existing = await this.prisma.achievementDefinition.findUnique({
      where: { title },
      select: { id: true },
    })
    if (existing) throw new ConflictException('Ачивка с таким названием уже в каталоге')
    const definition = await this.prisma.achievementDefinition.create({
      data: {
        title,
        subtitle: payload.subtitle.trim(),
        icon: payload.icon.trim() || 'military_tech',
        variant: payload.variant ?? 'earned',
      },
    })
    return { ok: true, definition }
  }

  async adminListAchievementDefinitions() {
    const rows = await this.prisma.achievementDefinition.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return {
      definitions: rows.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        icon: r.icon,
        variant: r.variant,
        createdAt: r.createdAt.toISOString(),
      })),
    }
  }

  async adminDeleteAchievementDefinition(definitionId: string) {
    await this.backfillAchievementDefinitionLinks()
    const row = await this.prisma.achievementDefinition.findUnique({
      where: { id: definitionId },
      select: { id: true, title: true, subtitle: true, icon: true, variant: true },
    })
    if (!row) throw new NotFoundException('Шаблон ачивки не найден')
    await this.prisma.$transaction(async (tx) => {
      // Снимаем выданные копии ачивки у пользователей.
      await tx.achievement.deleteMany({
        where: {
          OR: [
            { definitionId },
            { title: row.title },
            { subtitle: row.subtitle },
            {
              AND: [
                { subtitle: row.subtitle },
                { icon: row.icon },
                { variant: row.variant },
              ],
            },
          ],
        },
      })
      await tx.achievementDefinition.delete({ where: { id: definitionId } })
    })
    return { ok: true }
  }

  async adminUpdateAchievementDefinition(
    definitionId: string,
    payload: { title?: string; subtitle?: string; icon?: string; variant?: string },
  ) {
    await this.backfillAchievementDefinitionLinks()
    const current = await this.prisma.achievementDefinition.findUnique({
      where: { id: definitionId },
      select: { id: true, title: true, subtitle: true, icon: true, variant: true },
    })
    if (!current) throw new NotFoundException('Шаблон ачивки не найден')

    const nextTitle =
      payload.title !== undefined ? payload.title.trim() : undefined
    if (nextTitle !== undefined && nextTitle.length < 2) {
      throw new BadRequestException('Название — минимум 2 символа')
    }
    if (nextTitle && nextTitle !== current.title) {
      const duplicate = await this.prisma.achievementDefinition.findUnique({
        where: { title: nextTitle },
        select: { id: true },
      })
      if (duplicate && duplicate.id !== definitionId) {
        throw new ConflictException('Ачивка с таким названием уже в каталоге')
      }
    }

    const nextSubtitle =
      payload.subtitle !== undefined ? payload.subtitle.trim() : undefined
    if (nextSubtitle !== undefined && nextSubtitle.length < 2) {
      throw new BadRequestException('Подпись — минимум 2 символа')
    }

    const nextIcon =
      payload.icon !== undefined ? payload.icon.trim() || 'military_tech' : current.icon
    const nextVariant = payload.variant !== undefined ? payload.variant : current.variant
    const finalTitle = nextTitle !== undefined ? nextTitle : current.title
    const finalSubtitle = nextSubtitle !== undefined ? nextSubtitle : current.subtitle

    const updated = await this.prisma.$transaction(async (tx) => {
      const definition = await tx.achievementDefinition.update({
        where: { id: definitionId },
        data: {
          ...(nextTitle !== undefined ? { title: nextTitle } : {}),
          ...(nextSubtitle !== undefined ? { subtitle: nextSubtitle } : {}),
          ...(payload.icon !== undefined ? { icon: nextIcon } : {}),
          ...(payload.variant !== undefined ? { variant: payload.variant } : {}),
        },
      })

      // Синхронизируем уже выданные ачивки из этого шаблона.
      await tx.achievement.updateMany({
        where: {
          OR: [
            { definitionId },
            { title: current.title },
            { subtitle: current.subtitle },
            {
              AND: [
                { subtitle: current.subtitle },
                { icon: current.icon },
                { variant: current.variant },
              ],
            },
          ],
        },
        data: {
          definitionId,
          title: finalTitle,
          subtitle: finalSubtitle,
          icon: nextIcon,
          variant: nextVariant,
        },
      })

      return definition
    })
    return { ok: true, definition: updated }
  }

  async adminGrantAchievement(payload: {
    userId?: string
    userIds?: string[]
    definitionId?: string
    title?: string
    subtitle?: string
    icon?: string
    variant?: string
  }) {
    const targetIds = [
      ...new Set(
        [...(payload.userIds ?? []), ...(payload.userId ? [payload.userId] : [])]
          .map((id) => String(id).trim())
          .filter(Boolean),
      ),
    ]
    if (targetIds.length === 0) {
      throw new BadRequestException('Укажите хотя бы одного пользователя')
    }

    let title = payload.title?.trim() ?? ''
    let subtitle = payload.subtitle?.trim() ?? ''
    let icon = payload.icon?.trim() || 'military_tech'
    let variant = payload.variant ?? 'earned'
    let definitionId: string | null = null

    if (payload.definitionId) {
      const def = await this.prisma.achievementDefinition.findUnique({
        where: { id: payload.definitionId },
      })
      if (!def) throw new NotFoundException('Шаблон ачивки не найден')
      definitionId = def.id
      title = def.title
      subtitle = def.subtitle
      icon = def.icon
      variant = def.variant
    }

    if (title.length < 2 || subtitle.length < 2) {
      throw new BadRequestException('Укажите шаблон из каталога или заполните название и подпись')
    }

    let granted = 0
    let skipped = 0
    const achievements: { id: string; userId: string }[] = []

    for (const userId of targetIds) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!user) continue
      const existing = await this.prisma.achievement.findFirst({
        where: { userId, title },
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }
      const achievement = await this.prisma.achievement.create({
        data: { userId, definitionId, title, subtitle, icon, variant },
      })
      achievements.push({ id: achievement.id, userId })
      granted += 1
    }

    return { ok: true, granted, skipped, achievements }
  }

  async adminListSprints() {
    const rows = await this.prisma.sprint.findMany({ orderBy: { createdAt: 'desc' } })
    const mainIdx = rows.findIndex((s) => s.isMainActive === true)
    if (mainIdx <= 0) return rows
    const main = rows[mainIdx]
    const rest = rows.filter((_, i) => i !== mainIdx)
    return [main, ...rest]
  }

  async adminCreateSprint(payload: {
    id: string
    tabLabel: string
    tabIcon?: string
    title: string
    description?: string
    completedLabel?: string
    published?: boolean
    isMainActive?: boolean
    endsAt: string
    prizeMoney?: number
    tags?: unknown[]
    metrics?: Record<string, unknown>
    brief?: Record<string, unknown>
  }) {
    const existing = await this.prisma.sprint.findUnique({ where: { id: payload.id } })
    if (existing) throw new ConflictException('Спринт с таким id уже существует')

    const metrics = {
      deltaLabel: '+0 за сутки',
      ...(payload.metrics ?? {}),
    }

    const endsAt = this.parseOptionalIsoDate(payload.endsAt)
    if (!endsAt) throw new BadRequestException('Укажите дедлайн спринта (endsAt)')

    const created = await this.prisma.sprint.create({
      data: {
        id: payload.id,
        tabLabel: payload.tabLabel,
        tabIcon: payload.tabIcon ?? null,
        title: payload.title,
        description: payload.description ?? '',
        completedLabel: payload.completedLabel?.trim() || '—',
        published: payload.published !== false,
        isMainActive: payload.isMainActive === true,
        endsAt,
        prizeMoney: Math.max(0, Number(payload.prizeMoney ?? 0) || 0),
        tagsJson: JSON.stringify(payload.tags ?? []),
        metricsJson: JSON.stringify(metrics),
        briefJson: JSON.stringify(payload.brief ?? {}),
      },
    })
    if (payload.isMainActive === true) {
      await this.setMainActiveSprint(created.id)
    }
    return created
  }

  async adminUpdateSprint(
    sprintId: string,
    payload: {
      tabLabel?: string
      tabIcon?: string
      title?: string
      description?: string
      completedLabel?: string
      published?: boolean
      isMainActive?: boolean
      endsAt?: string
      prizeMoney?: number
      tags?: unknown[]
      metrics?: Record<string, unknown>
      brief?: Record<string, unknown>
      replaceBrief?: boolean
    },
  ) {
    const current = await this.prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!current) throw new NotFoundException('Спринт не найден')

    if (payload.isMainActive === true) {
      await this.setMainActiveSprint(sprintId)
    } else if (payload.isMainActive === false && current.isMainActive) {
      await this.prisma.sprint.update({
        where: { id: sprintId },
        data: { isMainActive: false },
      })
    }

    const prevMetrics = JSON.parse(current.metricsJson || '{}') as Record<string, unknown>
    const nextMetrics = { ...prevMetrics, ...(payload.metrics ?? {}) }

    const prevBrief = JSON.parse(current.briefJson || '{}') as Record<string, unknown>
    const nextBrief =
      payload.brief !== undefined
        ? payload.replaceBrief
          ? payload.brief
          : { ...prevBrief, ...payload.brief }
        : null

    const publishedValue =
      payload.isMainActive === true
        ? true
        : payload.published !== undefined
          ? payload.published
          : undefined

    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(payload.tabLabel !== undefined ? { tabLabel: payload.tabLabel } : {}),
        ...(payload.tabIcon !== undefined ? { tabIcon: payload.tabIcon || null } : {}),
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.completedLabel !== undefined ? { completedLabel: payload.completedLabel } : {}),
        ...(publishedValue !== undefined ? { published: publishedValue } : {}),
        ...(payload.isMainActive !== undefined && payload.isMainActive !== true
          ? { isMainActive: payload.isMainActive }
          : {}),
        ...(payload.endsAt !== undefined
          ? { endsAt: this.parseOptionalIsoDate(payload.endsAt) }
          : {}),
        ...(payload.prizeMoney !== undefined && !current.prizeAwardedAt
          ? { prizeMoney: Math.max(0, Number(payload.prizeMoney) || 0) }
          : {}),
        ...(payload.tags !== undefined ? { tagsJson: JSON.stringify(payload.tags) } : {}),
        ...(payload.metrics !== undefined ? { metricsJson: JSON.stringify(nextMetrics) } : {}),
        ...(nextBrief !== null ? { briefJson: JSON.stringify(nextBrief) } : {}),
      },
    })
  }

  async adminDeleteSprint(sprintId: string) {
    await this.prisma.sprint.delete({ where: { id: sprintId } })
    return { ok: true }
  }

  async adminListSprintEnrollments(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId }, select: { id: true } })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    const rows = await this.prisma.sprintEnrollment.findMany({
      where: { sprintId },
      include: {
        user: { select: { id: true, handle: true, email: true, displayName: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    })
    return {
      enrollments: rows.map((e: (typeof rows)[number]) => ({
        id: e.id,
        enrolledAt: e.enrolledAt.toISOString(),
        user: e.user,
      })),
    }
  }

  async adminListSprintSubmissions(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId }, select: { id: true } })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    const rows = await this.prisma.submission.findMany({
      where: { sprintId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, handle: true, email: true } } },
    })
    return {
      submissions: rows.map((r: (typeof rows)[number]) => this.mapSubmissionForAdmin(r)),
    }
  }

  async adminDeleteSubmission(sprintId: string, submissionId: string, actor?: AdminActor) {
    const sub = await this.prisma.submission.findFirst({
      where: { id: submissionId, sprintId },
      select: { id: true, status: true, userId: true, sprintId: true },
    })
    if (!sub) throw new NotFoundException('Отправка не найдена')
    const userHandle = await this.userHandleById(sub.userId)
    if (sub.status === 'deleted_by_admin' || sub.status === 'deleted_by_user') {
      await this.prisma.submission.delete({ where: { id: sub.id } })
      await this.appendAdminLog(
        actor,
        'submission.purge',
        'submission',
        sub.id,
        `Полностью удалена запись отправки ${sub.id} (@${userHandle}, sprint=${sprintId})`,
      )
      return { ok: true, purged: true }
    }
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'deleted_by_admin', reviewedAt: new Date() },
    })
    await this.appendAdminLog(
      actor,
      'submission.delete',
      'submission',
      sub.id,
      `Отправка ${sub.id} (@${userHandle}) переведена в deleted_by_admin (sprint=${sprintId})`,
    )
    if (sub.status === 'approved') {
      const removed = await this.prisma.solution.deleteMany({
        where: { sprintId: sub.sprintId, userId: sub.userId },
      })
      if (removed.count > 0) {
        await this.recalculateSprintRanks(sub.sprintId)
        await this.reconcileUserPointsFromSolutions(sub.userId)
        await this.appendAdminLog(
          actor,
          'solution.auto_delete',
          'solution',
          null,
          `Удалено ${removed.count} решений после удаления approved-отправки (sprint=${sprintId}, user=@${userHandle})`,
        )
      }
    }
    return { ok: true }
  }

  async adminReviewSubmission(
    submissionId: string,
    payload: { action: 'approve'; mentorScore?: number; reviewNote?: string },
    actor?: AdminActor,
  ) {
    const note = payload.reviewNote?.trim() || null
    const reviewedAt = new Date()
    const score = this.normalizeMentorScore(payload.mentorScore as number)

    const pre = await this.prisma.submission.findUnique({ where: { id: submissionId } })
    if (!pre) throw new NotFoundException('Отправка не найдена')
    if (pre.status !== 'pending_review' && pre.status !== 'deleted_by_user') {
      throw new BadRequestException('Эту отправку уже обработали')
    }

    const sprintRow = await this.prisma.sprint.findUnique({
      where: { id: pre.sprintId },
      select: { title: true, tabLabel: true },
    })
    const sprintLabel = sprintRow?.tabLabel || sprintRow?.title || pre.sprintId

    let updated
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const sub = await tx.submission.findUnique({ where: { id: submissionId } })
        if (!sub) throw new NotFoundException('Отправка не найдена')
        if (sub.status !== 'pending_review' && sub.status !== 'deleted_by_user') {
          throw new BadRequestException('Эту отправку уже обработали')
        }

        const existingSol = await tx.solution.findFirst({
          where: { sprintId: sub.sprintId, userId: sub.userId },
          select: { id: true },
        })
        if (existingSol) {
          await tx.solution.update({
            where: { id: existingSol.id },
            data: {
              mentorScore: score,
              codeUrl: sub.repoUrl,
              demoUrl: sub.demoUrl,
            },
          })
        } else {
          const existingCount = await tx.solution.count({ where: { sprintId: sub.sprintId } })
          const rank = existingCount + 1
          await tx.solution.create({
            data: {
              sprintId: sub.sprintId,
              userId: sub.userId,
              rank,
              rankBadge: this.rankToBadge(rank),
              mentorScore: score,
              codeUrl: sub.repoUrl,
              demoUrl: sub.demoUrl,
              showCrown: false,
            },
          })
        }

        return tx.submission.update({
          where: { id: submissionId },
          data: {
            status: 'approved',
            mentorScore: score,
            reviewNote: note,
            reviewedAt,
          },
          include: {
            user: { select: { id: true, handle: true, email: true } },
            sprint: { select: { id: true, title: true, tabLabel: true } },
          },
        })
      })
    } catch (e) {
      if (this.isUniqueConstraintError(e)) {
        throw new BadRequestException('Эту отправку уже обработали')
      }
      throw e
    }
    await this.recalculateSprintRanks(pre.sprintId)
    await this.reconcileUserPointsFromSolutions(pre.userId)

    const userHandle = await this.userHandleById(pre.userId)
    const approveBody = note
      ? `Спринт «${sprintLabel}»: +${score} баллов за спринт. ${note}`
      : `Спринт «${sprintLabel}»: +${score} баллов за спринт.`
    await this.pushNotification(pre.userId, 'Отправка принята', approveBody)
    await this.appendAdminLog(
      actor,
      'submission.approve',
      'submission',
      submissionId,
      `Принята отправка ${submissionId} (@${userHandle}, ${sprintLabel}) с баллом ${score}`,
    )
    return { submission: this.mapSubmissionForAdmin(updated) }
  }

  async adminAddSprintEnrollments(sprintId: string, userIds: string[]) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, title: true, tabLabel: true },
    })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    const sprintLabel = sprint.tabLabel || sprint.title || sprint.id
    const unique = [...new Set(userIds.filter(Boolean))]
    let added = 0
    for (const userId of unique) {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!u) throw new NotFoundException(`Пользователь не найден: ${userId}`)
      const existing = await this.prisma.sprintEnrollment.findUnique({
        where: { userId_sprintId: { userId, sprintId } },
        select: { id: true },
      })
      if (existing) continue
      await this.prisma.sprintEnrollment.create({ data: { userId, sprintId } })
      added += 1
      await this.pushNotification(
        userId,
        'Доступ к спринту',
        `Вас зачислили на «${sprintLabel}». Можно отправлять решение с главной.`,
      )
    }
    return { ok: true, count: added }
  }

  async adminRemoveSprintEnrollment(sprintId: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId }, select: { id: true } })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    await this.prisma.sprintEnrollment.deleteMany({ where: { sprintId, userId } })
    return { ok: true }
  }

  private rankToBadge(rank: number) {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'slate'
    if (rank === 3) return 'bronze'
    return 'muted'
  }

  private formatMoneyRub(amount: number) {
    const safe = Math.max(0, Math.trunc(Number(amount) || 0))
    return `${safe.toLocaleString('ru-RU')} ₽`
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    )
  }

  /**
   * Фиксирует победителя в закрытых спринтах и помечает, что приз уже выдан.
   * Выполняется идемпотентно: повторный вызов не меняет уже зафиксированные спринты.
   */
  private async settleClosedSprintPrizes(at = Date.now()) {
    const now = new Date(at)
    const closedWithoutAward = await this.prisma.sprint.findMany({
      where: {
        endsAt: { not: null, lte: now },
        prizeAwardedAt: null,
        prizeMoney: { gt: 0 },
      },
      select: { id: true },
    })

    for (const sprint of closedWithoutAward) {
      await this.recalculateSprintRanks(sprint.id)
      let winner = await this.prisma.solution.findFirst({
        where: { sprintId: sprint.id, rank: 1 },
        orderBy: [{ mentorScore: 'desc' }, { likes: { _count: 'desc' } }, { createdAt: 'asc' }],
        select: { userId: true },
      })
      if (!winner?.userId) {
        // Защита от исторических/грязных данных: если rank не проставлен,
        // определяем победителя по тому же правилу сортировки, что и в зале.
        winner = await this.prisma.solution.findFirst({
          where: { sprintId: sprint.id },
          orderBy: [{ mentorScore: 'desc' }, { likes: { _count: 'desc' } }, { createdAt: 'asc' }],
          select: { userId: true },
        })
      }
      if (!winner?.userId) continue

      await this.prisma.sprint.updateMany({
        where: { id: sprint.id, prizeAwardedAt: null },
        data: { prizeWinnerUserId: winner.userId, prizeAwardedAt: now },
      })
      await this.reconcileUserDerivedStats(winner.userId, {
        skipGlobalRank: true,
        skipPrizeSettlement: true,
      })
    }
  }

  /** Общие баллы = сумма mentorScore по всем решениям; спринты = одобренные отправки. */
  private async reconcileUserDerivedStats(
    userId: string,
    opts?: { skipGlobalRank?: boolean; skipPrizeSettlement?: boolean },
  ) {
    if (!opts?.skipPrizeSettlement) {
      await this.settleClosedSprintPrizes()
    }
    const agg = await this.prisma.solution.aggregate({
      where: { userId },
      _sum: { mentorScore: true },
    })
    const total = Math.max(0, agg._sum.mentorScore ?? 0)
    const approvedSprints = await this.prisma.submission.count({
      where: { userId, status: 'approved' },
    })
    const prizeAgg = await this.prisma.sprint.aggregate({
      where: { prizeWinnerUserId: userId, prizeAwardedAt: { not: null } },
      _sum: { prizeMoney: true },
    })
    const moneyEarnedRub = this.formatMoneyRub(prizeAgg._sum.prizeMoney ?? 0)
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: total, sprintsCompleted: approvedSprints, moneyEarned: moneyEarnedRub },
    })
    if (!opts?.skipGlobalRank) {
      await this.recalculateGlobalRanks()
    }
  }

  /** @deprecated используйте reconcileUserDerivedStats */
  private async reconcileUserPointsFromSolutions(
    userId: string,
    opts?: { skipGlobalRank?: boolean },
  ) {
    return this.reconcileUserDerivedStats(userId, opts)
  }

  /** Синхронизирует mentorScore одобренных отправок с решением в зале славы. */
  private async syncApprovedSubmissionMentorScoresFromSolutions() {
    const solutions = await this.prisma.solution.findMany({
      select: { sprintId: true, userId: true, mentorScore: true },
    })
    for (const s of solutions) {
      await this.prisma.submission.updateMany({
        where: {
          sprintId: s.sprintId,
          userId: s.userId,
          status: 'approved',
        },
        data: { mentorScore: s.mentorScore },
      })
    }
  }

  /**
   * Чистит рассинхрон: approved-отправка без решения в зале славы.
   * Такая отправка не должна оставаться "принятой", иначе блокирует повторную отправку.
   */
  private async reconcileApprovedSubmissionsWithoutSolutions() {
    const [solutions, approvedSubs] = await Promise.all([
      this.prisma.solution.findMany({
        select: { sprintId: true, userId: true },
      }),
      this.prisma.submission.findMany({
        where: { status: 'approved' },
        select: { id: true, sprintId: true, userId: true },
      }),
    ])
    const solutionPairs = new Set(solutions.map((s) => `${s.sprintId}:${s.userId}`))
    const orphanIds = approvedSubs
      .filter((s) => !solutionPairs.has(`${s.sprintId}:${s.userId}`))
      .map((s) => s.id)
    if (orphanIds.length === 0) return
    await this.prisma.submission.updateMany({
      where: { id: { in: orphanIds } },
      data: {
        status: 'deleted_by_admin',
        reviewedAt: new Date(),
        reviewNote:
          'Исправление рассинхрона: отправка была в статусе approved без соответствующего решения.',
      },
    })
  }

  private async reconcileAllUsersPointsFromSolutions() {
    await this.reconcileApprovedSubmissionsWithoutSolutions()
    await this.syncApprovedSubmissionMentorScoresFromSolutions()
    await this.settleClosedSprintPrizes()
    const users = await this.prisma.user.findMany({ select: { id: true } })
    for (const u of users) {
      await this.reconcileUserDerivedStats(u.id, { skipGlobalRank: true, skipPrizeSettlement: true })
    }
    await this.recalculateGlobalRanks()
  }

  private async recalculateGlobalRanks() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, points: true },
    })
    let place = 0
    await this.prisma.$transaction(
      users.map((u) => {
        const rankLabel = u.points > 0 ? `#${++place}` : '#0'
        return this.prisma.user.update({
          where: { id: u.id },
          data: { globalRank: rankLabel },
        })
      }),
    )
  }

  /** Пересортировка rank/badge/crown: сначала балл наставника, при равенстве — лайки. */
  async recalculateSprintRanks(sprintId: string) {
    const solutions = await this.prisma.solution.findMany({
      where: { sprintId },
      orderBy: [{ mentorScore: 'desc' }, { likes: { _count: 'desc' } }],
      select: { id: true },
    })

    if (solutions.length > 0) {
      await this.prisma.$transaction(
        solutions.map((sol: { id: string }, idx: number) =>
          this.prisma.solution.update({
            where: { id: sol.id },
            data: {
              rank: idx + 1,
              rankBadge: this.rankToBadge(idx + 1),
              showCrown: idx === 0,
            },
          }),
        ),
      )
    }
    return { count: solutions.length }
  }

  async adminCreateSolution(
    sprintId: string,
    payload: {
      userId: string
      mentorScore: number
      codeUrl: string
      demoUrl?: string | null
      rank?: number
      rankBadge?: string | null
      showCrown?: boolean
    },
    options?: { skipPointsReconcile?: boolean; actor?: AdminActor; logAction?: boolean },
  ) {
    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    const targetUser = await this.prisma.user.findUnique({ where: { id: payload.userId } })
    if (!targetUser) throw new NotFoundException('Пользователь не найден')

    const existingForUser = await this.prisma.solution.findFirst({
      where: { sprintId, userId: payload.userId },
      select: { id: true },
    })
    if (existingForUser) {
      throw new ConflictException('У этого пользователя уже есть решение в данном спринте')
    }

    const existingCount = await this.prisma.solution.count({ where: { sprintId } })
    const rank = typeof payload.rank === 'number' ? payload.rank : existingCount + 1

    const created = await this.prisma.solution.create({
      data: {
        sprintId,
        userId: payload.userId,
        rank,
        rankBadge: payload.rankBadge ?? this.rankToBadge(rank),
        mentorScore: this.normalizeMentorScore(payload.mentorScore),
        codeUrl: payload.codeUrl,
        demoUrl: payload.demoUrl ?? null,
        showCrown: payload.showCrown ?? false,
      },
    })
    const reviewedAt = new Date()
    const latestSubmission = await this.prisma.submission.findFirst({
      where: { sprintId, userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    if (latestSubmission?.id) {
      await this.prisma.submission.update({
        where: { id: latestSubmission.id },
        data: {
          status: 'approved',
          repoUrl: payload.codeUrl,
          demoUrl: payload.demoUrl ?? null,
          mentorScore: this.normalizeMentorScore(payload.mentorScore),
          reviewNote: 'Решение принято администратором вручную.',
          reviewedAt,
        },
      })
    } else {
      await this.prisma.submission.create({
        data: {
          sprintId,
          userId: payload.userId,
          repoUrl: payload.codeUrl,
          demoUrl: payload.demoUrl ?? null,
          status: 'approved',
          mentorScore: this.normalizeMentorScore(payload.mentorScore),
          reviewNote: 'Решение принято администратором вручную.',
          reviewedAt,
        },
      })
    }
    await this.recalculateSprintRanks(sprintId)
    if (!options?.skipPointsReconcile) {
      await this.reconcileUserPointsFromSolutions(payload.userId)
    }
    if (options?.logAction !== false) {
      const userHandle = await this.userHandleById(payload.userId)
      await this.appendAdminLog(
        options?.actor,
        'solution.create',
        'solution',
        created.id,
        `Создано решение ${created.id} (sprint=${sprintId}, user=@${userHandle})`,
      )
    }
    return { solution: created }
  }

  async adminUpdateSolution(
    solutionId: string,
    payload: {
      userId?: string
      mentorScore?: number
      codeUrl?: string
      demoUrl?: string | null
      rank?: number
      rankBadge?: string | null
      showCrown?: boolean
    },
    actor?: AdminActor,
  ) {
    const current = await this.prisma.solution.findUnique({ where: { id: solutionId } })
    if (!current) throw new NotFoundException('Решение не найдено')

    if (payload.userId) {
      const u = await this.prisma.user.findUnique({ where: { id: payload.userId } })
      if (!u) throw new NotFoundException('Пользователь не найден')
      const clash = await this.prisma.solution.findFirst({
        where: {
          sprintId: current.sprintId,
          userId: payload.userId,
          id: { not: solutionId },
        },
        select: { id: true },
      })
      if (clash) {
        throw new ConflictException('У этого пользователя уже есть другое решение в спринте')
      }
    }

    const mentorScore =
      payload.mentorScore !== undefined
        ? this.normalizeMentorScore(payload.mentorScore)
        : undefined

    const updated = await this.prisma.solution.update({
      where: { id: solutionId },
      data: {
        ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
        ...(mentorScore !== undefined ? { mentorScore } : {}),
        ...(payload.codeUrl !== undefined ? { codeUrl: payload.codeUrl } : {}),
        ...(payload.demoUrl !== undefined ? { demoUrl: payload.demoUrl } : {}),
        ...(payload.rank !== undefined ? { rank: payload.rank } : {}),
        ...(payload.rankBadge !== undefined ? { rankBadge: payload.rankBadge } : {}),
        ...(payload.showCrown !== undefined ? { showCrown: payload.showCrown } : {}),
      },
    })
    await this.recalculateSprintRanks(current.sprintId)
    if (mentorScore !== undefined && mentorScore !== current.mentorScore) {
      await this.prisma.submission.updateMany({
        where: {
          sprintId: current.sprintId,
          userId: current.userId,
          status: 'approved',
        },
        data: { mentorScore },
      })
      await this.reconcileUserPointsFromSolutions(current.userId)
    }
    const userHandle = await this.userHandleById(current.userId)
    await this.appendAdminLog(
      actor,
      'solution.update',
      'solution',
      solutionId,
      `Обновлено решение ${solutionId} (sprint=${current.sprintId}, user=@${userHandle})`,
    )
    return { solution: updated }
  }

  async adminDeleteSolution(solutionId: string, actor?: AdminActor) {
    const current = await this.prisma.solution.findUnique({ where: { id: solutionId } })
    if (!current) throw new NotFoundException('Решение не найдено')
    const sprintId = current.sprintId
    const userId = current.userId
    await this.prisma.solution.delete({ where: { id: solutionId } })
    const updatedSubmissions = await this.prisma.submission.updateMany({
      where: {
        sprintId,
        userId,
        status: 'approved',
      },
      data: {
        status: 'deleted_by_admin',
        reviewedAt: new Date(),
        reviewNote:
          'Решение в зале славы удалено администратором. Отправка снята и требует повторной подачи.',
      },
    })
    await this.recalculateSprintRanks(sprintId)
    await this.reconcileUserPointsFromSolutions(userId)
    if (updatedSubmissions.count > 0) {
      await this.pushNotification(
        userId,
        'Отправка снята',
        `Спринт #${sprintId}: решение удалено администратором, отправка переведена в статус «Удалено админом». Можно отправить новую версию.`,
      )
    }
    const userHandle = await this.userHandleById(userId)
    await this.appendAdminLog(
      actor,
      'solution.delete',
      'solution',
      solutionId,
      `Удалено решение ${solutionId} (sprint=${sprintId}, user=@${userHandle})`,
    )
    return { ok: true }
  }

  async adminListAchievements() {
    const rows = await this.prisma.achievement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, handle: true, email: true } } },
    })
    return {
      achievements: rows.map((r: (typeof rows)[number]) => ({
        id: r.id,
        userId: r.userId,
        definitionId: r.definitionId ?? null,
        handle: r.user.handle,
        email: r.user.email,
        title: r.title,
        subtitle: r.subtitle,
        icon: r.icon,
        variant: r.variant,
        createdAt: r.createdAt.toISOString(),
      })),
    }
  }

  async adminDeleteAchievement(achievementId: string) {
    const row = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true },
    })
    if (!row) throw new NotFoundException('Достижение не найдено')
    await this.prisma.achievement.delete({ where: { id: achievementId } })
    return { ok: true }
  }

  async adminListAllSubmissions(limit = 100, offset = 0, q?: string, status?: string, sort?: string) {
    const take = Math.min(200, Math.max(1, Math.floor(limit)))
    const skip = Math.max(0, Math.floor(offset))
    const needle = q?.trim()
    const statusFilter = String(status ?? '').trim()
    const allowedStatuses = new Set([
      'pending_review',
      'deleted_by_user',
      'approved',
      'deleted_by_admin',
    ])
    const statusWhere = allowedStatuses.has(statusFilter) ? statusFilter : undefined
    const where: any = {
      ...(needle
        ? {
            OR: [
              { user: { handle: { contains: needle } } },
              { user: { email: { contains: needle } } },
              { sprint: { title: { contains: needle } } },
              { sprint: { tabLabel: { contains: needle } } },
              { sprint: { id: { contains: needle } } },
            ],
          }
        : {}),
      ...(statusWhere
        ? {
            status: statusWhere,
          }
        : {}),
    }
    const orderBy =
      sort === 'createdAt-asc'
        ? [{ createdAt: 'asc' as const }]
        : sort === 'mentorScore-desc'
          ? [{ mentorScore: 'desc' as const }, { createdAt: 'desc' as const }]
          : sort === 'mentorScore-asc'
            ? [{ mentorScore: 'asc' as const }, { createdAt: 'desc' as const }]
            : sort === 'handle-asc'
              ? [{ user: { handle: 'asc' as const } }, { createdAt: 'desc' as const }]
              : sort === 'handle-desc'
                ? [{ user: { handle: 'desc' as const } }, { createdAt: 'desc' as const }]
                : sort === 'status-asc'
                  ? [{ status: 'asc' as const }, { createdAt: 'desc' as const }]
                  : sort === 'status-desc'
                    ? [{ status: 'desc' as const }, { createdAt: 'desc' as const }]
                    : [{ createdAt: 'desc' as const }]
    const [rows, total] = await Promise.all([
      this.prisma.submission.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy,
        take,
        skip,
        include: {
          user: { select: { id: true, handle: true, email: true } },
          sprint: { select: { id: true, title: true, tabLabel: true } },
        },
      }),
      this.prisma.submission.count({ where }),
    ])
    return {
      total,
      submissions: rows.map((r: (typeof rows)[number]) => this.mapSubmissionForAdmin(r)),
    }
  }

  async adminListLogs(limit = 100, offset = 0, q?: string) {
    const take = Math.min(200, Math.max(1, Math.floor(limit)))
    const skip = Math.max(0, Math.floor(offset))
    const needle = q?.trim()
    const where = needle
      ? {
          OR: [
            { actorHandle: { contains: needle } },
            { action: { contains: needle } },
            { targetType: { contains: needle } },
            { targetId: { contains: needle } },
            { message: { contains: needle } },
          ],
        }
      : undefined
    const [rows, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.adminLog.count({ where }),
    ])
    const userIds = new Set<string>()
    const sprintIds = new Set<string>()
    const submissionIds = new Set<string>()
    const solutionIds = new Set<string>()
    const achievementIds = new Set<string>()
    const definitionIds = new Set<string>()
    const userIdPattern = /user=([a-z0-9]{20,})/gi
    for (const row of rows) {
      if (row.targetType === 'user' && row.targetId) userIds.add(row.targetId)
      if (row.targetType === 'sprint' && row.targetId) sprintIds.add(row.targetId)
      if (row.targetType === 'submission' && row.targetId) submissionIds.add(row.targetId)
      if (row.targetType === 'solution' && row.targetId) solutionIds.add(row.targetId)
      if (row.targetType === 'achievement' && row.targetId) achievementIds.add(row.targetId)
      if (row.targetType === 'achievement_definition' && row.targetId) definitionIds.add(row.targetId)
      let m: RegExpExecArray | null
      while ((m = userIdPattern.exec(row.message)) != null) {
        if (m[1]) userIds.add(m[1])
      }
    }
    const userMap =
      userIds.size > 0
        ? new Map(
            (
              await this.prisma.user.findMany({
                where: { id: { in: [...userIds] } },
                select: { id: true, handle: true },
              })
            ).map((u) => [u.id, u.handle]),
          )
        : new Map<string, string>()
    const sprintMap =
      sprintIds.size > 0
        ? new Map(
            (
              await this.prisma.sprint.findMany({
                where: { id: { in: [...sprintIds] } },
                select: { id: true, tabLabel: true, title: true },
              })
            ).map((s) => [s.id, s.tabLabel || s.title || s.id]),
          )
        : new Map<string, string>()
    const submissionMap =
      submissionIds.size > 0
        ? new Map(
            (
              await this.prisma.submission.findMany({
                where: { id: { in: [...submissionIds] } },
                select: { id: true, sprintId: true, user: { select: { handle: true } } },
              })
            ).map((s) => [s.id, `@${s.user.handle} · ${s.sprintId}`]),
          )
        : new Map<string, string>()
    const solutionMap =
      solutionIds.size > 0
        ? new Map(
            (
              await this.prisma.solution.findMany({
                where: { id: { in: [...solutionIds] } },
                select: { id: true, sprintId: true, user: { select: { handle: true } } },
              })
            ).map((s) => [s.id, `@${s.user.handle} · ${s.sprintId}`]),
          )
        : new Map<string, string>()
    const achievementMap =
      achievementIds.size > 0
        ? new Map(
            (
              await this.prisma.achievement.findMany({
                where: { id: { in: [...achievementIds] } },
                select: { id: true, title: true, user: { select: { handle: true } } },
              })
            ).map((a) => [a.id, `@${a.user.handle} · ${a.title}`]),
          )
        : new Map<string, string>()
    const definitionMap =
      definitionIds.size > 0
        ? new Map(
            (
              await this.prisma.achievementDefinition.findMany({
                where: { id: { in: [...definitionIds] } },
                select: { id: true, title: true },
              })
            ).map((d) => [d.id, d.title]),
          )
        : new Map<string, string>()

    const prettifyMessage = (message: string) =>
      message.replace(/user=([a-z0-9]{20,})/gi, (_whole, id: string) => {
        const handle = userMap.get(id)
        return handle ? `user=@${handle}` : `user=${id}`
      })

    const prettifyTargetLabel = (targetType: string, targetId: string | null) => {
      if (!targetId) return targetType
      switch (targetType) {
        case 'user':
          return userMap.has(targetId) ? `@${userMap.get(targetId)}` : targetType
        case 'sprint':
          return sprintMap.get(targetId) ?? targetType
        case 'submission':
          return submissionMap.get(targetId) ?? targetType
        case 'solution':
          return solutionMap.get(targetId) ?? targetType
        case 'achievement':
          return achievementMap.get(targetId) ?? targetType
        case 'achievement_definition':
          return definitionMap.get(targetId) ?? targetType
        default:
          return targetType
      }
    }

    return {
      total,
      logs: rows.map((r: (typeof rows)[number]) => ({
        id: r.id,
        actorId: r.actorId,
        actorHandle: r.actorHandle || userMap.get(r.actorId) || r.actorId,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        targetLabel: prettifyTargetLabel(r.targetType, r.targetId),
        message: prettifyMessage(r.message),
        createdAt: r.createdAt.toISOString(),
      })),
    }
  }

  async adminDeleteUser(actorUserId: string, targetUserId: string, actorHandle?: string) {
    if (actorUserId === targetUserId) {
      throw new BadRequestException('Нельзя удалить свою учётную запись')
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    })
    if (!target) throw new NotFoundException('Пользователь не найден')
    if (target.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin' } })
      if (adminCount <= 1) {
        throw new BadRequestException('Нельзя удалить последнего администратора')
      }
    }
    const targetHandle = await this.userHandleById(targetUserId)
    await this.prisma.user.delete({ where: { id: targetUserId } })
    await this.appendAdminLog(
      { id: actorUserId, handle: actorHandle ?? '' },
      'user.delete',
      'user',
      targetUserId,
      `Удалена учётная запись пользователя @${targetHandle}`,
    )
    return { ok: true }
  }

  private toPublicUser(user: { id: string; handle: string; role: string; avatarUrl: string | null }) {
    return {
      id: user.id,
      handle: user.handle,
      role: user.role,
      avatarUrl: user.avatarUrl ?? '',
    }
  }

  private pluralRu(n: number, one: string, few: string, many: string) {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
  }

  /** Карточки профиля: значения и подписи только из БД. */
  private async buildStatsCards(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        globalRank: true,
        sprintsCompleted: true,
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
      user.points > 0 && lb.position > 0
        ? `Место ${lb.position} из ${lb.leaderboardSize}`
        : 'Нет баллов в рейтинге'

    const sprintsTrend =
      user.sprintsCompleted > 0
        ? `${user.sprintsCompleted} ${this.pluralRu(user.sprintsCompleted, 'спринт', 'спринта', 'спринтов')} одобрено`
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
        value: String(user.points),
        trendLabel: pointsTrend,
        trendVariant: 'malachite',
        icon: 'military_tech',
        iconTint: 'turquoise',
      },
      {
        key: 'rank',
        label: 'Глобальный ранг',
        value: user.globalRank,
        trendLabel: rankTrend,
        trendVariant: 'malachite',
        icon: 'query_stats',
        iconTint: 'turquoise',
      },
      {
        key: 'sprints',
        label: 'Спринтов пройдено',
        value: String(user.sprintsCompleted),
        trendLabel: sprintsTrend,
        trendVariant: 'turquoise',
        icon: 'bolt',
        iconTint: 'turquoise',
      },
      {
        key: 'money',
        label: 'Заработано денег',
        value: user.moneyEarned,
        trendLabel: moneyTrend,
        trendVariant: 'spring',
        icon: 'payments',
        iconTint: 'spring',
      },
    ]
  }
}
