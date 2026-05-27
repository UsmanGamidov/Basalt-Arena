import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import type { BasaltSessionUser } from '../../types/session-user'

export const OptionalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BasaltSessionUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>()
    return req.basaltUser
  },
)
