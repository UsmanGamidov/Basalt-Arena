import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Внутренняя ошибка сервера'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        message = (res as { message: string | string[] }).message
      }
    }

    // Логируем серверные сбои с контекстом запроса (requestId выставляет pino-http).
    // Клиенту stack/Prisma/пути не уходят — только безопасное сообщение.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const requestId =
        (request as Request & { id?: string }).id ??
        (request.headers['x-request-id'] as string | undefined)
      const context = `${request.method} ${request.url}${requestId ? ` [req:${requestId}]` : ''}`
      const trace = exception instanceof Error ? (exception.stack ?? exception.message) : String(exception)
      this.logger.error(context, trace)
      // Точка интеграции внешнего трекера ошибок (Sentry и т.п.):
      // reportError?.(exception, { requestId, path: request.url, method: request.method })
    }

    response.status(status).json({
      statusCode: status,
      message,
    })
  }
}
