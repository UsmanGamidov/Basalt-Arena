import { useEffect } from 'react'
import { notifyLiveDataChanged } from '../lib/liveData.js'

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const EVENTS_URL = `${API_BASE_URL}/api/mock/v1/v2/events`

/**
 * Подписка на серверные SSE-события. По каждому `update` дёргает общую шину
 * live-refresh — данные обновляются почти мгновенно, а интервальный поллинг
 * в useLiveDataRefresh остаётся как фолбэк. EventSource сам переподключается.
 */
export function useRealtimeBridge() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined

    const source = new EventSource(EVENTS_URL)
    const onUpdate = (event) => {
      let detail = { source: 'sse' }
      try {
        detail = { source: 'sse', ...JSON.parse(event.data) }
      } catch {
        /* событие без полезной нагрузки — просто триггерим refresh */
      }
      notifyLiveDataChanged(detail)
    }

    source.addEventListener('update', onUpdate)
    return () => {
      source.removeEventListener('update', onUpdate)
      source.close()
    }
  }, [])
}
