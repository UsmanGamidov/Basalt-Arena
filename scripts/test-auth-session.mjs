/**
 * Юнит-проверка AuthSessionService: access + refresh, отзыв при logout.
 */
import assert from 'node:assert/strict'
import { JwtService } from '@nestjs/jwt'
import { AuthSessionService } from '../server/dist/auth/auth-session.service.js'
import { AUTH_TOKEN_KIND_ACCESS, AUTH_TOKEN_KIND_REFRESH } from '../server/dist/common/constants/auth-token-kind.js'

const jwtSecret = 'test-auth-session-secret'

function createPrismaMock() {
  const tokens = new Map()
  const users = new Map([
    [
      'u1',
      {
        id: 'u1',
        handle: 'tester',
        role: 'user',
        achievements: [],
      },
    ],
  ])

  return {
    authToken: {
      create: async ({ data }) => {
        const id = `row-${tokens.size}`
        tokens.set(data.token, { ...data, id })
        return { ...data, id }
      },
      findFirst: async ({ where }) => {
        for (const row of tokens.values()) {
          if (where.token && row.token !== where.token) continue
          if (where.kind && row.kind !== where.kind) continue
          if (where.userId && row.userId !== where.userId) continue
          if (where.expiresAt?.gt && row.expiresAt && !(row.expiresAt > where.expiresAt.gt)) continue
          return row
        }
        return null
      },
      findUnique: async ({ where }) => tokens.get(where.token) ?? null,
      delete: async ({ where }) => {
        const row = tokens.get(where.id)
        if (row) tokens.delete(row.token)
        return row
      },
      deleteMany: async ({ where }) => {
        let count = 0
        for (const [key, row] of [...tokens.entries()]) {
          if (where.token && row.token !== where.token) continue
          if (where.userId && row.userId !== where.userId) continue
          if (where.kind && row.kind !== where.kind) continue
          tokens.delete(key)
          count++
        }
        return { count }
      },
    },
    user: {
      findUnique: async ({ where }) => users.get(where.id) ?? null,
    },
  }
}

async function main() {
  const prisma = createPrismaMock()
  const jwtService = new JwtService({ secret: jwtSecret })
  const auth = new AuthSessionService(prisma, jwtService)

  const issued = await auth.issueSession('u1', true)
  assert.ok(issued.accessToken.length > 20)
  assert.ok(issued.refreshToken && issued.refreshToken.length > 20)

  const session = await auth.assertSessionFromAuthHeader(`Bearer ${issued.accessToken}`)
  assert.equal(session.id, 'u1')

  await auth.logout(issued.accessToken, issued.refreshToken)

  let rejected = false
  try {
    await auth.assertSessionFromAuthHeader(`Bearer ${issued.accessToken}`)
  } catch {
    rejected = true
  }
  assert.ok(rejected, 'Access token should be revoked after logout')

  const issued2 = await auth.issueSession('u1', true)
  const refreshed = await auth.refreshSession(issued2.refreshToken)
  assert.ok(refreshed.accessToken.length > 20)

  console.log('auth-session tests passed')
}

void main()
