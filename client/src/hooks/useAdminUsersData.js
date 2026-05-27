import { useEffect, useMemo, useState } from 'react'
import { deleteAdminUser, patchAdminUser, postAdminCreateUser } from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import { userMatchesSearch } from '../lib/adminUsers.js'
import { sortUsers } from '../lib/sortUsers.js'
import { ADMIN_USERS_PAGE_SIZE, useListPagination } from './useListPagination.js'

function buildUserPatchBody(draft) {
  const body = {
    role: draft.role,
    displayName: draft.displayName != null ? String(draft.displayName) : '',
  }
  const password = String(draft.password ?? '')
  if (password.trim().length > 0) body.password = password
  return body
}

function userDraftMatchesUser(user, draft) {
  if (!draft) return true
  const displayName = user.displayName != null ? String(user.displayName) : ''
  return (
    (draft.role ?? 'user') === (user.role ?? 'user') &&
    String(draft.displayName ?? '') === displayName &&
    String(draft.password ?? '') === ''
  )
}

export function useAdminUsersData({
  users,
  section,
  setError,
  setNotice,
  confirm,
  loadAll,
  loadAchievementsData,
}) {
  const [usersSelectedIds, setUsersSelectedIds] = useState(() => new Set())
  const [usersSearchQuery, setUsersSearchQuery] = useState('')
  const [usersSortKey, setUsersSortKey] = useState('points-desc')
  const [usersBulkBusy, setUsersBulkBusy] = useState(null)
  const [userDrafts, setUserDrafts] = useState({})
  const [newUserHandle, setNewUserHandle] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserDisplayName, setNewUserDisplayName] = useState('')
  const [createUserBusy, setCreateUserBusy] = useState(false)

  useEffect(() => {
    setUserDrafts((prev) =>
      Object.fromEntries(
        users.map((user) => {
          const fresh = {
            role: user.role ?? 'user',
            displayName: user.displayName != null ? String(user.displayName) : '',
            password: '',
          }
          const old = prev[user.id]
          if (old && !userDraftMatchesUser(user, old)) {
            return [user.id, old]
          }
          return [user.id, fresh]
        }),
      ),
    )
  }, [users])

  const filteredUsers = useMemo(
    () => users.filter((u) => userMatchesSearch(u, usersSearchQuery)),
    [users, usersSearchQuery],
  )

  const sortedFilteredUsers = useMemo(
    () => sortUsers(filteredUsers, usersSortKey),
    [filteredUsers, usersSortKey],
  )

  const usersPagination = useListPagination(
    sortedFilteredUsers,
    ADMIN_USERS_PAGE_SIZE,
    `${usersSearchQuery}\0${usersSortKey}`,
  )

  const dirtyUserIds = useMemo(
    () => users.filter((u) => !userDraftMatchesUser(u, userDrafts[u.id])).map((u) => u.id),
    [users, userDrafts],
  )

  function toggleUsersSelected(userId) {
    setUsersSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function selectAllFilteredUsers() {
    setUsersSelectedIds(new Set(sortedFilteredUsers.map((u) => u.id)))
  }

  function clearUsersSelection() {
    setUsersSelectedIds(new Set())
  }

  async function onSaveDirtyUsers() {
    const ids = dirtyUserIds
    if (ids.length === 0) {
      setError('Нет несохранённых изменений')
      return
    }
    setUsersBulkBusy('save')
    setError(null)
    try {
      for (const userId of ids) {
        const draft = userDrafts[userId]
        if (!draft) continue
        await patchAdminUser(userId, buildUserPatchBody(draft))
      }
      setNotice(
        ids.length === 1 ? 'Изменения сохранены' : `Сохранено изменений: ${ids.length} пользователей`,
      )
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setUsersBulkBusy(null)
    }
  }

  async function onDeleteSelectedUsers() {
    const ids = [...usersSelectedIds]
    if (ids.length === 0) {
      setError('Не выбраны пользователи для удаления')
      return
    }
    const labels = ids
      .map((id) => {
        const user = users.find((x) => x.id === id)
        return user ? `@${user.handle}` : id
      })
      .join(', ')
    const ok = await confirm({
      title: 'Удалить пользователей?',
      message: `Будет удалено: ${ids.length} (${labels}). Действие необратимо.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    setUsersBulkBusy('delete')
    setError(null)
    try {
      for (const userId of ids) {
        await deleteAdminUser(userId)
      }
      setNotice(
        ids.length === 1 ? 'Пользователь удалён' : `Удалено пользователей: ${ids.length}`,
      )
      setUsersSelectedIds(new Set())
      await loadAll({ silent: true })
      if (section === 'achievements') await loadAchievementsData()
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setUsersBulkBusy(null)
    }
  }

  async function onCreateUser(e) {
    e.preventDefault()
    const handle = newUserHandle.trim()
    const email = newUserEmail.trim()
    const password = newUserPassword
    if (handle.length < 2 || email.length < 3) {
      setError('Укажите handle (от 2 символов) и email')
      return
    }
    if (password.length < 6) {
      setError('Пароль — минимум 6 символов')
      return
    }
    setCreateUserBusy(true)
    setError(null)
    try {
      await postAdminCreateUser({
        handle,
        email,
        password,
        displayName: newUserDisplayName.trim() || undefined,
      })
      setNotice('Пользователь создан — можно войти по handle и email с указанным паролем')
      setNewUserHandle('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserDisplayName('')
      await loadAll({ silent: true })
      notifyLiveDataChanged({ source: 'admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setCreateUserBusy(false)
    }
  }

  return {
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
    onToggleUserSelected: toggleUsersSelected,
    onSelectAllFilteredUsers: selectAllFilteredUsers,
    onClearUsersSelection: clearUsersSelection,
  }
}
