import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from './prisma/prisma.service'

/** Маршруты исключены из глобального префикса — см. `main.ts` (`GET /health`). */
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: процесс жив (без внешних зависимостей). */
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'basalt-arena-api',
      timeUtc: new Date().toISOString(),
    }
  }

  /** Readiness: готов обслуживать трафик — проверяется коннект к БД. */
  @Get('health/ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { ok: true, db: 'up', timeUtc: new Date().toISOString() }
    } catch {
      return { ok: false, db: 'down', timeUtc: new Date().toISOString() }
    }
  }
}
