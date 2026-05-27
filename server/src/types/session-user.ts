import { Prisma } from '@prisma/client'

/** Пользователь из валидного JWT, с достижениями (как в getUserByTokenOrThrow). */
export type BasaltSessionUser = Prisma.UserGetPayload<{ include: { achievements: true } }>
