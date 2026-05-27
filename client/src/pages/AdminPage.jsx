import { useCallback, useEffect, useState } from 'react'
import {
  deleteAdminSprintSubmission,
  getAdminSprints,
  getAdminUsers,
  postAdminReviewSubmission,
} from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import {
  formatSubmissionSprintLabel,
  submissionStatusClass,
  SUBMISSION_STATUS_OPTIONS,
} from '../lib/adminSubmissions.js'
import { useConfirm } from '../context/ConfirmProvider.jsx'
import { AdminSprintPreviewModal } from '../components/admin/AdminSprintPreviewModal.jsx'
import {
  clampMentorScore,
  isValidMentorScore,
  MENTOR_SCORE_MAX,
  MENTOR_SCORE_MIN,
} from '../lib/mentorScore.js'
import { useAdminRegistryData } from '../hooks/useAdminRegistryData.js'
import { useAdminAchievementsAccess } from '../hooks/useAdminAchievementsAccess.js'
import { useAdminSolutionsData } from '../hooks/useAdminSolutionsData.js'
import { useAdminUsersData } from '../hooks/useAdminUsersData.js'
import { useAdminSprintsData } from '../hooks/useAdminSprintsData.js'
import { AdminSubmissionReviewModal } from '../components/admin/AdminSubmissionReviewModal.jsx'
import { AdminToastStack } from '../components/admin/AdminToastStack.jsx'
import { AdminSprintsPanel } from '../components/admin/AdminSprintsPanel.jsx'
import { AdminUsersPanel } from '../components/admin/AdminUsersPanel.jsx'
import { AdminOpsPanels } from '../components/admin/AdminOpsPanels.jsx'
import {
  adminTabButtonClass,
  adminTabsNavClass,
} from '../components/admin/adminStyles.js'
import { AppFooter } from '../components/layout/AppFooter.jsx'
import { AppHeader } from '../components/layout/AppHeader.jsx'

const ADMIN_TABS = [
  { id: 'sprints', label: 'Спринты' },
  { id: 'users', label: 'Пользователи' },
  { id: 'access', label: 'Доступы' },
  { id: 'solutions', label: 'Решения' },
  { id: 'submissions', label: 'Отправки' },
  { id: 'achievements', label: 'Ачивки' },
  { id: 'logs', label: 'Логи' },
]

/** Активный спринт (isMainActive) — первым в списке админки. */
function sortSprintsMainActiveFirst(list) {
  if (!Array.isArray(list) || list.length < 2) return list ?? []
  const idx = list.findIndex((s) => s.isMainActive === true)
  if (idx <= 0) return list
  const rest = list.filter((_, i) => i !== idx)
  return [list[idx], ...rest]
}

export function AdminPage() {
  const confirm = useConfirm()
  const [sprints, setSprints] = useState([])
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)

  const [section, setSection] = useState('sprints')

  const [reviewScoreById, setReviewScoreById] = useState({})
  const [reviewNoteById, setReviewNoteById] = useState({})
  const [reviewBusyId, setReviewBusyId] = useState(null)
  const [reviewModalRow, setReviewModalRow] = useState(null)

  const {
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
    ADMIN_LOGS_PAGE,
    REGISTRY_SUBMISSIONS_PAGE,
  } = useAdminRegistryData({ section, setError })

  const {
    accessSearchQuery,
    setAccessSearchQuery,
    accessSelectedUserIds,
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
  } = useAdminAchievementsAccess({
    section,
    sprints,
    users,
    setError,
    setNotice,
    confirm,
  })

  const loadAll = useCallback(async (options = {}) => {
    const silent = options.silent === true
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const [spRes, uRes] = await Promise.all([getAdminSprints(), getAdminUsers()])
      const list = sortSprintsMainActiveFirst(Array.isArray(spRes) ? spRes : [])
      setSprints(list)
      setUsers(Array.isArray(uRes?.users) ? uRes.users : [])
      setSelectedId((prev) => {
        if (prev && list.some((s) => String(s.id) === String(prev))) return prev
        return list.length ? String(list[0].id) : ''
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const {
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
  } = useAdminSprintsData({
    sprints,
    selectedId,
    setSelectedId,
    loadAll,
    setError,
    setNotice,
    confirm,
  })

  const {
    newUserHandle,
    setNewUserHandle,
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserDisplayName,
    setNewUserDisplayName,
    createUserBusy,
    onCreateUser,
    usersSearchQuery,
    setUsersSearchQuery,
    usersSortKey,
    setUsersSortKey,
    dirtyUserIds,
    usersSelectedIds,
    usersPagination,
    usersBulkBusy,
    userDrafts,
    setUserDrafts,
    onSaveDirtyUsers,
    onDeleteSelectedUsers,
    onToggleUserSelected,
    onSelectAllFilteredUsers,
    onClearUsersSelection,
  } = useAdminUsersData({
    users,
    section,
    setError,
    setNotice,
    confirm,
    loadAll,
    loadAchievementsData,
  })

  const {
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
  } = useAdminSolutionsData({
    section,
    sprints,
    users,
    setError,
    setNotice,
    confirm,
    loadAll,
  })

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  async function onDeleteRegistrySubmission(row) {
    const sprintId = row?.sprintId
    const submissionId = row?.id
    const handle = row?.handle ?? ''
    const isDeleted =
      row?.status === 'deleted_by_admin' || row?.status === 'deleted_by_user'
    const title = isDeleted ? 'Удалить из истории навсегда?' : 'Удалить отправку?'
    const message = isDeleted
      ? `Отправка @${handle} будет полностью удалена из истории без возможности восстановления.`
      : `Отправка @${handle} будет удалена вместе со ссылками на репозиторий и демо.`
    const ok = await confirm({
      title,
      message,
      confirmLabel: isDeleted ? 'Удалить навсегда' : 'Удалить',
      danger: true,
    })
    if (!ok) return
    setError(null)
    try {
      await deleteAdminSprintSubmission(sprintId, submissionId)
      setNotice(isDeleted ? 'Запись удалена из истории' : 'Отправка удалена')
      if (reviewModalRow?.id === submissionId) setReviewModalRow(null)
      setReviewScoreById((prev) => {
        const next = { ...prev }
        delete next[submissionId]
        return next
      })
      setReviewNoteById((prev) => {
        const next = { ...prev }
        delete next[submissionId]
        return next
      })
      await loadSubmissions()
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  function openSubmissionReviewModal(row) {
    if (!row?.id || !row?.canReview) return
    setReviewScoreById((prev) => ({
      ...prev,
      [row.id]:
        row.mentorScore != null && Number.isFinite(Number(row.mentorScore))
          ? String(row.mentorScore)
          : '',
    }))
    setReviewNoteById((prev) => ({
      ...prev,
      [row.id]: String(row.reviewNote ?? ''),
    }))
    setReviewModalRow(row)
  }

  async function onReviewSubmission(submissionId) {
    const rawScore = reviewScoreById[submissionId]
    const reviewNote = String(reviewNoteById[submissionId] ?? '').trim()
    if (!isValidMentorScore(rawScore)) {
      setError(`Укажите балл наставника (${MENTOR_SCORE_MIN}–${MENTOR_SCORE_MAX})`)
      return
    }
    const score = clampMentorScore(rawScore)
    setReviewBusyId(submissionId)
    setError(null)
    try {
      await postAdminReviewSubmission(submissionId, {
        action: 'approve',
        mentorScore: score,
        reviewNote: reviewNote || undefined,
      })
      setReviewScoreById((prev) => {
        const next = { ...prev }
        delete next[submissionId]
        return next
      })
      setReviewNoteById((prev) => {
        const next = { ...prev }
        delete next[submissionId]
        return next
      })
      setNotice('Отправка принята')
      if (section === 'submissions') await loadSubmissions()
      await refreshCurrentSolutionsIfOpen()
      await loadAll({ silent: true })
      if (reviewModalRow?.id === submissionId) setReviewModalRow(null)
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setReviewBusyId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-aztec">
      <AppHeader />
      <AdminToastStack
        notice={notice}
        error={error}
        onDismissNotice={() => setNotice(null)}
        onDismissError={() => setError(null)}
      />
      <main className="flex-1 px-0 pt-[116px] md:pt-[73px]">
        <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 sm:py-10 max-[360px]:px-3 max-[360px]:py-6 md:px-10">
          <header className="mb-8 flex flex-col gap-2 border-b border-plantation pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Админка</h1>
          </header>

          {loading ? (
            <p className="font-mono text-sm text-gull">Загрузка…</p>
          ) : (
            <>
              <nav className={adminTabsNavClass} aria-label="Разделы админки">
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSection(tab.id)}
                    className={adminTabButtonClass(section === tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {section === 'users' ? (
                <AdminUsersPanel
                  newUserHandle={newUserHandle}
                  setNewUserHandle={setNewUserHandle}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  newUserDisplayName={newUserDisplayName}
                  setNewUserDisplayName={setNewUserDisplayName}
                  createUserBusy={createUserBusy}
                  showNewUserPassword={showNewUserPassword}
                  setShowNewUserPassword={setShowNewUserPassword}
                  onCreateUser={onCreateUser}
                  usersSearchQuery={usersSearchQuery}
                  setUsersSearchQuery={setUsersSearchQuery}
                  usersSortKey={usersSortKey}
                  setUsersSortKey={setUsersSortKey}
                  dirtyUserIds={dirtyUserIds}
                  usersSelectedIds={usersSelectedIds}
                  usersPagination={usersPagination}
                  onSelectAllFilteredUsers={onSelectAllFilteredUsers}
                  onClearUsersSelection={onClearUsersSelection}
                  usersBulkBusy={usersBulkBusy}
                  onSaveDirtyUsers={() => void onSaveDirtyUsers()}
                  onDeleteSelectedUsers={() => void onDeleteSelectedUsers()}
                  userDrafts={userDrafts}
                  setUserDrafts={setUserDrafts}
                  onToggleUserSelected={onToggleUserSelected}
                />
              ) : section === 'access' || section === 'achievements' || section === 'submissions' || section === 'solutions' || section === 'logs' ? (
                <AdminOpsPanels
                  section={section}
                  achievements={{
                    definitions: achievementDefinitions,
                    issued: issuedAchievements,
                    definitionsLoading,
                    onCreateDefinition: onCreateAchievementDefinition,
                    createBusy: createDefinitionBusy,
                    newTitle: newAchTitle,
                    setNewTitle: setNewAchTitle,
                    newSubtitle: newAchSubtitle,
                    setNewSubtitle: setNewAchSubtitle,
                    newIcon: newAchIcon,
                    setNewIcon: setNewAchIcon,
                    newVariant: newAchVariant,
                    setNewVariant: setNewAchVariant,
                    updateDefinitionBusyId,
                    onUpdateDefinition: onUpdateAchievementDefinition,
                    onDeleteDefinition: (id, title) => void onDeleteAchievementDefinition(id, title),
                    users,
                    grantDefinitionId,
                    setGrantDefinitionId,
                    grantUserSearch,
                    setGrantUserSearch,
                    grantSelectedUserIds,
                    onToggleGrantUser: toggleGrantUserSelected,
                    onSelectAllGrantUsers: (ids) => setGrantSelectedUserIds(new Set(ids)),
                    onClearGrantUsers: () => setGrantSelectedUserIds(new Set()),
                    onGrant: onGrantAchievementToUsers,
                    grantBusy,
                    onRevokeAchievement: (row) => void onRevokeAchievement(row),
                    revokeAchievementBusyId,
                  }}
                  access={{
                    sprints,
                    accessSprintId,
                    onAccessSprintChange: setAccessSprintId,
                    users,
                    participants,
                    participantsLoading,
                    selectedUserIds: accessSelectedUserIds,
                    onToggleUserSelected: toggleAccessUserSelected,
                    onSelectAll: selectAllAccessUsers,
                    onResetSelection: resetAccessSelection,
                    onSave: () => void onSaveAccessEnrollment(),
                    saveBusy: bulkAccessBusy,
                    searchQuery: accessSearchQuery,
                    onSearchQueryChange: setAccessSearchQuery,
                  }}
                  solutions={{
                    sprints,
                    users,
                    sprintId: solutionsSprintId,
                    onSprintChange: setSolutionsSprintId,
                    detailLoading,
                    rows: sprintSolutions,
                    searchQuery: solutionsSearchQuery,
                    onSearchQueryChange: setSolutionsSearchQuery,
                    drafts: solutionDrafts,
                    setDrafts: setSolutionDrafts,
                    solUserId,
                    onSolUserIdChange: setSolUserId,
                    solMentor,
                    onSolMentorChange: setSolMentor,
                    solCodeUrl,
                    onSolCodeUrlChange: setSolCodeUrl,
                    solDemoUrl,
                    onSolDemoUrlChange: setSolDemoUrl,
                    solBusy,
                    onAddSolution,
                    onDeleteSolution: (id) => void onDeleteSolution(id),
                    onSaveDirty: () => void onSaveDirtySolutions(),
                    saveBusy: solutionsSaveBusy,
                    dirtyCount: dirtySolutionIds.length,
                    statusText: solutionsStatusText,
                  }}
                  submissions={{
                    sprints,
                    sprintFilter: submissionsSprintFilter,
                    onSprintFilterChange: setSubmissionsSprintFilter,
                    searchQuery: submissionsSearchQuery,
                    onSearchQueryChange: setSubmissionsSearchQuery,
                    statusFilter: submissionsStatusFilter,
                    onStatusFilterChange: setSubmissionsStatusFilter,
                    statusOptions: SUBMISSION_STATUS_OPTIONS,
                    rows: registrySubmissions,
                    loading: registryLoading,
                    statusClassFn: submissionStatusClass,
                    reviewBusyId,
                    onReview: openSubmissionReviewModal,
                    onDelete: (row) => void onDeleteRegistrySubmission(row),
                    dateSortDir: submissionsDateSortDir,
                    onToggleDateSort: () =>
                      setSubmissionsDateSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc')),
                    pagination: {
                      visible: !submissionsSprintFilter,
                      page: Math.floor(registrySubOffset / REGISTRY_SUBMISSIONS_PAGE) + 1,
                      pageCount: Math.max(1, Math.ceil(registrySubmissionsTotal / REGISTRY_SUBMISSIONS_PAGE)),
                      total: registrySubmissionsTotal,
                      pageSize: REGISTRY_SUBMISSIONS_PAGE,
                      disabled: registryLoading,
                      onPrev: () => setRegistrySubOffset((o) => Math.max(0, o - REGISTRY_SUBMISSIONS_PAGE)),
                      onNext: () => setRegistrySubOffset((o) => o + REGISTRY_SUBMISSIONS_PAGE),
                    },
                  }}
                  logs={{
                    query: adminLogsQuery,
                    onQueryChange: setAdminLogsQuery,
                    rows: adminLogs,
                    loading: adminLogsLoading,
                    pagination: {
                      page: Math.floor(adminLogsOffset / ADMIN_LOGS_PAGE) + 1,
                      pageCount: Math.max(1, Math.ceil(adminLogsTotal / ADMIN_LOGS_PAGE)),
                      total: adminLogsTotal,
                      pageSize: ADMIN_LOGS_PAGE,
                      disabled: adminLogsLoading,
                      onPrev: () => setAdminLogsOffset((o) => Math.max(0, o - ADMIN_LOGS_PAGE)),
                      onNext: () => setAdminLogsOffset((o) => o + ADMIN_LOGS_PAGE),
                    },
                  }}
                />
              ) : section === 'sprints' ? (
                <AdminSprintsPanel
                  sprints={sprints}
                  filteredSprints={filteredSprints}
                  searchQuery={sprintsSearchQuery}
                  onSearchChange={setSprintsSearchQuery}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  suggestedSprintId={suggestedSprintId}
                  createTabLabel={cTabLabel}
                  onCreateTabLabelChange={(e) => setCTabLabel(e.target.value)}
                  createEndsAtLocal={cEndsAtLocal}
                  onCreateEndsAtLocalChange={(e) => setCEndsAtLocal(e.target.value)}
                  createPublished={cPublished}
                  onCreatePublishedChange={(e) => setCPublished(e.target.checked)}
                  creating={creating}
                  onCreateSprint={onCreateSprint}
                  selected={selected}
                  tabLabel={tabLabel}
                  onTabLabelChange={(e) => setTabLabel(e.target.value)}
                  taskQuote={taskQuote}
                  onTaskQuoteChange={setTaskQuote}
                  taskBody={taskBody}
                  onTaskBodyChange={setTaskBody}
                  taskAcceptance={taskAcceptance}
                  onTaskAcceptanceChange={setTaskAcceptance}
                  taskLinks={taskLinks}
                  onTaskLinksChange={setTaskLinks}
                  endsAtLocal={endsAtLocal}
                  onEndsAtLocalChange={(e) => setEndsAtLocal(e.target.value)}
                  prizeMoney={prizeMoney}
                  onPrizeMoneyChange={(e) => setPrizeMoney(e.target.value)}
                  tagsText={tagsText}
                  onTagsTextChange={(e) => setTagsText(e.target.value)}
                  published={published}
                  onPublishedChange={(e) => setPublished(e.target.checked)}
                  isMainActive={isMainActive}
                  onMainActiveChange={(e) => {
                    const next = e.target.checked
                    setIsMainActive(next)
                    if (next) setPublished(true)
                  }}
                  saving={saving}
                  onSave={onSave}
                  onDeleteSprint={() => void onDeleteSprint()}
                  onOpenPreview={() => setSprintPreviewOpen(true)}
                />
        ) : null}
            </>
          )}
        </div>
      </main>
      <AdminSprintPreviewModal
        open={sprintPreviewOpen}
        sprint={previewSprint}
        onClose={() => setSprintPreviewOpen(false)}
      />
      <AdminSubmissionReviewModal
        open={!!reviewModalRow}
        submission={
          reviewModalRow
            ? {
                handle: reviewModalRow.handle ?? 'user',
                sprintLabel: formatSubmissionSprintLabel(reviewModalRow),
                repoUrl: reviewModalRow.repoUrl ?? '',
                demoUrl: reviewModalRow.demoUrl ?? '',
                canApprove: isValidMentorScore(reviewScoreById[reviewModalRow.id] ?? ''),
              }
            : null
        }
        scoreValue={reviewModalRow ? reviewScoreById[reviewModalRow.id] ?? '' : ''}
        onScoreChange={(e) => {
          if (!reviewModalRow) return
          setReviewScoreById((prev) => ({
            ...prev,
            [reviewModalRow.id]: e.target.value,
          }))
        }}
        noteValue={reviewModalRow ? reviewNoteById[reviewModalRow.id] ?? '' : ''}
        onNoteChange={(e) => {
          if (!reviewModalRow) return
          setReviewNoteById((prev) => ({
            ...prev,
            [reviewModalRow.id]: e.target.value,
          }))
        }}
        busy={reviewModalRow ? reviewBusyId === reviewModalRow.id : false}
        onApprove={() =>
          reviewModalRow ? void onReviewSubmission(reviewModalRow.id) : undefined
        }
        onDelete={() => {
          if (!reviewModalRow) return undefined
          return void onDeleteRegistrySubmission(reviewModalRow)
        }}
        onClose={() => {
          if (reviewModalRow && reviewBusyId === reviewModalRow.id) return
          setReviewModalRow(null)
        }}
      />
      <AppFooter />
    </div>
  )
}
