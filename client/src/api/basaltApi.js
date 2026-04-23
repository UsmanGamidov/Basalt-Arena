const BASE = '/api/mock/v1'
const BASE_V2 = '/api/mock/v1/v2'
const TOKEN_KEY = 'basalt_mock_token'

function safeStorage(fn) {
  try {
    fn()
  } catch {
    return undefined
  }
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token, opts = {}) {
  const persist = opts.persist !== false
  safeStorage(() => {
    if (token) {
      if (persist) {
        localStorage.setItem(TOKEN_KEY, token)
        safeStorage(() => sessionStorage.removeItem(TOKEN_KEY))
      } else {
        sessionStorage.setItem(TOKEN_KEY, token)
        safeStorage(() => localStorage.removeItem(TOKEN_KEY))
      }
    } else {
      safeStorage(() => localStorage.removeItem(TOKEN_KEY))
      safeStorage(() => sessionStorage.removeItem(TOKEN_KEY))
    }
  })
}

async function request(path, options = {}) {
  return requestBase(BASE, path, options)
}

async function requestV2(path, options = {}) {
  return requestBase(BASE_V2, path, options)
}

async function requestBase(base, path, options = {}) {
  const token = getStoredToken()
  const res = await fetch(`${base}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    const msg = data?.error ?? res.statusText
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return data
}

function normalizeMeFromV2(payload) {
  const u = payload?.user ?? {}
  const profile = u.profile ?? {}
  const statsObj = u.stats ?? {}
  const cards = Array.isArray(statsObj.cards) ? statsObj.cards : []
  const rankRaw = String(statsObj.globalRank ?? '#0')
  const parsedRank = Number(rankRaw.replace(/[^\d]/g, ''))

  return {
    user: {
      id: u.id,
      handle: u.handle,
      role: u.role,
      avatarUrl: u.avatarUrl,
    },
    activeSprint: u?.sprintContext?.activeSprint ?? null,
    stats: {
      position: Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : 0,
      leaderboardSize: 10,
      points: Number(statsObj.points ?? 0) || 0,
      cards,
    },
    notificationsUnread: Number(u?.notifications?.unreadCount ?? 0) || 0,
    profile: {
      bio: profile.bio,
      skillsLabel: profile.skillsLabel,
      contacts: profile.contacts ?? {},
      statsCards: cards,
      achievements: Array.isArray(u.achievements) ? u.achievements : [],
      form: profile.form ?? {},
    },
    sprintHistory: { items: [] },
  }
}

export function postLogin(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function postRegister(payload, opts = {}) {
  const devKey = opts.devKey ? String(opts.devKey) : ''
  return request('/auth/register', {
    method: 'POST',
    headers: devKey ? { 'x-dev-register-key': devKey } : {},
    body: JSON.stringify(payload),
  })
}

export function postLogout() {
  return request('/auth/logout', { method: 'POST' })
}

export async function getMe() {
  const v2 = await requestV2('/me')
  return normalizeMeFromV2(v2)
}

export function patchProfile(payload) {
  return requestV2('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function postNotificationsRead() {
  const res = await requestV2('/me/notifications/read', { method: 'POST' })
  return { notificationsUnread: Number(res?.unreadCount ?? 0) || 0 }
}

export async function getMeta() {
  const res = await requestV2('/meta')
  return {
    build: String(res?.app?.build ?? 'v0.0.0-mock'),
    serverTimeUtcDisplay: String(res?.server?.timeUtcDisplay ?? '00:00'),
    copyrightYear: Number(res?.app?.copyrightYear ?? new Date().getUTCFullYear()),
    sprintTeaser: res?.sprintTeaser ?? null,
    marketing: res?.marketing ?? null,
  }
}

export function postSubmission(payload) {
  return requestV2('/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getHall() {
  const list = await getSprintsV2()
  const summaries = Array.isArray(list?.sprints) ? list.sprints : []
  const detailResponses = await Promise.all(
    summaries.map((s) => getSprintByIdV2(String(s.id))),
  )

  const detailsById = new Map(
    detailResponses
      .map((res) => res?.sprint)
      .filter(Boolean)
      .map((s) => [String(s.id), s]),
  )

  const sprints = summaries.map((summary) => {
    const detail = detailsById.get(String(summary.id))
    return {
      id: String(summary.id),
      tabLabel: String(detail?.tabLabel ?? summary.tabLabel ?? ''),
      tabIcon: detail?.tabIcon ?? null,
      heroTitle: String(detail?.title ?? summary.title ?? ''),
      tags: Array.isArray(detail?.tags) ? detail.tags : [],
      completedLabel: String(detail?.completedLabel ?? summary.completedLabel ?? ''),
      brief: detail?.brief ?? null,
      metrics: detail?.metrics ?? summary.metrics ?? null,
      solutions: Array.isArray(detail?.solutions) ? detail.solutions : [],
    }
  })

  return {
    page: list?.page ?? null,
    quote: list?.quote ?? null,
    pastWinners: Array.isArray(list?.pastWinners) ? list.pastWinners : [],
    loadMoreRemaining: Number(list?.loadMoreRemaining ?? 0) || 0,
    sprints,
  }
}

export function getSprintsV2() {
  return requestV2('/sprints')
}

export function getSprintByIdV2(id) {
  return requestV2(`/sprints/${id}`)
}

export function getSprintSolutionsV2(id) {
  return requestV2(`/sprints/${id}/solutions`)
}

export function postSprintSubmissionV2(id, payload) {
  return requestV2(`/sprints/${id}/submissions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
