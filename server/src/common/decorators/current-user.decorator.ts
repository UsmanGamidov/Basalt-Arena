import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import type { BasaltSessionUser } from '../../types/session-user'

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): BasaltSessionUser => {
  const req = ctx.switchToHttp().getRequest<Request>()
  const user = req.basaltUser
  if (!user) {
    throw new UnauthorizedException('Требуется авторизация')
  }
  return user
})
