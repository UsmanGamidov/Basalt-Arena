import type { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export function resolveClientIndexHtml(): string | null {
  const candidates = [
    join(process.cwd(), '../client/dist'),
    join(process.cwd(), 'client/dist'),
  ]
  for (const dir of candidates) {
    const index = join(dir, 'index.html')
    if (existsSync(index)) return index
  }
  return null
}

/** Регистрирует статику и SPA на корне `/` (до API-маршрутов Nest). */
export function registerClientSpaRoutes(app: NestExpressApplication) {
  const indexPath = resolveClientIndexHtml()
  if (!indexPath) {
    console.log('Static UI: skipped (run `npm run build -w client` before start)')
    return
  }
  const dist = join(indexPath, '..')
  app.useStaticAssets(dist, { index: false })
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.get('/', (_req: Request, res: Response) => {
    res.sendFile(indexPath)
  })
  expressApp.get(/^\/(?!api(?:\/|$)|health(?:\/|$)).*$/, (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    res.sendFile(indexPath, (err) => {
      if (err) next(err)
    })
  })
  console.log(`Static UI: ${dist}`)
}
