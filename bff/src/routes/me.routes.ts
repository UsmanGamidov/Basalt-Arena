import { Router } from 'express'
import { AppError } from '../errors/AppError.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import type { Container } from '../container.js'
import { meProfilePatchBody } from '../validation/schemas.js'

export function meRouter(container: Container) {
  const router = Router()

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const me = await container.userView.me(req.auth!.sub)
      if (!me) throw AppError.unauthorized('User no longer exists')
      res.json(me)
    }),
  )

  router.patch(
    '/profile',
    requireAuth,
    asyncHandler(async (req, res) => {
      const { form } = meProfilePatchBody.parse(req.body)
      const updated = await container.profiles.patch(req.auth!.sub, form)
      res.json({
        ok: true,
        user: { id: updated.id, handle: updated.handle, avatarUrl: updated.avatarUrl },
      })
    }),
  )

  router.post(
    '/notifications/read',
    requireAuth,
    asyncHandler(async (req, res) => {
      const unreadCount = await container.userView.markAllNotificationsRead(req.auth!.sub)
      res.json({ unreadCount })
    }),
  )

  return router
}
