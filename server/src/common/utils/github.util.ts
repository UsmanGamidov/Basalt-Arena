/**
 * Извлекает «голый» GitHub-username из произвольного ввода:
 * `octocat`, `@octocat`, `/octocat`, `github.com/octocat`,
 * `https://github.com/octocat/repo` → `octocat`. Пусто → ''.
 */
export function normalizeGithubUsername(input: unknown): string {
  let v = String(input ?? '').trim()
  if (!v) return ''
  v = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  v = v.replace(/^github\.com\//i, '')
  v = v.replace(/^[@/]+/, '')
  v = v.split(/[/?#]/)[0]
  return v.trim()
}
