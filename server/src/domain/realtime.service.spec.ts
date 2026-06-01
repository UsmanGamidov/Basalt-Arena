import { firstValueFrom } from 'rxjs'
import { RealtimeService } from './realtime.service'

describe('RealtimeService', () => {
  it('publishes events to the stream', async () => {
    const svc = new RealtimeService()
    const nextEvent = firstValueFrom(svc.stream$)
    svc.publish('solution')
    const event = await nextEvent
    expect(event.entity).toBe('solution')
    expect(typeof event.at).toBe('string')
  })

  it('delivers events to multiple subscribers', async () => {
    const svc = new RealtimeService()
    const a = firstValueFrom(svc.stream$)
    const b = firstValueFrom(svc.stream$)
    svc.publish('sprint')
    expect((await a).entity).toBe('sprint')
    expect((await b).entity).toBe('sprint')
  })
})
