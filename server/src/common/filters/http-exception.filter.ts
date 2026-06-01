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
    } else if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack ?? exception.message,
      )
      // Клиенту не отдаём stack / Prisma / пути к файлам — только в лог сервера.
    } else {
      this.logger.error(`${request.method} ${request.url}`, String(exception))
    }

    response.status(status).json({
      statusCode: status,
      message,
    })
  }
}
