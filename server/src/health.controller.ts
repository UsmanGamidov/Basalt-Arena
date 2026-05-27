import { Controller, Get } from '@nestjs/common'

/** Маршрут исключён из глобального префикса — см. `main.ts` (`GET /health`). */
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'basalt-arena-api',
      timeUtc: new Date().toISOString(),
    }
  }
}
