import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { SubmissionsService } from './submissions.service'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

describe('SubmissionsService', () => {
  let submissions: SubmissionsService
  const prisma = {
    sprint: { findUnique: jest.fn() },
    sprintEnrollment: { findUnique: jest.fn(), upsert: jest.fn() },
    submission: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    solution: { findFirst: jest.fn() },
  }
  const users = {
    buildSprintContextForUser: jest.fn(),
  }

  const viewer = {
    id: 'u1',
    handle: 'user',
    role: 'user',
    email: 'u@e.c',
    bio: '',
    telegram: '',
    github: '',
    skillsLabel: '',
    avatarUrl: '',
    notificationsUnread: 0,
    points: 0,
    globalRank: '#0',
    sprintsCompleted: 0,
    moneyEarned: 0,
    achievements: [],
  } as const

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: users },
      ],
    }).compile()
    submissions = module.get(SubmissionsService)
  })

  it('createSubmission rejects when sprint ended', async () => {
    const past = new Date(Date.now() - 60_000)
    prisma.sprint.findUnique.mockResolvedValue({
      id: 'S1',
      published: true,
      endsAt: past,
    })
    prisma.sprintEnrollment.findUnique.mockResolvedValue({ id: 'enr1' })

    await expect(
      submissions.createSubmission(viewer as never, 'S1', {
        repoUrl: 'https://github.com/a/b',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('createSubmission rejects when not enrolled', async () => {
    prisma.sprint.findUnique.mockResolvedValue({
      id: 'S1',
      published: true,
      endsAt: new Date(Date.now() + 86_400_000),
    })
    prisma.sprintEnrollment.findUnique.mockResolvedValue(null)

    await expect(
      submissions.createSubmission(viewer as never, 'S1', {
        repoUrl: 'https://github.com/a/b',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
