import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteAdminAchievement,
  deleteAdminAchievementDefinition,
  deleteAdminSprintParticipant,
  getAdminAchievements,
  getAdminAchievementDefinitions,
  getAdminSprintParticipants,
  patchAdminAchievementDefinition,
  postAdminAchievementDefinition,
  postAdminGrantAchievement,
  postAdminSprintParticipants,
} from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import { enrolledUserIdsFromParticipants } from '../lib/adminAccess.js'

export function useAdminAchievementsAccess({
  section,
  sprints,
  users,
  setError,
  setNotice,
  confirm,
}) {
  const [accessSearchQuery, setAccessSearchQuery] = useState('')
  const [accessSelectedUserIds, setAccessSelectedUserIds] = useState(() => new Set())
  const [accessSprintId, setAccessSprintId] = useState('')
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participants, setParticipants] = useState([])
  const [bulkAccessBusy, setBulkAccessBusy] = useState(false)

  const [achievementDefinitions, setAchievementDefinitions] = useState([])
  const [issuedAchievements, setIssuedAchievements] = useState([])
  const [definitionsLoading, setDefinitionsLoading] = useState(false)
  const [createDefinitionBusy, setCreateDefinitionBusy] = useState(false)
  const [updateDefinitionBusyId, setUpdateDefinitionBusyId] = useState(null)
  const [revokeAchievementBusyId, setRevokeAchievementBusyId] = useState(null)
  const [newAchTitle, setNewAchTitle] = useState('')
  const [newAchSubtitle, setNewAchSubtitle] = useState('')
  const [newAchIcon, setNewAchIcon] = useState('military_tech')
  const [newAchVariant, setNewAchVariant] = useState('earned')
  const [grantDefinitionId, setGrantDefinitionId] = useState('')
  const [grantUserSearch, setGrantUserSearch] = useState('')
  const [grantSelectedUserIds, setGrantSelectedUserIds] = useState(() => new Set())
  const [grantBusy, setGrantBusy] = useState(false)

  const accessRequestSeqRef = useRef(0)

  const reloadAccessParticipants = useCallback(async (sprintId) => {
    const sid = String(sprintId ?? '').trim()
    const requestId = ++accessRequestSeqRef.current
    if (!sid) {
      setParticipants([])
      return
    }
    setParticipantsLoading(true)
    try {
      const res = await getAdminSprintParticipants(sid)
      if (requestId !== accessRequestSeqRef.current) return
      if (sid !== String(accessSprintId ?? '').trim()) return
      const list = Array.isArray(res?.enrollments) ? res.enrollments : []
      setParticipants(list)
      setAccessSelectedUserIds(enrolledUserIdsFromParticipants(list))
    } catch {
      if (requestId !== accessRequestSeqRef.current) return
      if (sid !== String(accessSprintId ?? '').trim()) return
      setParticipants([])
      setAccessSelectedUserIds(new Set())
    } finally {
      if (requestId === accessRequestSeqRef.current) {
        setParticipantsLoading(false)
      }
    }
  }, [accessSprintId])

  const loadAchievementDefinitions = useCallback(async () => {
    setDefinitionsLoading(true)
    try {
      const res = await getAdminAchievementDefinitions()
      const list = Array.isArray(res?.definitions) ? res.definitions : []
      setAchievementDefinitions(list)
      setGrantDefinitionId((prev) => {
        if (prev && list.some((d) => d.id === prev)) return prev
        return list[0]?.id ?? ''
      })
    } catch (e) {
      setAchievementDefinitions([])
      setError(e instanceof Error ? e.message : 'Ошибка загрузки каталога ачивок')
    } finally {
      setDefinitionsLoading(false)
    }
  }, [setError])

  const loadIssuedAchievements = useCallback(async () => {
    try {
      const res = await getAdminAchievements()
      setIssuedAchievements(Array.isArray(res?.achievements) ? res.achievements : [])
    } catch (e) {
      setIssuedAchievements([])
      setError(e instanceof Error ? e.message : 'Ошибка загрузки выданных ачивок')
    }
  }, [setError])

  const loadAchievementsData = useCallback(async () => {
    setError(null)
    await Promise.all([loadAchievementDefinitions(), loadIssuedAchievements()])
  }, [loadAchievementDefinitions, loadIssuedAchievements, setError])

  useEffect(() => {
    if (section === 'achievements') void loadAchievementsData()
  }, [section, loadAchievementsData])

  useEffect(() => {
    if (sprints.length && !accessSprintId) {
      setAccessSprintId(String(sprints[0].id))
    }
  }, [sprints, accessSprintId])

  useEffect(() => {
    if (section === 'access' && accessSprintId) {
      void reloadAccessParticipants(accessSprintId)
    }
  }, [section, accessSprintId, reloadAccessParticipants])

  useEffect(() => {
    setAccessSearchQuery('')
  }, [accessSprintId])

  function resetAccessSelection() {
    setAccessSelectedUserIds(enrolledUserIdsFromParticipants(participants))
  }

  function selectAllAccessUsers() {
    setAccessSelectedUserIds(new Set(users.map((u) => u.id)))
  }

  function toggleAccessUserSelected(userId) {
    setAccessSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function onSaveAccessEnrollment() {
    const sprintId = String(accessSprintId || '').trim()
    if (!sprintId) {
      setError('Выберите спринт')
      return
    }
    const enrolled = enrolledUserIdsFromParticipants(participants)
    const draft = accessSelectedUserIds
    const toAdd = [...draft].filter((id) => !enrolled.has(id))
    const toRemove = [...enrolled].filter((id) => !draft.has(id))
    if (toAdd.length === 0 && toRemove.length === 0) {
      setError('Нет изменений для сохранения')
      return
    }
    setBulkAccessBusy(true)
    setError(null)
    try {
      if (toAdd.length > 0) {
        await postAdminSprintParticipants(sprintId, toAdd)
      }
      for (const userId of toRemove) {
        await deleteAdminSprintParticipant(sprintId, userId)
      }
      const parts = []
      if (toAdd.length) parts.push(`зачислено ${toAdd.length}`)
      if (toRemove.length) parts.push(`исключено ${toRemove.length}`)
      setNotice(`Спринт ${sprintId}: ${parts.join(', ')}`)
      await reloadAccessParticipants(sprintId)
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setBulkAccessBusy(false)
    }
  }

  async function onCreateAchievementDefinition(e) {
    e.preventDefault()
    const achTitle = newAchTitle.trim()
    const subtitle = newAchSubtitle.trim()
    const icon = newAchIcon.trim() || 'military_tech'
    if (achTitle.length < 2 || subtitle.length < 2) {
      setError('Название и подпись — минимум 2 символа')
      return
    }
    setCreateDefinitionBusy(true)
    setError(null)
    try {
      await postAdminAchievementDefinition({
        title: achTitle,
        subtitle,
        icon,
        variant: newAchVariant || 'earned',
      })
      setNotice('Ачивка добавлена в каталог')
      setNewAchTitle('')
      setNewAchSubtitle('')
      await loadAchievementDefinitions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCreateDefinitionBusy(false)
    }
  }

  function toggleGrantUserSelected(userId) {
    setGrantSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  async function onGrantAchievementToUsers() {
    const definitionId = String(grantDefinitionId || '').trim()
    const userIds = [...grantSelectedUserIds]
    if (!definitionId) {
      setError('Выберите ачивку из каталога')
      return
    }
    if (userIds.length === 0) {
      setError('Выберите пользователей для выдачи ачивки')
      return
    }
    setGrantBusy(true)
    setError(null)
    try {
      const res = await postAdminGrantAchievement({ definitionId, userIds })
      const granted = Number(res?.granted ?? 0)
      const skipped = Number(res?.skipped ?? 0)
      if (granted === 0 && skipped > 0) {
        setNotice('У всех выбранных эта ачивка уже есть')
      } else {
        setNotice(
          skipped > 0
            ? `Выдано: ${granted}, пропущено (уже есть): ${skipped}`
            : `Ачивка выдана пользователям: ${granted}`,
        )
        setGrantSelectedUserIds(new Set())
      }
      for (const uid of userIds) {
        notifyLiveDataChanged({ source: 'admin', userId: uid })
      }
      await loadIssuedAchievements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setGrantBusy(false)
    }
  }

  async function onDeleteAchievementDefinition(definitionId, title) {
    const ok = await confirm({
      title: 'Удалить из каталога?',
      message: `Определение «${title}» будет удалено из каталога ачивок.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    setError(null)
    try {
      await deleteAdminAchievementDefinition(definitionId)
      setNotice('Определение ачивки удалено из каталога')
      await loadAchievementsData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  async function onUpdateAchievementDefinition(definitionId, payload) {
    const title = String(payload?.title ?? '').trim()
    const subtitle = String(payload?.subtitle ?? '').trim()
    if (title.length < 2 || subtitle.length < 2) {
      setError('Название и подпись — минимум 2 символа')
      return false
    }
    setUpdateDefinitionBusyId(definitionId)
    setError(null)
    try {
      await patchAdminAchievementDefinition(definitionId, {
        title,
        subtitle,
        icon: String(payload?.icon ?? '').trim() || 'military_tech',
        variant: String(payload?.variant ?? 'earned') || 'earned',
      })
      setNotice('Ачивка обновлена')
      await loadAchievementsData()
      notifyLiveDataChanged({ source: 'admin' })
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
      return false
    } finally {
      setUpdateDefinitionBusyId(null)
    }
  }

  async function onRevokeAchievement(achievementRow) {
    const row = achievementRow ?? {}
    const achId = String(row.id ?? '').trim()
    if (!achId) return
    setRevokeAchievementBusyId(achId)
    setError(null)
    try {
      await deleteAdminAchievement(achId)
      setNotice(`Ачивка снята у @${row.handle ?? 'user'}`)
      await loadIssuedAchievements()
      notifyLiveDataChanged({ source: 'admin', userId: row.userId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setRevokeAchievementBusyId(null)
    }
  }

  return {
    accessSearchQuery,
    setAccessSearchQuery,
    accessSelectedUserIds,
    setAccessSelectedUserIds,
    accessSprintId,
    setAccessSprintId,
    participantsLoading,
    participants,
    bulkAccessBusy,
    achievementDefinitions,
    issuedAchievements,
    definitionsLoading,
    createDefinitionBusy,
    updateDefinitionBusyId,
    revokeAchievementBusyId,
    newAchTitle,
    setNewAchTitle,
    newAchSubtitle,
    setNewAchSubtitle,
    newAchIcon,
    setNewAchIcon,
    newAchVariant,
    setNewAchVariant,
    grantDefinitionId,
    setGrantDefinitionId,
    grantUserSearch,
    setGrantUserSearch,
    grantSelectedUserIds,
    setGrantSelectedUserIds,
    grantBusy,
    loadAchievementsData,
    onCreateAchievementDefinition,
    toggleGrantUserSelected,
    onGrantAchievementToUsers,
    onDeleteAchievementDefinition,
    onUpdateAchievementDefinition,
    onRevokeAchievement,
    toggleAccessUserSelected,
    selectAllAccessUsers,
    resetAccessSelection,
    onSaveAccessEnrollment,
  }
}
