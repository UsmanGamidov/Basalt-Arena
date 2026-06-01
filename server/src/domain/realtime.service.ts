import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'

export type RealtimeEntity = 'submission' | 'solution' | 'sprint' | 'user'

export interface RealtimeEvent {
  entity: RealtimeEntity
  at: string
}

/**
 * Лёгкая шина серверных событий для SSE. Доменные сервисы вызывают `publish`
 * после изменений; SSE-эндпоинт (`GET /v2/events`) транслирует их клиентам,
 * которые в ответ перезапрашивают данные (полезной нагрузки/PII в событии нет).
 */
@Injectable()
export class RealtimeService {
  private readonly subject = new Subject<RealtimeEvent>()
  readonly stream$ = this.subject.asObservable()

  publish(entity: RealtimeEntity) {
    this.subject.next({ entity, at: new Date().toISOString() })
  }
}
