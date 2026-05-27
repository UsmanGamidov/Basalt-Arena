import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { AppModule } from './app.module'

function resolveClientDistDir(): string | null {
  const candidates = [
    join(process.cwd(), '../client/dist'),
    join(process.cwd(), 'client/dist'),
  ]
  for (const dir of candidates) {
    if (existsSync(join(dir, 'index.html'))) return dir
  }
  return null
}

function setupClientSpa(app: NestExpressApplication) {
  const dist = resolveClientDistDir()
  if (!dist) {
    console.log('Static UI: skipped (run `npm run build -w client` before start)')
    return
  }
  app.useStaticAssets(dist, { index: false })
  // Express 5+ no longer accepts path '*'; fallback via middleware after routes init.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = String(req.method ?? 'GET').toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') return next()
    const path = String(req.path ?? '')
    if (path.startsWith('/api') || path === '/health') return next()
    res.sendFile(join(dist, 'index.html'), (err: Error | null) => {
      if (err) next(err)
    })
  })
  console.log(`Static UI: ${dist}`)
}

function resolveCorsConfig() {
  const raw = String(process.env.BASALT_CORS_ORIGIN ?? '').trim()
  if (!raw) return true
  if (raw === '*') return true
  const origins = raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  if (origins.length === 0) return true
  return {
    origin: origins,
    credentials: true,
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: resolveCorsConfig(),
  })
  app.enableShutdownHooks()
  app.setGlobalPrefix('api/mock/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  const port = Number(process.env.PORT ?? 3001)
  await app.init()
  setupClientSpa(app)
  await app.listen(port)
  console.log(`Server http://localhost:${port}  (health: http://localhost:${port}/health)`)
}

void bootstrap()
