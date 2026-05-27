import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { MockDbService } from '../../mock-db.service'

/** Bearer по возможности; без токена или при ошибке — `req.basaltUser` не выставляется. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly db: MockDbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    req.basaltUser = (await this.db.trySessionFromAuthHeader(req.headers.authorization)) ?? undefined
    return true
  }
}
