import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'
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
  registerClientSpaRoutes(app)
  app.useGlobalFilters(new GlobalExceptionFilter())
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Basalt Arena API')
    .setDescription('REST API платформы Basalt Arena')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
  console.log(`Server http://localhost:${port}  (health: http://localhost:${port}/health)`)
  console.log(`OpenAPI http://localhost:${port}/api/docs`)
}

void bootstrap()
