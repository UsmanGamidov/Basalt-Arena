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
export function registerClientSpaRoutes(
  expressApp: {
    use: (handler: (req: Request, res: Response, next: NextFunction) => void) => void
    get: (
      path: string | RegExp,
      handler: (req: Request, res: Response, next: NextFunction) => void,
    ) => void
  },
  sendStatic: (root: string) => (req: Request, res: Response, next: NextFunction) => void,
) {
  const indexPath = resolveClientIndexHtml()
  if (!indexPath) {
    console.log('Static UI: skipped (run `npm run build -w client` before start)')
    return
  }
  const dist = join(indexPath, '..')
  expressApp.use(sendStatic(dist))
  expressApp.get('/', (_req, res) => {
    res.sendFile(indexPath)
  })
  expressApp.get(/^\/(?!api(?:\/|$)|health(?:\/|$)).*$/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    res.sendFile(indexPath, (err) => {
      if (err) next(err)
    })
  })
  console.log(`Static UI: ${dist}`)
}
