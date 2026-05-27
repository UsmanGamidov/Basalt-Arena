import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteAdminSolution,
  getAdminSprintDetail,
  patchAdminSolution,
  postAdminSolution,
} from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import { solutionMatchesSearch } from '../lib/adminSolutions.js'
import {
  clampMentorScore,
  isValidMentorScore,
  MENTOR_SCORE_MAX,
} from '../lib/mentorScore.js'

export function useAdminSolutionsData({
  section,
  sprints,
  users,
  setError,
  setNotice,
  confirm,
  loadAll,
}) {
  const [solutionsSprintId, setSolutionsSprintId] = useState('')
  const [adminDetail, setAdminDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [solUserId, setSolUserId] = useState('')
  const [solMentor, setSolMentor] = useState(80)
  const [solCodeUrl, setSolCodeUrl] = useState('https://github.com/')
  const [solDemoUrl, setSolDemoUrl] = useState('')
  const [solBusy, setSolBusy] = useState(false)
  const [solutionDrafts, setSolutionDrafts] = useState({})
  const [solutionsSearchQuery, setSolutionsSearchQuery] = useState('')
  const [solutionsSaveBusy, setSolutionsSaveBusy] = useState(false)

  const refreshSprintDetail = useCallback(async (sid) => {
    if (!sid) {
      setAdminDetail(null)
      return
    }
    setDetailLoading(true)
    try {
      const res = await getAdminSprintDetail(sid)
      setAdminDetail(res?.sprint ?? null)
    } catch {
      setAdminDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (section !== 'solutions' || !solutionsSprintId) {
      if (section !== 'solutions') setAdminDetail(null)
      return
    }
    void refreshSprintDetail(solutionsSprintId)
  }, [section, solutionsSprintId, refreshSprintDetail])

  useEffect(() => {
    if (sprints.length && !solutionsSprintId) {
      setSolutionsSprintId(String(sprints[0].id))
    }
  }, [sprints, solutionsSprintId])

  useEffect(() => {
    if (users.length && !solUserId) {
      setSolUserId(users[0].id)
    }
  }, [users, solUserId])

  const sprintSolutions = useMemo(
    () => (Array.isArray(adminDetail?.solutions) ? adminDetail.solutions : []),
    [adminDetail],
  )

  const solutionsById = useMemo(() => {
    const map = new Map()
    for (const sol of sprintSolutions) {
      map.set(sol.id, sol)
    }
    return map
  }, [sprintSolutions])

  useEffect(() => {
    setSolutionDrafts((prev) => {
      const next = { ...prev }
      for (const sol of sprintSolutions) {
        const id = sol.id
        const serverScore = String(sol.mentorScore ?? 0)
        const serverCodeUrl = String(sol.codeUrl ?? '')
        const serverDemoUrl = String(sol.demoUrl ?? '')
        const cur = prev[id]
        if (!cur) {
          next[id] = {
            mentorScore: serverScore,
            codeUrl: serverCodeUrl,
            demoUrl: serverDemoUrl,
          }
        } else if (
          Number(cur.mentorScore) === Number(sol.mentorScore) &&
          String(cur.codeUrl ?? '') === String(sol.codeUrl ?? '') &&
          String(cur.demoUrl ?? '') === String(sol.demoUrl ?? '')
        ) {
          next[id] = {
            mentorScore: serverScore,
            codeUrl: serverCodeUrl,
            demoUrl: serverDemoUrl,
          }
        }
      }
      return next
    })
  }, [sprintSolutions])

  const dirtySolutionIds = useMemo(() => {
    return [...solutionsById.keys()].filter((id) => {
      const sol = solutionsById.get(id)
      const d = solutionDrafts[id]
      if (!sol || !d) return false
      return (
        Number(d.mentorScore) !== Number(sol.mentorScore) ||
        String(d.codeUrl ?? '') !== String(sol.codeUrl ?? '') ||
        String(d.demoUrl ?? '') !== String(sol.demoUrl ?? '')
      )
    })
  }, [solutionsById, solutionDrafts])

  const solutionsStatusText = useMemo(() => {
    const dirty =
      dirtySolutionIds.length > 0 ? `Несохранённых: ${dirtySolutionIds.length}` : 'Нет изменений'
    const total = sprintSolutions.length
    const q = solutionsSearchQuery.trim()
    if (q) {
      const shown = sprintSolutions.filter((s) =>
        solutionMatchesSearch(s, q),
      ).length
      return `${dirty} · в спринте ${shown} из ${total}`
    }
    return total > 0 ? `${dirty} · в спринте ${total}` : dirty
  }, [dirtySolutionIds.length, solutionsSearchQuery, sprintSolutions])

  async function onAddSolution(e) {
    e.preventDefault()
    const sid = String(solutionsSprintId || '').trim()
    if (!sid || !solUserId) return
    setSolBusy(true)
    setError(null)
    try {
      await postAdminSolution(sid, {
        userId: solUserId,
        mentorScore: clampMentorScore(solMentor),
        codeUrl: solCodeUrl.trim() || 'https://github.com/',
        demoUrl: solDemoUrl.trim() || undefined,
      })
      setNotice('Решение добавлено')
      setSolDemoUrl('')
      await refreshSprintDetail(sid)
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSolBusy(false)
    }
  }

  async function onDeleteSolution(solutionId) {
    const ok = await confirm({
      title: 'Удалить решение?',
      message: 'Решение будет удалено без возможности восстановления.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    const sid = String(solutionsSprintId || '').trim()
    setError(null)
    try {
      await deleteAdminSolution(solutionId)
      setNotice('Решение удалено')
      if (sid) await refreshSprintDetail(sid)
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  async function onSaveDirtySolutions() {
    if (dirtySolutionIds.length === 0) {
      setError('Нет несохранённых изменений')
      return
    }
    const sid = String(solutionsSprintId || '').trim()
    setSolutionsSaveBusy(true)
    setError(null)
    try {
      for (const id of dirtySolutionIds) {
        const d = solutionDrafts[id]
        if (!isValidMentorScore(d?.mentorScore)) {
          throw new Error(`Балл за спринт: целое число от 0 до ${MENTOR_SCORE_MAX}`)
        }
        const current = solutionsById.get(id)
        if (!current) continue
        const payload = { mentorScore: clampMentorScore(d.mentorScore) }
        if (String(d.codeUrl ?? '') !== String(current.codeUrl ?? '')) {
          payload.codeUrl = String(d.codeUrl ?? '').trim() || String(current.codeUrl ?? '')
        }
        if (String(d.demoUrl ?? '') !== String(current.demoUrl ?? '')) {
          payload.demoUrl = String(d.demoUrl ?? '').trim()
        }
        await patchAdminSolution(id, payload)
      }
      setNotice(
        dirtySolutionIds.length === 1
          ? 'Изменения сохранены'
          : `Сохранено изменений: ${dirtySolutionIds.length} решений`,
      )
      if (sid) await refreshSprintDetail(sid)
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSolutionsSaveBusy(false)
    }
  }

  async function refreshCurrentSolutionsIfOpen() {
    const sid = String(solutionsSprintId || '').trim()
    if (section === 'solutions' && sid) {
      await refreshSprintDetail(sid)
    }
  }

  return {
    solutionsSprintId,
    setSolutionsSprintId,
    detailLoading,
    sprintSolutions,
    solutionsSearchQuery,
    setSolutionsSearchQuery,
    solutionDrafts,
    setSolutionDrafts,
    solUserId,
    setSolUserId,
    solMentor,
    setSolMentor,
    solCodeUrl,
    setSolCodeUrl,
    solDemoUrl,
    setSolDemoUrl,
    solBusy,
    onAddSolution,
    onDeleteSolution,
    onSaveDirtySolutions,
    solutionsSaveBusy,
    dirtySolutionIds,
    solutionsStatusText,
    refreshCurrentSolutionsIfOpen,
  }
}
