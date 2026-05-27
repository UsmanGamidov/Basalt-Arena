import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { MockDbService } from '../../mock-db.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly db: MockDbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const admin = await this.db.assertAdminFromAuthHeader(req.headers.authorization)
    req.basaltAdmin = admin
    return true
  }
}
