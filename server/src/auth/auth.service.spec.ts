import { UnauthorizedException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { UserRole } from '@prisma/client'
import { AuthService } from './auth.service'
import { AuthSessionService } from './auth-session.service'
import { PasswordService } from '../domain/password.service'
import { PrismaService } from '../prisma/prisma.service'

describe('AuthService', () => {
  let auth: AuthService
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  }
  const passwords = {
    verifyPassword: jest.fn(),
    hashPassword: jest.fn(),
  }
  const sessions = {
    issueSession: jest.fn(),
    refreshSession: jest.fn(),
    logout: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwords },
        { provide: AuthSessionService, useValue: sessions },
      ],
    }).compile()
    auth = module.get(AuthService)
  })

  it('login rejects wrong password', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      handle: 'user',
      role: UserRole.user,
      avatarUrl: '',
      passwordHash: 'hash',
    })
    passwords.verifyPassword.mockResolvedValue(false)

    await expect(auth.login('user@example.com', 'bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
    expect(sessions.issueSession).not.toHaveBeenCalled()
  })

  it('login returns tokens for valid credentials', async () => {
    const user = {
      id: 'u1',
      handle: 'user',
      role: UserRole.user,
      avatarUrl: '',
      passwordHash: 'hash',
    }
    prisma.user.findFirst.mockResolvedValue(user)
    passwords.verifyPassword.mockResolvedValue(true)
    sessions.issueSession.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: 'u1',
    })

    const res = await auth.login('user@example.com', 'secret')
    expect(res.accessToken).toBe('access')
    expect(res.user.id).toBe('u1')
    expect(sessions.issueSession).toHaveBeenCalledWith('u1', true)
  })

  it('register rejects duplicate email', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'existing' })

    await expect(
      auth.register({ handle: 'new', email: 'a@b.c', password: 'secret12' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
