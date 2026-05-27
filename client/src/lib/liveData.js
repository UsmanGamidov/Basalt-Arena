/** Dispatched after server-side data changes (admin edits, etc.). */
export const LIVE_DATA_EVENT = 'basalt:data-changed'

export function notifyLiveDataChanged(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail }))
}
