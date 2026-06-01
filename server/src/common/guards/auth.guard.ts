import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { AuthSessionService } from '../../auth/auth-session.service'

/** Требует `Authorization: Bearer` с валидным JWT. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = await this.sessions.assertSessionFromAuthHeader(req.headers.authorization)
    req.basaltUser = user
    return true
  }
}
