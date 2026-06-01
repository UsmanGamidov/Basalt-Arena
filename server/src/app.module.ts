import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from './modules/auth/auth.module'
import { V2Module } from './modules/v2/v2.module'
import { AdminModule } from './modules/admin/admin.module'
import { CoreModule } from './core.module'
import { PrismaModule } from './prisma/prisma.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CoreModule,
    PrismaModule,
    AuthModule,
    V2Module,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
