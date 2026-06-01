const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const BASE = `${API_BASE_URL}/api/mock/v1`
const BASE_V2 = `${API_BASE_URL}/api/mock/v1/v2`
const TOKEN_KEY = 'basalt_mock_token'
const REFRESH_TOKEN_KEY = 'basalt_refresh_token'

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

export function getStoredRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY)
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

export function setStoredRefreshToken(refreshToken, opts = {}) {
  const persist = opts.persist !== false
  safeStorage(() => {
    if (refreshToken) {
      if (persist) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
        safeStorage(() => sessionStorage.removeItem(REFRESH_TOKEN_KEY))
      } else {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
        safeStorage(() => localStorage.removeItem(REFRESH_TOKEN_KEY))
      }
    } else {
      safeStorage(() => localStorage.removeItem(REFRESH_TOKEN_KEY))
      safeStorage(() => sessionStorage.removeItem(REFRESH_TOKEN_KEY))
    }
  })
}

export function setStoredSession({ accessToken, refreshToken, persist = true } = {}) {
  setStoredToken(accessToken, { persist })
  setStoredRefreshToken(refreshToken ?? null, { persist })
}

async function tryRefreshAccessToken() {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const text = await res.text()
    let data = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = null
    }
    if (!res.ok || !data?.accessToken) {
      setStoredSession({ accessToken: null, refreshToken: null })
      return false
    }
    const persist = Boolean(localStorage.getItem(REFRESH_TOKEN_KEY))
    setStoredSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
      persist,
    })
    return true
  } catch {
    return false
  }
}

async function request(path, options = {}) {
  return requestBase(BASE, path, options)
}

async function requestV2(path, options = {}) {
  return requestBase(BASE_V2, path, options)
}

async function requestBase(base, path, options = {}, allowRefresh = true) {
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
  if (res.status === 401 && allowRefresh && token && (await tryRefreshAccessToken())) {
    return requestBase(base, path, options, false)
  }
  if (!res.ok) {
    let msg
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') msg = data.message
      else if (Array.isArray(data.message)) msg = data.message.join(', ')
      if (!msg && data.error) msg = String(data.error)
    }
    if (res.status >= 500) {
      msg = 'Сервер временно недоступен. Попробуйте позже.'
    } else if (msg && /prisma|invocation|\.ts:\d+/i.test(msg)) {
      msg = 'Ошибка сервера. Обратитесь к администратору.'
    }
    throw new Error(msg || res.statusText || `HTTP ${res.status}`)
  }
  return data
}

function normalizeMeFromV2(payload) {
  const u = payload?.user ?? {}
  const profile = u.profile ?? {}
  const statsObj = u.stats ?? {}
  const cards = Array.isArray(statsObj.cards) ? statsObj.cards : []
  const lbPos = Number(statsObj.leaderboardPosition ?? 0)
  const lbSize = Number(statsObj.leaderboardSize ?? 0)
  const rankRaw = String(statsObj.globalRank ?? '#0')
  const parsedRank = Number(rankRaw.replace(/[^\d]/g, ''))

  const sc = u.sprintContext ?? {}
  const rawSprintId =
    typeof sc.activeSprint === 'string' && sc.activeSprint
      ? sc.activeSprint
      : sc.activeSprint != null
        ? String(sc.activeSprint)
        : null
  const activeSprint =
    rawSprintId != null && rawSprintId !== ''
      ? {
          id: rawSprintId,
          title: typeof sc.title === 'string' ? sc.title : `Спринт #${rawSprintId}`,
          description: typeof sc.description === 'string' ? sc.description : '',
          brief:
            sc.brief && typeof sc.brief === 'object' && !Array.isArray(sc.brief) ? sc.brief : {},
          systemActive: sc.systemActive === true,
          endsAt: typeof sc.endsAt === 'string' ? sc.endsAt : sc.endsAt ?? null,
          completedLabel:
            typeof sc.completedLabel === 'string' ? sc.completedLabel : null,
          enrolled: sc.enrolled === true,
          activeSubmission:
            sc.activeSubmission && typeof sc.activeSubmission === 'object'
              ? {
                  id: sc.activeSubmission.id,
                  status: sc.activeSubmission.status,
                  statusLabel: sc.activeSubmission.statusLabel,
                  mentorScore:
                    sc.activeSubmission.mentorScore != null
                      ? Number(sc.activeSubmission.mentorScore)
                      : null,
                }
              : null,
        }
      : null

  return {
    user: {
      id: u.id,
      handle: u.handle,
      role: u.role,
      avatarUrl: u.avatarUrl,
    },
    activeSprint,
    stats: {
      position: lbPos > 0 ? lbPos : Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : 0,
      leaderboardSize: lbSize > 0 ? lbSize : 1,
      points: Number(statsObj.points ?? 0) || 0,
      cards,
    },
    notificationsUnread: Number(u?.notifications?.unreadCount ?? 0) || 0,
    notificationItems: Array.isArray(u?.notifications?.items) ? u.notifications.items : [],
    profile: {
      bio: profile.bio,
      skillsLabel: profile.skillsLabel,
      contacts: profile.contacts ?? {},
      statsCards: cards,
      achievements: Array.isArray(u.achievements) ? u.achievements : [],
      form: profile.form ?? {},
    },
    sprintHistory: {
      items: Array.isArray(u.sprintHistory?.items) ? u.sprintHistory.items : [],
    },
  }
}

export function postLogin(credentials) {
  const { loginOrEmail, email, login, password, remember } = credentials ?? {}
  const id = loginOrEmail ?? email ?? login
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      loginOrEmail: id,
      password,
      remember: remember !== false,
    }),
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
  const refreshToken = getStoredRefreshToken()
  return request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify(refreshToken ? { refreshToken } : {}),
  })
}

export async function getMe() {
  const v2 = await requestV2('/me')
  return normalizeMeFromV2(v2)
}

export function getMySprints() {
  return requestV2('/me/sprints')
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

const HALL_SPRINTS_PAGE_SIZE = 10

/** Активный спринт (isMainActive) — всегда первым в списке зала. */
function sortHallSprintsMainActiveFirst(sprints) {
  if (!Array.isArray(sprints) || sprints.length < 2) return sprints ?? []
  const idx = sprints.findIndex((s) => s.isMainActive === true)
  if (idx <= 0) return sprints
  const rest = sprints.filter((_, i) => i !== idx)
  return [sprints[idx], ...rest]
}

export async function getHall(opts = {}) {
  const limit = opts.limit ?? HALL_SPRINTS_PAGE_SIZE
  const offset = opts.offset ?? 0
  const existingSprints = Array.isArray(opts.existingSprints) ? opts.existingSprints : null

  const list = await getSprintsV2({ limit, offset })
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

  const pageSprints = summaries.map((summary) => {
    const detail = detailsById.get(String(summary.id))
    return {
      id: String(summary.id),
      tabLabel: String(detail?.tabLabel ?? summary.tabLabel ?? ''),
      tabIcon: detail?.tabIcon ?? null,
      heroTitle: String(detail?.title ?? summary.title ?? ''),
      description: String(detail?.description ?? summary.description ?? ''),
      tags: Array.isArray(detail?.tags) ? detail.tags : [],
      completedLabel: String(detail?.completedLabel ?? summary.completedLabel ?? ''),
      endsAt: detail?.endsAt ?? summary.endsAt ?? null,
      systemActive: detail?.systemActive ?? summary.systemActive ?? true,
      isMainActive: detail?.isMainActive === true || summary.isMainActive === true,
      brief: detail?.brief ?? null,
      metrics: detail?.metrics ?? summary.metrics ?? null,
      solutions: Array.isArray(detail?.solutions) ? detail.solutions : [],
    }
  })

  let sprints = pageSprints
  if (existingSprints?.length && offset > 0) {
    const seen = new Set(existingSprints.map((s) => String(s.id)))
    sprints = [...existingSprints, ...pageSprints.filter((s) => !seen.has(String(s.id)))]
  }
  sprints = sortHallSprintsMainActiveFirst(sprints)

  return {
    page: list?.page ?? null,
    quote: list?.quote ?? null,
    pastWinners: Array.isArray(list?.pastWinners) ? list.pastWinners : [],
    loadMoreRemaining: Number(list?.loadMoreRemaining ?? 0) || 0,
    pagination: list?.pagination ?? null,
    sprints,
  }
}

/**
 * Догружает страницы зала, пока спринт с id `targetSprintId` не окажется в `sprints`,
 * или пока не исчерпается пагинация (`loadMoreRemaining`).
 */
export async function mergeHallUntilSprintVisible(targetSprintId, currentData, opts = {}) {
  const want = String(targetSprintId ?? '').trim()
  if (!want || !currentData?.sprints?.length) return currentData
  if (currentData.sprints.some((s) => String(s.id) === want)) return currentData

  const limit = opts.limit ?? HALL_SPRINTS_PAGE_SIZE
  const maxPages = Number(opts.maxPages ?? 40) || 40
  let data = currentData
  let pages = 0
  while (pages < maxPages && data.loadMoreRemaining > 0) {
    if (data.sprints.some((s) => String(s.id) === want)) return data
    pages += 1
    data = await getHall({
      limit,
      offset: data.sprints.length,
      existingSprints: data.sprints,
    })
  }
  return data
}

export function getSprintsV2(opts = {}) {
  const limit = opts.limit ?? HALL_SPRINTS_PAGE_SIZE
  const offset = opts.offset ?? 0
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  return requestV2(`/sprints?${q}`)
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

export function getMyActiveSprintSubmissionV2(sprintId) {
  const id = encodeURIComponent(String(sprintId))
  return requestV2(`/sprints/${id}/submissions/active`)
}

export function deleteMySubmissionV2(submissionId) {
  const id = encodeURIComponent(String(submissionId))
  return requestV2(`/submissions/${id}`, { method: 'DELETE' })
}

/** Лайк решения (Bearer). Возвращает { likes, liked } — liked: стоит ли лайк у текущего пользователя после клика. */
export function postSolutionLike(sprintId, solutionId) {
  const s = encodeURIComponent(String(sprintId))
  const sol = encodeURIComponent(String(solutionId))
  return requestV2(`/sprints/${s}/solutions/${sol}/like`, { method: 'POST' })
}

/** Админ API (Bearer, role admin). */

export function getAdminUsers({ limit = 500, offset = 0 } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return request(`/admin/users?${params}`)
}

export function postAdminCreateUser(body) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getAdminSprints() {
  return request('/admin/sprints')
}

export function patchAdminSprint(sprintId, body) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function getAdminSprintParticipants(sprintId) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}/participants`)
}

export function postAdminSprintParticipants(sprintId, userIds) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}/participants`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  })
}

export function deleteAdminSprintParticipant(sprintId, userId) {
  const sid = encodeURIComponent(String(sprintId))
  const uid = encodeURIComponent(String(userId))
  return request(`/admin/sprints/${sid}/participants/${uid}`, { method: 'DELETE' })
}

export function postAdminCreateSprint(body) {
  return request('/admin/sprints', { method: 'POST', body: JSON.stringify(body) })
}

export function getAdminSprintDetail(sprintId) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}`)
}

export function getAdminSprintSubmissions(sprintId) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}/submissions`)
}

export function deleteAdminSprintSubmission(sprintId, submissionId) {
  const sid = encodeURIComponent(String(sprintId))
  const sub = encodeURIComponent(String(submissionId))
  return request(`/admin/sprints/${sid}/submissions/${sub}`, { method: 'DELETE' })
}

export function patchAdminUser(userId, body) {
  const id = encodeURIComponent(String(userId))
  return request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteAdminSprint(sprintId) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}`, { method: 'DELETE' })
}

export function postAdminSolution(sprintId, body) {
  const id = encodeURIComponent(String(sprintId))
  return request(`/admin/sprints/${id}/solutions`, { method: 'POST', body: JSON.stringify(body) })
}

export function patchAdminSolution(solutionId, body) {
  const id = encodeURIComponent(String(solutionId))
  return request(`/admin/solutions/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteAdminSolution(solutionId) {
  const id = encodeURIComponent(String(solutionId))
  return request(`/admin/solutions/${id}`, { method: 'DELETE' })
}

export function getAdminAchievementDefinitions() {
  return request('/admin/achievements/definitions')
}

export function postAdminAchievementDefinition(body) {
  return request('/admin/achievements/definitions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteAdminAchievementDefinition(definitionId) {
  const id = encodeURIComponent(String(definitionId))
  return request(`/admin/achievements/definitions/${id}`, { method: 'DELETE' })
}

export function patchAdminAchievementDefinition(definitionId, body) {
  const id = encodeURIComponent(String(definitionId))
  return request(`/admin/achievements/definitions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function postAdminGrantAchievement(body) {
  return request('/admin/achievements/grant', { method: 'POST', body: JSON.stringify(body) })
}

export function getAdminAchievements({ limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return request(`/admin/achievements?${params}`)
}

export function deleteAdminAchievement(achievementId) {
  const id = encodeURIComponent(String(achievementId))
  return request(`/admin/achievements/${id}`, { method: 'DELETE' })
}

export function getAdminAllSubmissions(opts = {}) {
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  if (opts.q) q.set('q', String(opts.q))
  if (opts.status) q.set('status', String(opts.status))
  if (opts.sort) q.set('sort', String(opts.sort))
  return request(`/admin/submissions?${q}`)
}

export function getAdminLogs(opts = {}) {
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  if (opts.q) q.set('q', String(opts.q))
  return request(`/admin/logs?${q}`)
}

export function postAdminReviewSubmission(submissionId, body) {
  const id = encodeURIComponent(String(submissionId))
  return request(`/admin/submissions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteAdminUser(userId) {
  const id = encodeURIComponent(String(userId))
  return request(`/admin/users/${id}`, { method: 'DELETE' })
}
