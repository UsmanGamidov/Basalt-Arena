/** Dicebear identicon — seed должен быть стабильным (id пользователя, не ник). */
export function dicebearAvatarFromSeed(seed) {
  const q = new URLSearchParams({
    seed: String(seed ?? 'user'),
    scale: '62',
    radius: '12',
  })
  return `https://api.dicebear.com/7.x/identicon/svg?${q.toString()}`
}

/** Кастомный URL или identicon по `user.id` (не меняется при смене handle). */
export function resolveUserAvatarUrl(user) {
  if (!user) return dicebearAvatarFromSeed('user')
  const custom = typeof user.avatarUrl === 'string' ? user.avatarUrl.trim() : ''
  if (custom) return custom
  const stableId = user.id ?? user.userId
  return dicebearAvatarFromSeed(stableId || 'user')
}
