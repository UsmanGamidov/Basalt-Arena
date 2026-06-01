import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeService } from './realtime.service'
import type { BasaltSessionUser } from '../types/session-user'

@Injectable()
export class SolutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

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
    this.realtime.publish('solution')
    return { likes, liked: !existing }
  }
}
