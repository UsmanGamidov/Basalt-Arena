import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { env } from './config/env'
import { AuthService } from './auth/auth.service'
import { AuthSessionService } from './auth/auth-session.service'
import { AdminAuditService } from './domain/admin-audit.service'
import { AdminService } from './domain/admin.service'
import { AppBootstrapService } from './domain/app-bootstrap.service'
import { MetaService } from './domain/meta.service'
import { NotificationService } from './domain/notification.service'
import { PasswordService } from './domain/password.service'
import { PrizeSettlementService } from './domain/prize-settlement.service'
import { RealtimeService } from './domain/realtime.service'
import { SolutionsService } from './domain/solutions.service'
import { SprintsService } from './domain/sprints.service'
import { SubmissionsService } from './domain/submissions.service'
import { SprintLifecycleService } from './domain/sprint-lifecycle.service'
import { UserDerivedStatsService } from './domain/user-derived-stats.service'
import { UsersService } from './domain/users.service'

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AppBootstrapService,
    AuthService,
    AuthSessionService,
    PasswordService,
    NotificationService,
    SprintLifecycleService,
    AdminAuditService,
    PrizeSettlementService,
    UserDerivedStatsService,
    AdminService,
    MetaService,
    UsersService,
    SprintsService,
    SubmissionsService,
    SolutionsService,
    RealtimeService,
  ],
  exports: [
    AuthSessionService,
    AuthService,
    PasswordService,
    NotificationService,
    SprintLifecycleService,
    AdminAuditService,
    PrizeSettlementService,
    UserDerivedStatsService,
    AdminService,
    MetaService,
    UsersService,
    SprintsService,
    SubmissionsService,
    SolutionsService,
    RealtimeService,
  ],
})
export class CoreModule {}
