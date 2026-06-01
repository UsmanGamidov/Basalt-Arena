import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { LoggerModule } from 'nestjs-pino'
import { env } from './config/env'
import { AuthModule } from './modules/auth/auth.module'
import { V2Module } from './modules/v2/v2.module'
import { AdminModule } from './modules/admin/admin.module'
import { CoreModule } from './core.module'
import { PrismaModule } from './prisma/prisma.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const incoming = req.headers['x-request-id']
          const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID()
          res.setHeader('x-request-id', id)
          return id
        },
        autoLogging: { ignore: (req: IncomingMessage) => req.url === '/health' },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) =>
          err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        transport:
          env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CoreModule,
    PrismaModule,
    AuthModule,
    V2Module,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Глобальный rate-limit (120/мин) на все маршруты; @Throttle на роутах ужесточает лимит точечно.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
