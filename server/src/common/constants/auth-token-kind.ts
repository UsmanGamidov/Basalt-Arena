export const AUTH_TOKEN_KIND_ACCESS = 'access' as const
export const AUTH_TOKEN_KIND_REFRESH = 'refresh' as const

export type AuthTokenKind = typeof AUTH_TOKEN_KIND_ACCESS | typeof AUTH_TOKEN_KIND_REFRESH
