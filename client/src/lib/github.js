/** «Голый» GitHub-username из любого ввода (username, @username, ссылка). */
export function githubUsername(value) {
  let v = String(value ?? '').trim()
  if (!v) return ''
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  v = v.replace(/^github\.com\//i, '')
  v = v.replace(/^[@/]+/, '')
  v = v.split(/[/?#]/)[0]
  return v.trim()
}

/** Полная ссылка на профиль GitHub или '' если username пустой. */
export function githubProfileUrl(value) {
  const u = githubUsername(value)
  return u ? `https://github.com/${u}` : ''
}
