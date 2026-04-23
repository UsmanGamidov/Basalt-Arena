import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMe,
  getStoredToken,
  postLogin,
  postLogout,
  postNotificationsRead,
  setStoredToken,
} from '../api/basaltApi.js'
import { AuthContext } from './context.js'

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [activeSprint, setActiveSprint] = useState(null)
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sprintHistory, setSprintHistory] = useState(null)
  const [notificationsUnread, setNotificationsUnread] = useState(0)

  const applyMe = useCallback((me) => {
    setUser(me.user)
    setActiveSprint(me.activeSprint ?? null)
    setStats(me.stats ?? null)
    setProfile(me.profile ?? null)
    setSprintHistory(me.sprintHistory ?? null)
    setNotificationsUnread(me.notificationsUnread ?? 0)
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setActiveSprint(null)
    setStats(null)
    setProfile(null)
    setSprintHistory(null)
    setNotificationsUnread(0)
  }, [])

  const loadSession = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      clearSession()
      setReady(true)
      return
    }
    try {
      applyMe(await getMe())
    } catch {
      setStoredToken(null)
      clearSession()
    } finally {
      setReady(true)
    }
  }, [applyMe, clearSession])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const login = useCallback(
    async (email, password, rememberSession = true) => {
      const res = await postLogin({ email, password })
      setStoredToken(res.accessToken, { persist: rememberSession })
      applyMe(await getMe())
    },
    [applyMe],
  )

  const logout = useCallback(async () => {
    try {
      await postLogout()
    } catch (_error) {
      void _error
    }
    setStoredToken(null)
    clearSession()
    setReady(true)
  }, [clearSession])

  const markNotificationsRead = useCallback(async () => {
    try {
      const res = await postNotificationsRead()
      setNotificationsUnread(res.notificationsUnread ?? 0)
    } catch {
      setNotificationsUnread(0)
    }
  }, [])

  const value = useMemo(
    () => ({
      ready,
      user,
      activeSprint,
      stats,
      profile,
      sprintHistory,
      notificationsUnread,
      login,
      logout,
      markNotificationsRead,
      refreshSession: loadSession,
    }),
    [
      ready,
      user,
      activeSprint,
      stats,
      profile,
      sprintHistory,
      notificationsUnread,
      login,
      logout,
      markNotificationsRead,
      loadSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
