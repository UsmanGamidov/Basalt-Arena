import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import express from 'express'
import { AppModule } from './app.module'
import { registerClientSpaRoutes } from './client-dist'

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
  const expressApp = app.getHttpAdapter().getInstance()
  registerClientSpaRoutes(expressApp, express.static)
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
  await app.listen(port)
  console.log(`Server http://localhost:${port}  (health: http://localhost:${port}/health)`)
}

void bootstrap()
