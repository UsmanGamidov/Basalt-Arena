import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MetaService {
  constructor(private readonly prisma: PrismaService) {}

  async getMeta() {
    const fighters = await this.prisma.user.count()
    const sprintNumber = await this.prisma.sprint.count()
    const build = String(process.env.BASALT_APP_BUILD ?? 'basalt-arena').trim()
    const prizePoolShort = String(process.env.BASALT_PRIZE_POOL_SHORT ?? '120K').trim()
    const prizeCurrency = String(process.env.BASALT_PRIZE_CURRENCY ?? '₽').trim()
    return {
      app: { build, copyrightYear: new Date().getUTCFullYear() },
      server: { timeUtcDisplay: new Date().toISOString().slice(11, 16) },
      sprintTeaser: { sprintNumber },
      marketing: { fighters, prizePoolShort, prizeCurrency },
    }
  }
}
