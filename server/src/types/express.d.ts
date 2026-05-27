import type { BasaltSessionUser } from './session-user'

declare global {
  namespace Express {
    interface Request {
      /** `AdminGuard`: Bearer + роль admin */
      basaltAdmin?: BasaltSessionUser
      /** `AuthGuard`: Bearer + любой авторизованный пользователь */
      basaltUser?: BasaltSessionUser
    }
  }
}

export {}
