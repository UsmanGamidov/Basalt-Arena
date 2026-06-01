import { Injectable } from '@nestjs/common'
import { SUBMISSION_STATUS } from '../common/constants/submission-status'
import { PrismaService } from '../prisma/prisma.service'

/** Ранг и число спринтов считаются на чтении, без денормализации в User. */
@Injectable()
export class UserDerivedStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildGlobalRankMap(): Promise<Map<string, string>> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, points: true },
    })
    const map = new Map<string, string>()
    let place = 0
    for (const u of users) {
      map.set(u.id, u.points > 0 ? `#${++place}` : '#0')
    }
    return map
  }

  globalRankFromMap(userId: string, points: number, rankMap: Map<string, string>): string {
    if (points <= 0) return '#0'
    return rankMap.get(userId) ?? '#0'
  }

  async sprintsCompletedForUser(userId: string): Promise<number> {
    return this.prisma.submission.count({
      where: { userId, status: SUBMISSION_STATUS.APPROVED },
    })
  }

  async buildSprintsCompletedMap(userIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>()
    if (userIds.length === 0) return map
    const rows = await this.prisma.submission.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: SUBMISSION_STATUS.APPROVED },
      _count: { _all: true },
    })
    for (const row of rows) {
      map.set(row.userId, row._count._all)
    }
    return map
  }

  async enrichUsers<T extends { id: string; points: number }>(
    users: T[],
  ): Promise<(T & { globalRank: string; sprintsCompleted: number })[]> {
    const ids = users.map((u) => u.id)
    const [rankMap, sprintMap] = await Promise.all([
      this.buildGlobalRankMap(),
      this.buildSprintsCompletedMap(ids),
    ])
    return users.map((u) => ({
      ...u,
      globalRank: this.globalRankFromMap(u.id, u.points, rankMap),
      sprintsCompleted: sprintMap.get(u.id) ?? 0,
    }))
  }
}
