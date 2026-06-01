import { Injectable, Logger } from '@nestjs/common'
import { SUBMISSION_STATUS } from '../common/constants/submission-status'
import {
  formatMoneyRub,
  normalizeMoneyRub,
  parseLegacyMoneyEarned,
} from '../common/utils/money.util'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PrizeSettlementService {
  private readonly logger = new Logger(PrizeSettlementService.name)

  constructor(private readonly prisma: PrismaService) {}

  private rankToBadge(rank: number) {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'slate'
    if (rank === 3) return 'bronze'
    return 'muted'
  }

  /**
   * Миграция legacy moneyEarned («20 000 ₽») → Int.
   * Через raw SQL: Prisma Client не может прочитать строку в Int-поле.
   */
  async migrateLegacyMoneyEarnedColumn() {
    // Хак рассчитан на SQLite (нестрогие типы, `?`-плейсхолдеры). На Postgres тип
    // колонки чинит versioned-миграция (20260602090000_fix_money_earned_int) — пропускаем.
    if (/^postgres(ql)?:\/\//i.test(String(process.env.DATABASE_URL ?? ''))) {
      return
    }
    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string; moneyEarned: unknown }>>(
      'SELECT id, moneyEarned FROM User',
    )
    let updated = 0
    for (const row of rows) {
      const rub = parseLegacyMoneyEarned(row.moneyEarned)
      const needsFix = typeof row.moneyEarned === 'string' || rub !== Number(row.moneyEarned)
      if (!needsFix) continue
      await this.prisma.$executeRawUnsafe(
        'UPDATE User SET moneyEarned = ? WHERE id = ?',
        rub,
        row.id,
      )
      updated++
    }
    if (updated > 0) {
      this.logger.log(`Normalized moneyEarned for ${updated} user(s)`)
    }
  }

  async settleClosedSprintPrizes(at = Date.now()) {
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
      await this.reconcileUserDerivedStats(winner.userId, { skipPrizeSettlement: true })
    }
  }

  async reconcileUserDerivedStats(
    userId: string,
    opts?: { skipPrizeSettlement?: boolean },
  ) {
    if (!opts?.skipPrizeSettlement) {
      await this.settleClosedSprintPrizes()
    }
    const agg = await this.prisma.solution.aggregate({
      where: { userId },
      _sum: { mentorScore: true },
    })
    const total = Math.max(0, agg._sum.mentorScore ?? 0)
    const prizeAgg = await this.prisma.sprint.aggregate({
      where: { prizeWinnerUserId: userId, prizeAwardedAt: { not: null } },
      _sum: { prizeMoney: true },
    })
    const moneyEarnedRub = normalizeMoneyRub(prizeAgg._sum.prizeMoney ?? 0)
    await this.prisma.user.update({
      where: { id: userId },
      data: { points: total, moneyEarned: moneyEarnedRub },
    })
  }

  async reconcileAllUsersPointsFromSolutions() {
    await this.reconcileApprovedSubmissionsWithoutSolutions()
    await this.syncApprovedSubmissionMentorScoresFromSolutions()
    await this.settleClosedSprintPrizes()
    const users = await this.prisma.user.findMany({ select: { id: true } })
    for (const u of users) {
      await this.reconcileUserDerivedStats(u.id, { skipPrizeSettlement: true })
    }
  }

  private async syncApprovedSubmissionMentorScoresFromSolutions() {
    const solutions = await this.prisma.solution.findMany({
      select: { sprintId: true, userId: true, mentorScore: true },
    })
    for (const s of solutions) {
      await this.prisma.submission.updateMany({
        where: {
          sprintId: s.sprintId,
          userId: s.userId,
          status: SUBMISSION_STATUS.APPROVED,
        },
        data: { mentorScore: s.mentorScore },
      })
    }
  }

  private async reconcileApprovedSubmissionsWithoutSolutions() {
    const [solutions, approvedSubs] = await Promise.all([
      this.prisma.solution.findMany({
        select: { sprintId: true, userId: true },
      }),
      this.prisma.submission.findMany({
        where: { status: SUBMISSION_STATUS.APPROVED },
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
        status: SUBMISSION_STATUS.DELETED_BY_ADMIN,
        reviewedAt: new Date(),
        reviewNote:
          'Исправление рассинхрона: отправка была в статусе approved без соответствующего решения.',
      },
    })
  }

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

  /** Форматированная строка призовых для ответа API. */
  formatUserMoneyEarned(rub: number) {
    return formatMoneyRub(rub)
  }
}
