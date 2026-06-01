import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { USER_ROLE_USER } from '../common/constants/user-role'
import { PasswordService } from '../domain/password.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuthSessionService } from './auth-session.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: AuthSessionService,
  ) {}

  async login(loginOrEmail: string, password: string, rememberSession = true) {
    const normalized = loginOrEmail.trim().toLowerCase().replace(/^@/, '')
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { handle: normalized }],
      },
    })
    if (!user || !(await this.passwords.verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException('Неверный логин или пароль')
    }
    const tokens = await this.sessions.issueSession(user.id, rememberSession)
    return { ...tokens, user: this.toPublicUser(user) }
  }

  async register(payload: { handle: string; email: string; password: string }) {
    const handle = payload.handle.trim().replace(/^@/, '').toLowerCase()
    const email = payload.email.trim().toLowerCase()
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { handle }] },
      select: { id: true },
    })
    if (exists) throw new UnauthorizedException('Пользователь уже существует')

    const user = await this.prisma.user.create({
      data: {
        handle,
        email,
        passwordHash: await this.passwords.hashPassword(payload.password),
        role: UserRole.user,
        avatarUrl: '',
        notificationsUnread: 0,
        points: 0,
        globalRank: '#0',
        sprintsCompleted: 0,
        moneyEarned: 0,
        bio: 'Новый участник Basalt Arena.',
        skillsLabel: 'JavaScript',
        displayName: '',
        telegram: `@${handle}`,
        github: `/${handle}`,
      },
    })
    const tokens = await this.sessions.issueSession(user.id, true)
    return { ...tokens, user: this.toPublicUser(user) }
  }

  async refresh(refreshToken: string) {
    const tokens = await this.sessions.refreshSession(refreshToken)
    const user = await this.prisma.user.findUnique({ where: { id: tokens.userId } })
    if (!user) throw new UnauthorizedException('Пользователь не найден')
    return { ...tokens, user: this.toPublicUser(user) }
  }

  async logout(accessToken?: string, refreshToken?: string) {
    return this.sessions.logout(accessToken, refreshToken)
  }

  private toPublicUser(user: {
    id: string
    handle: string
    role: string
    avatarUrl: string | null
  }) {
    return {
      id: user.id,
      handle: user.handle,
      role: user.role,
      avatarUrl: user.avatarUrl ?? '',
    }
  }
}
