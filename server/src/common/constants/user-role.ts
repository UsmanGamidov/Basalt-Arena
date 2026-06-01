export const USER_ROLE_USER = 'user' as const
export const USER_ROLE_ADMIN = 'admin' as const

export const USER_ROLES = [USER_ROLE_USER, USER_ROLE_ADMIN] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value)
}
