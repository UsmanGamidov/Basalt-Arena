import { RequestMethod, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import compression from 'compression'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { writeFileSync } from 'node:fs'
import { AppModule } from './app.module'
import { env, resolveCorsOrigin } from './config/env'
import { GlobalExceptionFilter } from './common/filters/http-exception.filter'
import { registerClientSpaRoutes } from './client-dist'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: resolveCorsOrigin() === true ? true : { origin: resolveCorsOrigin(), credentials: true },
    bufferLogs: true,
  })

  app.useLogger(app.get(Logger))
  app.set('trust proxy', 1)
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }))
  app.use(compression())
  app.useBodyParser('json', { limit: '128kb' })

  registerClientSpaRoutes(app)
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.enableShutdownHooks()
  app.setGlobalPrefix('api/mock/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
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

  // Экспорт OpenAPI-спеки при сборке: BASALT_OPENAPI_OUT=./openapi.json npm run start
  const openapiOut = process.env.BASALT_OPENAPI_OUT?.trim()
  if (openapiOut) {
    writeFileSync(openapiOut, JSON.stringify(document, null, 2))
  }

  const logger = app.get(Logger)
  await app.listen(env.PORT)
  logger.log(`Server http://localhost:${env.PORT}  (health: http://localhost:${env.PORT}/health)`)
  logger.log(`OpenAPI http://localhost:${env.PORT}/api/docs`)
}

void bootstrap()
