import { useEffect, useMemo, useState } from 'react'

export const ADMIN_USERS_PAGE_SIZE = 10

/**
 * Клиентская пагинация списка (поиск снаружи, сюда передаётся уже отфильтрованный массив).
 * @param {unknown[]} items
 * @param {number} pageSize
 * @param {string|number} resetKey — при смене поиска/фильтра сбрасывает страницу на 1
 */
export function useListPagination(items, pageSize = ADMIN_USERS_PAGE_SIZE, resetKey = '') {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  const { pageItems, pageCount, total, safePage } = useMemo(() => {
    const list = Array.isArray(items) ? items : []
    const totalCount = list.length
    const pages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
    const current = Math.min(Math.max(1, page), pages)
    const offset = (current - 1) * pageSize
    return {
      pageItems: list.slice(offset, offset + pageSize),
      pageCount: pages,
      total: totalCount,
      safePage: current,
    }
  }, [items, page, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  return {
    pageItems,
    page: safePage,
    pageCount,
    total,
    setPage,
    onPrev: () => setPage((p) => Math.max(1, p - 1)),
    onNext: () => setPage((p) => Math.min(pageCount, p + 1)),
  }
}
