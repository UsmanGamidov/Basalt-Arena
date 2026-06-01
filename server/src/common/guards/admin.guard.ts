import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { AuthSessionService } from '../../auth/auth-session.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly sessions: AuthSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = await this.sessions.assertAdminFromAuthHeader(req.headers.authorization)
    req.basaltAdmin = user
    return true
  }
}
