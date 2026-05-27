import { useCallback, useEffect, useState } from 'react'
import {
  getAdminAllSubmissions,
  getAdminLogs,
  getAdminSprintSubmissions,
} from '../api/basaltApi.js'
import { LIVE_DATA_EVENT } from '../lib/liveData.js'
import { submissionMatchesSearch, submissionMatchesStatus } from '../lib/adminSubmissions.js'
import { ADMIN_USERS_PAGE_SIZE } from './useListPagination.js'

const REGISTRY_SUBMISSIONS_PAGE = ADMIN_USERS_PAGE_SIZE
const ADMIN_LOGS_PAGE = ADMIN_USERS_PAGE_SIZE

export function useAdminRegistryData({ section, setError }) {
  const [submissionsSprintFilter, setSubmissionsSprintFilter] = useState('')
  const [submissionsSearchQuery, setSubmissionsSearchQuery] = useState('')
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState('')
  const [submissionsDateSortDir, setSubmissionsDateSortDir] = useState('desc')
  const [registryLoading, setRegistryLoading] = useState(false)
  const [registrySubmissions, setRegistrySubmissions] = useState([])
  const [registrySubmissionsTotal, setRegistrySubmissionsTotal] = useState(0)
  const [registrySubOffset, setRegistrySubOffset] = useState(0)
  const [adminLogs, setAdminLogs] = useState([])
  const [adminLogsTotal, setAdminLogsTotal] = useState(0)
  const [adminLogsOffset, setAdminLogsOffset] = useState(0)
  const [adminLogsLoading, setAdminLogsLoading] = useState(false)
  const [adminLogsQuery, setAdminLogsQuery] = useState('')

  const loadSubmissions = useCallback(async () => {
    setRegistryLoading(true)
    setError(null)
    try {
      if (submissionsSprintFilter) {
        const subRes = await getAdminSprintSubmissions(submissionsSprintFilter)
        let list = Array.isArray(subRes?.submissions) ? subRes.submissions : []
        const q = submissionsSearchQuery.trim()
        if (q) list = list.filter((s) => submissionMatchesSearch(s, q))
        list = list.filter((s) => submissionMatchesStatus(s, submissionsStatusFilter))
        list = [...list].sort((a, b) => {
          const da = new Date(a?.submittedAt ?? 0).getTime()
          const db = new Date(b?.submittedAt ?? 0).getTime()
          return submissionsDateSortDir === 'asc' ? da - db : db - da
        })
        setRegistrySubmissions(list)
        setRegistrySubmissionsTotal(list.length)
      } else {
        const q = submissionsSearchQuery.trim()
        const sub = await getAdminAllSubmissions({
          limit: REGISTRY_SUBMISSIONS_PAGE,
          offset: registrySubOffset,
          q: q || undefined,
          status: submissionsStatusFilter || undefined,
          sort: `createdAt-${submissionsDateSortDir}`,
        })
        const list = Array.isArray(sub?.submissions) ? sub.submissions : []
        setRegistrySubmissions(list)
        setRegistrySubmissionsTotal(Number(sub?.total) || 0)
      }
    } catch (e) {
      setRegistrySubmissions([])
      setRegistrySubmissionsTotal(0)
      setError(e instanceof Error ? e.message : 'Ошибка загрузки журнала выдач')
    } finally {
      setRegistryLoading(false)
    }
  }, [
    registrySubOffset,
    setError,
    submissionsSprintFilter,
    submissionsSearchQuery,
    submissionsStatusFilter,
    submissionsDateSortDir,
  ])

  const loadAdminLogs = useCallback(async () => {
    setAdminLogsLoading(true)
    setError(null)
    try {
      const q = adminLogsQuery.trim()
      const res = await getAdminLogs({
        limit: ADMIN_LOGS_PAGE,
        offset: adminLogsOffset,
        q: q || undefined,
      })
      setAdminLogs(Array.isArray(res?.logs) ? res.logs : [])
      setAdminLogsTotal(Number(res?.total) || 0)
    } catch (e) {
      setAdminLogs([])
      setAdminLogsTotal(0)
      setError(e instanceof Error ? e.message : 'Ошибка загрузки логов')
    } finally {
      setAdminLogsLoading(false)
    }
  }, [adminLogsOffset, adminLogsQuery, setError])

  useEffect(() => {
    if (section === 'submissions') void loadSubmissions()
  }, [section, loadSubmissions])

  useEffect(() => {
    if (section === 'logs') void loadAdminLogs()
  }, [section, loadAdminLogs])

  useEffect(() => {
    if (section === 'submissions') setRegistrySubOffset(0)
  }, [submissionsSprintFilter, submissionsSearchQuery, submissionsStatusFilter, submissionsDateSortDir, section])

  useEffect(() => {
    if (section === 'logs') setAdminLogsOffset(0)
  }, [adminLogsQuery, section])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const onDataChanged = () => {
      if (section === 'logs') void loadAdminLogs()
    }
    window.addEventListener(LIVE_DATA_EVENT, onDataChanged)
    return () => window.removeEventListener(LIVE_DATA_EVENT, onDataChanged)
  }, [section, loadAdminLogs])

  return {
    submissionsSprintFilter,
    setSubmissionsSprintFilter,
    submissionsSearchQuery,
    setSubmissionsSearchQuery,
    submissionsStatusFilter,
    setSubmissionsStatusFilter,
    submissionsDateSortDir,
    setSubmissionsDateSortDir,
    registryLoading,
    registrySubmissions,
    registrySubmissionsTotal,
    registrySubOffset,
    setRegistrySubOffset,
    adminLogs,
    adminLogsTotal,
    adminLogsOffset,
    setAdminLogsOffset,
    adminLogsLoading,
    adminLogsQuery,
    setAdminLogsQuery,
    loadSubmissions,
    loadAdminLogs,
    ADMIN_LOGS_PAGE,
    REGISTRY_SUBMISSIONS_PAGE,
  }
}
