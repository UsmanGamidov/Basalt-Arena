import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../errors/AppError.js'
import type { UserRole } from '@prisma/client'

/**
 * After `requireAuth`: only ADMIN (or ADMIN|MENTOR for `/submissions*`) may use `/api/v1/admin`.
 * MEMBER/MENTOR on non-submission admin routes → 403.
 */
export function requireAdminArea(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(AppError.unauthorized('Missing authentication'))
  }
  const path = req.path.startsWith('/') ? req.path : `/${req.path}`
  const submissionsArea = path === '/submissions' || path.startsWith('/submissions/')
  const allowed: UserRole[] = submissionsArea ? ['ADMIN', 'MENTOR'] : ['ADMIN']
  if (!allowed.includes(req.auth.role)) {
    return next(AppError.forbidden('Insufficient permissions for this admin resource'))
  }
  next()
}
