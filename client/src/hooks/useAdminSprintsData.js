import { useEffect, useMemo, useState } from 'react'
import { deleteAdminSprint, patchAdminSprint, postAdminCreateSprint } from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import { formatSprintTitle, nextSprintId, sprintTitleEditablePart } from '../lib/sprintIds.js'
import {
  buildSprintBriefForSave,
  EMPTY_TASK_FIELDS,
  taskFieldsFromBrief,
} from '../lib/sprintTaskBrief.js'
import { validateSprintForm } from '../lib/adminSprintValidation.js'

function toDatetimeLocal(iso) {
  if (!iso || typeof iso !== 'string') return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value) {
  const v = String(value ?? '').trim()
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function prettyJsonFromDb(raw, fallback) {
  if (raw == null || raw === '') return fallback
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return JSON.stringify(parsed, null, 2)
  } catch {
    return fallback
  }
}

function sortSprintsMainActiveFirst(list) {
  if (!Array.isArray(list) || list.length < 2) return list ?? []
  const idx = list.findIndex((s) => s.isMainActive === true)
  if (idx <= 0) return list
  const rest = list.filter((_, i) => i !== idx)
  return [list[idx], ...rest]
}

export function useAdminSprintsData({
  sprints,
  selectedId,
  setSelectedId,
  loadAll,
  setError,
  setNotice,
  confirm,
}) {
  const [tabLabel, setTabLabel] = useState('')
  const [published, setPublished] = useState(true)
  const [isMainActive, setIsMainActive] = useState(false)
  const [endsAtLocal, setEndsAtLocal] = useState('')
  const [prizeMoney, setPrizeMoney] = useState('0')
  const [sprintsSearchQuery, setSprintsSearchQuery] = useState('')
  const [tagsText, setTagsText] = useState('[]')
  const [taskQuote, setTaskQuote] = useState('')
  const [taskBody, setTaskBody] = useState('')
  const [taskAcceptance, setTaskAcceptance] = useState('')
  const [taskLinks, setTaskLinks] = useState('')
  const [cTabLabel, setCTabLabel] = useState('')
  const [cEndsAtLocal, setCEndsAtLocal] = useState('')
  const [cPublished, setCPublished] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sprintPreviewOpen, setSprintPreviewOpen] = useState(false)

  const selected = useMemo(
    () => sprints.find((s) => String(s.id) === String(selectedId)) ?? null,
    [sprints, selectedId],
  )

  useEffect(() => {
    if (!selected) {
      setTabLabel('')
      setPublished(true)
      setIsMainActive(false)
      setEndsAtLocal('')
      setPrizeMoney('0')
      setTagsText('[]')
      setTaskQuote('')
      setTaskBody('')
      setTaskAcceptance('')
      setTaskLinks('')
      return
    }
    const storedLabel = selected.tabLabel ?? selected.title ?? ''
    setTabLabel(sprintTitleEditablePart(storedLabel, selected.id))
    setPublished(selected.published !== false || selected.isMainActive === true)
    setIsMainActive(selected.isMainActive === true)
    setEndsAtLocal(toDatetimeLocal(selected.endsAt))
    setPrizeMoney(String(Math.max(0, Number(selected.prizeMoney ?? 0) || 0)))
    setTagsText(prettyJsonFromDb(selected.tagsJson, '[]'))
    let briefObj = {}
    try {
      briefObj = JSON.parse(selected.briefJson || '{}')
    } catch {
      briefObj = {}
    }
    const taskFields = taskFieldsFromBrief(briefObj)
    setTaskQuote(taskFields.taskQuote)
    setTaskBody(taskFields.taskBody)
    setTaskAcceptance(taskFields.acceptanceLines)
    setTaskLinks(taskFields.usefulLinksText)
  }, [selected])

  const previewSprint = useMemo(() => {
    if (!selected) return null
    const fullLabel = formatSprintTitle(selected.id, tabLabel)
    let briefObj = {}
    try {
      briefObj = JSON.parse(selected.briefJson || '{}')
    } catch {
      briefObj = {}
    }
    const brief = buildSprintBriefForSave({
      sprintId: selected.id,
      sprintTitle: fullLabel,
      existingBrief: briefObj,
      taskFields: {
        taskQuote,
        taskBody,
        acceptanceLines: taskAcceptance,
        usefulLinksText: taskLinks,
      },
    })
    return { id: selected.id, title: fullLabel, tabLabel: fullLabel, brief }
  }, [selected, tabLabel, taskQuote, taskBody, taskAcceptance, taskLinks])

  const suggestedSprintId = useMemo(() => nextSprintId(sprints), [sprints])

  const filteredSprints = useMemo(() => {
    const q = sprintsSearchQuery.trim().toLowerCase()
    const base = !q
      ? sprints
      : sprints.filter((sp) => {
          const id = String(sp.id ?? '').toLowerCase()
          const t = String(sp.title ?? '').toLowerCase()
          const tab = String(sp.tabLabel ?? '').toLowerCase()
          return id.includes(q) || t.includes(q) || tab.includes(q)
        })
    return sortSprintsMainActiveFirst(base)
  }, [sprints, sprintsSearchQuery])

  async function onSave(e) {
    e.preventDefault()
    if (!selected) return
    const formErrors = validateSprintForm({ endsAtLocal, tagsText, prizeMoney })
    if (formErrors.length > 0) {
      setError(formErrors.join(' · '))
      return
    }
    setSaving(true)
    setNotice(null)
    setError(null)
    try {
      let tagsVal
      try {
        tagsVal = JSON.parse(tagsText)
        if (!Array.isArray(tagsVal)) throw new Error('нужен массив')
      } catch {
        throw new Error('tags: невалидный JSON (нужен массив)')
      }
      let briefObj = {}
      try {
        briefObj = JSON.parse(selected.briefJson || '{}')
      } catch {
        briefObj = {}
      }
      const fullLabel = formatSprintTitle(selected.id, tabLabel)
      const briefVal = buildSprintBriefForSave({
        sprintId: selected.id,
        sprintTitle: fullLabel,
        existingBrief: briefObj,
        taskFields: {
          taskQuote,
          taskBody,
          acceptanceLines: taskAcceptance,
          usefulLinksText: taskLinks,
        },
      })
      const endsAt = fromDatetimeLocal(endsAtLocal)
      if (!endsAt) throw new Error('Некорректная дата дедлайна')

      await patchAdminSprint(selected.id, {
        tabLabel: fullLabel,
        title: fullLabel,
        published: isMainActive ? true : published,
        isMainActive,
        endsAt,
        prizeMoney: Math.max(0, Number(prizeMoney) || 0),
        tags: tagsVal,
        brief: briefVal,
        replaceBrief: true,
      })
      setNotice('Спринт сохранён')
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function onCreateSprint(e) {
    e.preventDefault()
    const id = suggestedSprintId
    const formErrors = validateSprintForm({
      endsAtLocal: cEndsAtLocal,
      tagsText: '[]',
      prizeMoney: '0',
    })
    if (formErrors.length > 0) {
      setError(formErrors.join(' · '))
      return
    }
    const createEndsAt = fromDatetimeLocal(cEndsAtLocal)
    if (!createEndsAt) {
      setError('Некорректная дата дедлайна')
      return
    }
    setCreating(true)
    setNotice(null)
    setError(null)
    try {
      const fullLabel = formatSprintTitle(id, cTabLabel)
      const briefVal = buildSprintBriefForSave({
        sprintId: id,
        sprintTitle: fullLabel,
        existingBrief: {},
        taskFields: EMPTY_TASK_FIELDS,
      })
      await postAdminCreateSprint({
        id,
        tabLabel: fullLabel,
        title: fullLabel,
        published: cPublished,
        endsAt: createEndsAt,
        prizeMoney: 0,
        tags: [],
        brief: briefVal,
      })
      setNotice(`Спринт ${id} создан`)
      setCTabLabel('')
      setCEndsAtLocal('')
      setCPublished(false)
      await loadAll({ silent: true })
      setSelectedId(id)
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCreating(false)
    }
  }

  async function onDeleteSprint() {
    if (!selected) return
    const ok = await confirm({
      title: 'Удалить спринт?',
      message: `Спринт «${selected.tabLabel ?? selected.title}» (${selected.id}) будет удалён вместе с отправками, решениями и зачислениями. Это действие необратимо.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    setError(null)
    setNotice(null)
    try {
      await deleteAdminSprint(selected.id)
      setNotice('Спринт удалён')
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return {
    selected,
    tabLabel,
    setTabLabel,
    published,
    setPublished,
    isMainActive,
    setIsMainActive,
    endsAtLocal,
    setEndsAtLocal,
    prizeMoney,
    setPrizeMoney,
    sprintsSearchQuery,
    setSprintsSearchQuery,
    tagsText,
    setTagsText,
    taskQuote,
    setTaskQuote,
    taskBody,
    setTaskBody,
    taskAcceptance,
    setTaskAcceptance,
    taskLinks,
    setTaskLinks,
    cTabLabel,
    setCTabLabel,
    cEndsAtLocal,
    setCEndsAtLocal,
    cPublished,
    setCPublished,
    creating,
    saving,
    onSave,
    onCreateSprint,
    onDeleteSprint,
    sprintPreviewOpen,
    setSprintPreviewOpen,
    previewSprint,
    suggestedSprintId,
    filteredSprints,
  }
}
