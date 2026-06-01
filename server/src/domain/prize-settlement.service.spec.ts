import { PrizeSettlementService } from './prize-settlement.service'

describe('PrizeSettlementService', () => {
  describe('recalculateSprintRanks', () => {
    it('assigns rank, badge and crown by order', async () => {
      const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> = []
      const prisma = {
        solution: {
          findMany: jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]),
          update: jest.fn((arg) => {
            updates.push(arg)
            return arg
          }),
        },
        $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
      } as never

      const svc = new PrizeSettlementService(prisma)
      const result = await svc.recalculateSprintRanks('S1')

      expect(result).toEqual({ count: 4 })
      expect(updates.map((u) => u.data)).toEqual([
        { rank: 1, rankBadge: 'gold', showCrown: true },
        { rank: 2, rankBadge: 'slate', showCrown: false },
        { rank: 3, rankBadge: 'bronze', showCrown: false },
        { rank: 4, rankBadge: 'muted', showCrown: false },
      ])
    })

    it('does nothing for an empty sprint', async () => {
      const prisma = {
        solution: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
        $transaction: jest.fn(),
      } as never
      const svc = new PrizeSettlementService(prisma)
      const result = await svc.recalculateSprintRanks('S1')
      expect(result).toEqual({ count: 0 })
      expect((prisma as { $transaction: jest.Mock }).$transaction).not.toHaveBeenCalled()
    })
  })

  describe('reconcileUserDerivedStats', () => {
    function buildPrisma(mentorSum: number | null, prizeSum: number | null) {
      return {
        solution: { aggregate: jest.fn().mockResolvedValue({ _sum: { mentorScore: mentorSum } }) },
        sprint: { aggregate: jest.fn().mockResolvedValue({ _sum: { prizeMoney: prizeSum } }) },
        user: { update: jest.fn() },
      }
    }

    it('sets points = sum(mentorScore) and moneyEarned = sum(prizeMoney)', async () => {
      const prisma = buildPrisma(42, 5000)
      const svc = new PrizeSettlementService(prisma as never)
      await svc.reconcileUserDerivedStats('u1', { skipPrizeSettlement: true })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: 42, moneyEarned: 5000 },
      })
    })

    it('clamps negative/empty aggregates to zero', async () => {
      const prisma = buildPrisma(-10, null)
      const svc = new PrizeSettlementService(prisma as never)
      await svc.reconcileUserDerivedStats('u1', { skipPrizeSettlement: true })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { points: 0, moneyEarned: 0 },
      })
    })
  })
})
