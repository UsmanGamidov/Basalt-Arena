import { useEffect, useRef } from 'react'
import { LIVE_DATA_EVENT } from '../lib/liveData.js'

const DEFAULT_INTERVAL_MS = 25_000

/**
 * Refetch when tab becomes visible, on basalt:data-changed, and on an interval.
 * @param {() => void | Promise<void>} onRefresh
 * @param {{ enabled?: boolean, intervalMs?: number }} [options]
 */
export function useLiveDataRefresh(onRefresh, options = {}) {
  const { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = options
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!enabled) return

    const run = () => {
      void onRefreshRef.current()
    }

    const onEvent = () => run()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }

    window.addEventListener(LIVE_DATA_EVENT, onEvent)
    document.addEventListener('visibilitychange', onVisibility)
    const timer = window.setInterval(run, intervalMs)

    return () => {
      window.removeEventListener(LIVE_DATA_EVENT, onEvent)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(timer)
    }
  }, [enabled, intervalMs])
}
