import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { MockDbService } from '../../mock-db.service'

/** Требует `Authorization: Bearer` с валидным JWT. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly db: MockDbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const user = await this.db.assertSessionFromAuthHeader(req.headers.authorization)
    req.basaltUser = user
    return true
  }
}
