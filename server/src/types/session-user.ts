import { User } from '@prisma/client'

/** Пользователь из валидного JWT (базовые поля User, без связей). */
export type BasaltSessionUser = User
