import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { AuthSessionService } from '../../auth/auth-session.service'

/** Опциональная авторизация: если Bearer валиден — кладёт пользователя в req.basaltUser. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly sessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = await this.sessions.trySessionFromAuthHeader(req.headers.authorization)
    if (user) req.basaltUser = user
    return true
  }
}
