/** Группы для боковой панели спринтов в админке. */
export function groupSprintsForAdminSidebar(sprints) {
  const main = []
  const published = []
  const drafts = []
  for (const s of sprints) {
    if (s.isMainActive) main.push(s)
    else if (s.published === false) drafts.push(s)
    else published.push(s)
  }
  return [
    { id: 'main', label: 'На главной', items: main },
    { id: 'published', label: 'Опубликованные', items: published },
    { id: 'drafts', label: 'Черновики', items: drafts },
  ].filter((g) => g.items.length > 0)
}
