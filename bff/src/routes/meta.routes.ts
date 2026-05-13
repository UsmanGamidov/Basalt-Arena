import { Router } from 'express'
import type { Container } from '../container.js'

export function metaRouter(_container: Container) {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json({
      build: 'v2.0.0',
      serverTimeUtcDisplay: new Date().toISOString().slice(11, 16),
      copyrightYear: new Date().getUTCFullYear(),
      sprintTeaser: { sprintNumber: 2, title: '#2 Basalt Arena (frontend)', systemActive: true },
      marketing: {
        fighters: 142,
        totalSprints: 7,
        prizePoolShort: '280K',
        prizeCurrency: '₽',
      },
    })
  })

  return router
}
