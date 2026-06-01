import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'node:crypto'
import {
  AUTH_TOKEN_KIND_ACCESS,
  AUTH_TOKEN_KIND_REFRESH,
} from '../common/constants/auth-token-kind'
import { USER_ROLE_ADMIN } from '../common/constants/user-role'
import { PrismaService } from '../prisma/prisma.service'
import type { BasaltSessionUser } from '../types/session-user'

const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** Удаление просроченных refresh и старых access-сессий. */
const AUTH_TOKEN_RETENTION_MS = 31 * 24 * 60 * 60 * 1000

export type IssuedSession = {
  accessToken: string
  refreshToken?: string
  userId: string
}

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async pruneStaleTokens() {
    const now = new Date()
    const accessCutoff = new Date(Date.now() - AUTH_TOKEN_RETENTION_MS)
    const { count } = await this.prisma.authToken.deleteMany({
      where: {
        OR: [
          { kind: AUTH_TOKEN_KIND_REFRESH, expiresAt: { lt: now } },
          { kind: AUTH_TOKEN_KIND_ACCESS, createdAt: { lt: accessCutoff } },
        ],
      },
    })
    if (count > 0) {
      this.logger.log(`Removed ${count} stale auth token(s)`)
    }
  }

  async issueSession(userId: string, rememberSession = true): Promise<IssuedSession> {
    const accessJti = randomUUID()
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, jti: accessJti },
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    )
    await this.prisma.authToken.create({
      data: { token: accessJti, userId, kind: AUTH_TOKEN_KIND_ACCESS },
    })

    if (!rememberSession) {
      return { accessToken, userId }
    }

    const refreshToken = randomUUID()
    await this.prisma.authToken.create({
      data: {
        token: refreshToken,
        userId,
        kind: AUTH_TOKEN_KIND_REFRESH,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    })
    return { accessToken, refreshToken, userId }
  }

  async refreshSession(refreshToken: string): Promise<IssuedSession> {
    const row = await this.prisma.authToken.findFirst({
      where: {
        token: refreshToken,
        kind: AUTH_TOKEN_KIND_REFRESH,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    })
    if (!row) {
      throw new UnauthorizedException('Refresh-токен недействителен или истёк')
    }
    await this.prisma.authToken.delete({ where: { id: row.id } })
    return this.issueSession(row.userId, true)
  }

  async logout(accessToken?: string, refreshToken?: string) {
    if (accessToken) {
      await this.revokeAccessToken(accessToken)
    }
    if (refreshToken?.trim()) {
      await this.prisma.authToken.deleteMany({
        where: { token: refreshToken.trim(), kind: AUTH_TOKEN_KIND_REFRESH },
      })
    }
    return { ok: true }
  }

  private async revokeAccessToken(accessToken: string) {
    let payload: { sub?: string; jti?: string } | null = null
    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string; jti?: string }>(accessToken)
    } catch {
      return
    }
    if (payload?.jti && payload.sub) {
      await this.prisma.authToken.deleteMany({
        where: { token: payload.jti, userId: payload.sub, kind: AUTH_TOKEN_KIND_ACCESS },
      })
    }
  }

  extractBearerToken(authHeader?: string) {
    const raw = String(authHeader ?? '').trim()
    if (!raw) return undefined
    const m = raw.match(/^Bearer\s+(.+)$/i)
    if (!m?.[1]) return undefined
    const token = m[1].trim()
    return token || undefined
  }

  async assertAdminFromAuthHeader(authHeader?: string) {
    const token = this.extractBearerToken(authHeader)
    return this.getAdminByTokenOrThrow(token)
  }

  async assertSessionFromAuthHeader(authHeader?: string): Promise<BasaltSessionUser> {
    const token = this.extractBearerToken(authHeader)
    const user = await this.getUserByTokenOrThrow(token)
    return user as BasaltSessionUser
  }

  async trySessionFromAuthHeader(authHeader?: string): Promise<BasaltSessionUser | null> {
    const token = this.extractBearerToken(authHeader)
    if (!token) return null
    try {
      const user = await this.getUserByTokenOrThrow(token)
      return user as BasaltSessionUser
    } catch {
      return null
    }
  }

  private async assertActiveAccessSession(payload: { sub?: string; jti?: string }) {
    const userId = payload.sub
    const jti = payload.jti
    if (!userId || !jti) {
      throw new UnauthorizedException('Токен невалиден')
    }
    const row = await this.prisma.authToken.findFirst({
      where: {
        token: jti,
        userId,
        kind: AUTH_TOKEN_KIND_ACCESS,
      },
      select: { userId: true },
    })
    if (!row) {
      throw new UnauthorizedException('Токен отозван или невалиден')
    }
  }

  private async getUserByTokenOrThrow(token?: string) {
    if (!token) throw new UnauthorizedException('Требуется авторизация')

    let payload: { sub?: string; jti?: string } | null = null
    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string; jti?: string }>(token)
    } catch {
      payload = null
    }
    if (!payload?.sub) {
      throw new UnauthorizedException('Токен невалиден')
    }
    await this.assertActiveAccessSession(payload)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })
    if (!user) {
      throw new UnauthorizedException('Токен невалиден')
    }
    return user
  }

  private async getAdminByTokenOrThrow(token?: string) {
    const user = await this.getUserByTokenOrThrow(token)
    if (user.role !== USER_ROLE_ADMIN) {
      throw new UnauthorizedException('Требуются права администратора')
    }
    return user
  }
}
