import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { mapSubmissionForAdmin } from '../common/presenters/submission.presenter'
import { isUniqueConstraintError } from '../common/utils/prisma-errors.util'
import { parseOptionalIsoDate, sprintTimingFields } from '../common/utils/sprint-timing.util'
import { formatMoneyRub } from '../common/utils/money.util'
import { Prisma, UserRole } from '@prisma/client'
import { isUserRole, USER_ROLE_ADMIN, USER_ROLE_USER } from '../common/constants/user-role'
import { MENTOR_SCORE_MAX } from '../modules/admin/dto/admin.dto'
import { AdminAuditService } from './admin-audit.service'
import { NotificationService } from './notification.service'
import { PasswordService } from './password.service'
import { PrizeSettlementService } from './prize-settlement.service'
import { SprintLifecycleService } from './sprint-lifecycle.service'
import { UserDerivedStatsService } from './user-derived-stats.service'
import { PrismaService } from '../prisma/prisma.service'
import type { AdminActor } from '../types/admin-actor'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly passwords: PasswordService,
    private readonly notifications: NotificationService,
    private readonly sprintLifecycle: SprintLifecycleService,
    private readonly prizeSettlement: PrizeSettlementService,
    private readonly derivedStats: UserDerivedStatsService,
  ) {}

  private withSprintTiming<T extends { published: boolean; endsAt: Date | null }>(sprint: T) {
    const timing = sprintTimingFields(sprint)
    return {
      ...sprint,
      completedLabel: timing.completedLabel,
      endsAt: timing.endsAt,
      systemActive: timing.systemActive,
    }
  }

  private normalizeMentorScore(score: number): number {
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new BadRequestException('Балл за спринт должен быть числом от 0 до 100')
    }
    const n = Math.round(score)
    if (n < 0 || n > MENTOR_SCORE_MAX) {
      throw new BadRequestException(`Балл за спринт: от 0 до ${MENTOR_SCORE_MAX}`)
    }
    return n
  }

  private rankToBadge(rank: number) {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'slate'
    if (rank === 3) return 'bronze'
    return 'muted'
  }

  async adminCreateUser(
    payload: { handle: string; email: string; password: string; displayName?: string },
    actor?: AdminActor,
  ) {
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
        passwordHash: await this.passwords.hashPassword(password),
        role: USER_ROLE_USER,
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
    await this.audit.append(
      actor,
      'user.create',
      'user',
      user.id,
      `Создан пользователь @${user.handle} (${user.email})`,
    )
    const [enriched] = await this.derivedStats.enrichUsers([user])
    return { user: { ...enriched, moneyEarned: formatMoneyRub(enriched.moneyEarned) } }
  }

  async adminListUsers(limit = 500, offset = 0) {
    const take = Math.min(500, Math.max(1, Math.floor(limit)))
    const skip = Math.max(0, Math.floor(offset))
    const select = {
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
    } as const
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.user.count(),
    ])
    const enriched = await this.derivedStats.enrichUsers(users)
    return {
      users: enriched.map((u) => ({
        ...u,
        moneyEarned: formatMoneyRub(u.moneyEarned),
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      pagination: { limit: take, offset: skip, hasMore: skip + users.length < total },
    }
  }

  async adminUpdateUser(
    userId: string,
    payload: {
      role?: string
      displayName?: string
      password?: string
    },
    actor?: AdminActor,
  ) {
    const data: Prisma.UserUpdateInput = {}
    if (payload.role && isUserRole(payload.role)) {
      data.role = payload.role as UserRole
    }
    if (payload.displayName !== undefined) {
      data.displayName = payload.displayName
    }
    if (payload.password) {
      data.passwordHash = await this.passwords.hashPassword(payload.password)
    }
    await this.prisma.user.update({
      where: { id: userId },
      data,
    })
    await this.prizeSettlement.reconcileUserDerivedStats(userId)
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
    const parts: string[] = []
    if (payload.role !== undefined) parts.push(`role=${payload.role}`)
    if (payload.displayName !== undefined) parts.push('displayName')
    if (payload.password) parts.push('password')
    await this.audit.append(
      actor,
      'user.update',
      'user',
      userId,
      `Обновлён @${updated.handle}${parts.length ? ` (${parts.join(', ')})` : ''}`,
    )
    const [enriched] = await this.derivedStats.enrichUsers([updated])
    return {
      user: { ...enriched, moneyEarned: formatMoneyRub(enriched.moneyEarned) },
    }
  }

  async adminCreateAchievementDefinition(
    payload: {
      title: string
      subtitle: string
      icon: string
      variant?: string
    },
    actor?: AdminActor,
  ) {
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
    await this.audit.append(
      actor,
      'achievement_definition.create',
      'achievement_definition',
      definition.id,
      `Добавлен шаблон ачивки «${definition.title}»`,
    )
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

  async adminDeleteAchievementDefinition(definitionId: string, actor?: AdminActor) {
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
    await this.audit.append(
      actor,
      'achievement_definition.delete',
      'achievement_definition',
      definitionId,
      `Удалён шаблон ачивки «${row.title}»`,
    )
    return { ok: true }
  }

  async adminUpdateAchievementDefinition(
    definitionId: string,
    payload: { title?: string; subtitle?: string; icon?: string; variant?: string },
    actor?: AdminActor,
  ) {
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
    await this.audit.append(
      actor,
      'achievement_definition.update',
      'achievement_definition',
      definitionId,
      `Обновлён шаблон ачивки «${updated.title}»`,
    )
    return { ok: true, definition: updated }
  }

  async adminGrantAchievement(
    payload: {
    userId?: string
    userIds?: string[]
    definitionId?: string
    title?: string
    subtitle?: string
    icon?: string
    variant?: string
  },
    actor?: AdminActor,
  ) {
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

    if (granted > 0) {
      await this.audit.append(
        actor,
        'achievement.grant',
        'achievement_definition',
        definitionId,
        `Выдана ачивка «${title}» ${granted} пользователю(ям)${skipped > 0 ? `, пропущено ${skipped}` : ''}`,
      )
    }

    return { ok: true, granted, skipped, achievements }
  }

  async adminListSprints() {
    const rows = await this.prisma.sprint.findMany({ orderBy: { createdAt: 'desc' } })
    const mainIdx = rows.findIndex((s) => s.isMainActive === true)
    const ordered = mainIdx <= 0 ? rows : [rows[mainIdx], ...rows.filter((_, i) => i !== mainIdx)]
    return ordered.map((s) => this.withSprintTiming(s))
  }

  async adminCreateSprint(
    payload: {
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
    },
    actor?: AdminActor,
  ) {
    const existing = await this.prisma.sprint.findUnique({ where: { id: payload.id } })
    if (existing) throw new ConflictException('Спринт с таким id уже существует')

    const metrics = {
      deltaLabel: '+0 за сутки',
      ...(payload.metrics ?? {}),
    }

    const endsAt = parseOptionalIsoDate(payload.endsAt)
    if (!endsAt) throw new BadRequestException('Укажите дедлайн спринта (endsAt)')

    const created = await this.prisma.sprint.create({
      data: {
        id: payload.id,
        tabLabel: payload.tabLabel,
        tabIcon: payload.tabIcon ?? null,
        title: payload.title,
        description: payload.description ?? '',
        completedLabel: '',
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
      await this.sprintLifecycle.setMainActiveSprint(created.id)
    }
    await this.audit.append(
      actor,
      'sprint.create',
      'sprint',
      created.id,
      `Создан спринт «${created.tabLabel || created.title}» (${created.id})`,
    )
    return this.withSprintTiming(created)
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
    actor?: AdminActor,
  ) {
    const current = await this.prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!current) throw new NotFoundException('Спринт не найден')

    if (payload.isMainActive === true) {
      await this.sprintLifecycle.setMainActiveSprint(sprintId)
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

    const updated = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(payload.tabLabel !== undefined ? { tabLabel: payload.tabLabel } : {}),
        ...(payload.tabIcon !== undefined ? { tabIcon: payload.tabIcon || null } : {}),
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(publishedValue !== undefined ? { published: publishedValue } : {}),
        ...(payload.isMainActive !== undefined && payload.isMainActive !== true
          ? { isMainActive: payload.isMainActive }
          : {}),
        ...(payload.endsAt !== undefined
          ? { endsAt: parseOptionalIsoDate(payload.endsAt) }
          : {}),
        ...(payload.prizeMoney !== undefined && !current.prizeAwardedAt
          ? { prizeMoney: Math.max(0, Number(payload.prizeMoney) || 0) }
          : {}),
        ...(payload.tags !== undefined ? { tagsJson: JSON.stringify(payload.tags) } : {}),
        ...(payload.metrics !== undefined ? { metricsJson: JSON.stringify(nextMetrics) } : {}),
        ...(nextBrief !== null ? { briefJson: JSON.stringify(nextBrief) } : {}),
      },
    })
    await this.audit.append(
      actor,
      'sprint.update',
      'sprint',
      sprintId,
      `Обновлён спринт «${updated.tabLabel || updated.title}» (${sprintId})`,
    )
    return this.withSprintTiming(updated)
  }

  async adminDeleteSprint(sprintId: string, actor?: AdminActor) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, tabLabel: true, title: true },
    })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    await this.prisma.sprint.delete({ where: { id: sprintId } })
    await this.audit.append(
      actor,
      'sprint.delete',
      'sprint',
      sprintId,
      `Удалён спринт «${sprint.tabLabel || sprint.title}» (${sprintId})`,
    )
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
      submissions: rows.map((r: (typeof rows)[number]) => mapSubmissionForAdmin(r)),
    }
  }

  async adminDeleteSubmission(sprintId: string, submissionId: string, actor?: AdminActor) {
    const sub = await this.prisma.submission.findFirst({
      where: { id: submissionId, sprintId },
      select: { id: true, status: true, userId: true, sprintId: true },
    })
    if (!sub) throw new NotFoundException('Отправка не найдена')
    const userHandle = await this.audit.resolveUserHandle(sub.userId)
    if (sub.status === 'deleted_by_admin' || sub.status === 'deleted_by_user') {
      await this.prisma.submission.delete({ where: { id: sub.id } })
      await this.audit.append(
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
    await this.audit.append(
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
        await this.prizeSettlement.recalculateSprintRanks(sub.sprintId)
        await this.prizeSettlement.reconcileUserDerivedStats(sub.userId)
        await this.audit.append(
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
      if (isUniqueConstraintError(e)) {
        throw new BadRequestException('Эту отправку уже обработали')
      }
      throw e
    }
    await this.prizeSettlement.recalculateSprintRanks(pre.sprintId)
    await this.prizeSettlement.reconcileUserDerivedStats(pre.userId)

    const userHandle = await this.audit.resolveUserHandle(pre.userId)
    const approveBody = note
      ? `Спринт «${sprintLabel}»: +${score} баллов за спринт. ${note}`
      : `Спринт «${sprintLabel}»: +${score} баллов за спринт.`
    await this.notifications.push(pre.userId, 'Отправка принята', approveBody)
    await this.audit.append(
      actor,
      'submission.approve',
      'submission',
      submissionId,
      `Принята отправка ${submissionId} (@${userHandle}, ${sprintLabel}) с баллом ${score}`,
    )
    return { submission: mapSubmissionForAdmin(updated) }
  }

  async adminAddSprintEnrollments(sprintId: string, userIds: string[], actor?: AdminActor) {
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
      await this.notifications.push(
        userId,
        'Доступ к спринту',
        `Вас зачислили на «${sprintLabel}». Можно отправлять решение с главной.`,
      )
    }
    if (added > 0) {
      await this.audit.append(
        actor,
        'sprint.enroll',
        'sprint',
        sprintId,
        `Зачислено ${added} участник(ов) на «${sprintLabel}»`,
      )
    }
    return { ok: true, count: added }
  }

  async adminRemoveSprintEnrollment(sprintId: string, userId: string, actor?: AdminActor) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, tabLabel: true, title: true },
    })
    if (!sprint) throw new NotFoundException('Спринт не найден')
    const userHandle = await this.audit.resolveUserHandle(userId)
    await this.prisma.sprintEnrollment.deleteMany({ where: { sprintId, userId } })
    await this.audit.append(
      actor,
      'sprint.unenroll',
      'sprint',
      sprintId,
      `Снят @${userHandle} со спринта «${sprint.tabLabel || sprint.title}»`,
    )
    return { ok: true }
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
    await this.prizeSettlement.recalculateSprintRanks(sprintId)
    if (!options?.skipPointsReconcile) {
      await this.prizeSettlement.reconcileUserDerivedStats(payload.userId)
    }
    if (options?.logAction !== false) {
      const userHandle = await this.audit.resolveUserHandle(payload.userId)
      await this.audit.append(
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
    await this.prizeSettlement.recalculateSprintRanks(current.sprintId)
    if (mentorScore !== undefined && mentorScore !== current.mentorScore) {
      await this.prisma.submission.updateMany({
        where: {
          sprintId: current.sprintId,
          userId: current.userId,
          status: 'approved',
        },
        data: { mentorScore },
      })
      await this.prizeSettlement.reconcileUserDerivedStats(current.userId)
    }
    const userHandle = await this.audit.resolveUserHandle(current.userId)
    await this.audit.append(
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
    await this.prizeSettlement.recalculateSprintRanks(sprintId)
    await this.prizeSettlement.reconcileUserDerivedStats(userId)
    if (updatedSubmissions.count > 0) {
      await this.notifications.push(
        userId,
        'Отправка снята',
        `Спринт #${sprintId}: решение удалено администратором, отправка переведена в статус «Удалено админом». Можно отправить новую версию.`,
      )
    }
    const userHandle = await this.audit.resolveUserHandle(userId)
    await this.audit.append(
      actor,
      'solution.delete',
      'solution',
      solutionId,
      `Удалено решение ${solutionId} (sprint=${sprintId}, user=@${userHandle})`,
    )
    return { ok: true }
  }

  async adminListAchievements(limit = 200, offset = 0) {
    const take = Math.min(500, Math.max(1, Math.floor(limit)))
    const skip = Math.max(0, Math.floor(offset))
    const [rows, total] = await Promise.all([
      this.prisma.achievement.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, handle: true, email: true } } },
        skip,
        take,
      }),
      this.prisma.achievement.count(),
    ])
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
      total,
      pagination: { limit: take, offset: skip, hasMore: skip + rows.length < total },
    }
  }

  async adminDeleteAchievement(achievementId: string, actor?: AdminActor) {
    const row = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, title: true, userId: true },
    })
    if (!row) throw new NotFoundException('Достижение не найдено')
    const userHandle = await this.audit.resolveUserHandle(row.userId)
    await this.prisma.achievement.delete({ where: { id: achievementId } })
    await this.audit.append(
      actor,
      'achievement.revoke',
      'achievement',
      achievementId,
      `Отозвана ачивка «${row.title}» у @${userHandle}`,
    )
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
      submissions: rows.map((r: (typeof rows)[number]) => mapSubmissionForAdmin(r)),
    }
  }

  async adminListLogs(limit = 100, offset = 0, q?: string) {
    return this.audit.listLogs(limit, offset, q)
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
    if (target.role === USER_ROLE_ADMIN) {
      const adminCount = await this.prisma.user.count({ where: { role: USER_ROLE_ADMIN } })
      if (adminCount <= 1) {
        throw new BadRequestException('Нельзя удалить последнего администратора')
      }
    }
    const targetHandle = await this.audit.resolveUserHandle(targetUserId)
    await this.prisma.user.delete({ where: { id: targetUserId } })
    await this.audit.append(
      { id: actorUserId, handle: actorHandle ?? '' },
      'user.delete',
      'user',
      targetUserId,
      `Удалена учётная запись пользователя @${targetHandle}`,
    )
    return { ok: true }
  }

  /** Как публичный getSprintById, но без проверки published — для админки. */
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

    const formatSolutionDateLabel = (d: Date) => {
      const day = String(d.getUTCDate()).padStart(2, '0')
      const months = [
        'янв', 'фев', 'мар', 'апр', 'май', 'июн',
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
      ]
      return `${day} ${months[d.getUTCMonth()]}`
    }

    const solutions = solutionRows.map((s) => ({
      id: s.id,
      userId: s.userId,
      rank: s.rank,
      rankBadge: s.rankBadge ?? 'muted',
      avatarUrl: s.user.avatarUrl ?? '',
      displayName: s.user.displayName?.trim() ? s.user.displayName : s.user.handle,
      handle: s.user.handle,
      dateLabel: formatSolutionDateLabel(s.createdAt),
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
        ...sprintTimingFields(sprint),
        prizeMoney: sprint.prizeMoney ?? 0,
        tags,
        brief,
        metrics,
        solutions,
      },
    }
  }
}

