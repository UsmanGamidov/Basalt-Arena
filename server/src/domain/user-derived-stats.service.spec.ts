import { UserDerivedStatsService } from './user-derived-stats.service'

describe('UserDerivedStatsService', () => {
  const prisma = {
    user: { findMany: jest.fn() },
    submission: { count: jest.fn(), groupBy: jest.fn() },
  }
  const service = new UserDerivedStatsService(prisma as never)

  it('buildGlobalRankMap assigns ranks by points', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'a', points: 100 },
      { id: 'b', points: 50 },
      { id: 'c', points: 0 },
    ])
    const map = await service.buildGlobalRankMap()
    expect(map.get('a')).toBe('#1')
    expect(map.get('b')).toBe('#2')
    expect(map.get('c')).toBe('#0')
  })

  it('globalRankFromMap returns #0 for zero points', () => {
    const map = new Map([['u1', '#1']])
    expect(service.globalRankFromMap('u1', 0, map)).toBe('#0')
  })
})
