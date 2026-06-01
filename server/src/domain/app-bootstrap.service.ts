import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AuthSessionService } from '../auth/auth-session.service'
import { PasswordService } from './password.service'
import { PrizeSettlementService } from './prize-settlement.service'
import { PrismaService } from '../prisma/prisma.service'

const PRIZE_SETTLEMENT_INTERVAL_MS = 60_000

@Injectable()
export class AppBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppBootstrapService.name)
  private prizeSettlementTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly authSession: AuthSessionService,
    private readonly passwords: PasswordService,
    private readonly prizeSettlement: PrizeSettlementService,
  ) {}

  async onModuleInit() {
    try {
      await this.prizeSettlement.migrateLegacyMoneyEarnedColumn()
      await this.authSession.pruneStaleTokens()
      await this.migrateLegacySubmissionStatuses()
      await this.backfillAchievementDefinitionLinks()
      await this.prizeSettlement.reconcileAllUsersPointsFromSolutions()
      await this.passwords.upgradeLegacyPasswordHashes()
    } catch (err) {
      this.logger.error(
        'DB startup maintenance skipped (check DATABASE_URL / connectivity)',
        err instanceof Error ? err.stack : String(err),
      )
    }
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
      await this.prizeSettlement.settleClosedSprintPrizes()
    } catch (error) {
      this.logger.error(
        'Prize settlement tick failed',
        error instanceof Error ? error.stack : String(error),
      )
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
}
