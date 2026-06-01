import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  mapSubmissionForUser,
  submissionStatusLabel,
} from '../common/presenters/submission.presenter'
import { SUBMISSION_BLOCKING_STATUSES } from '../common/constants/submission-status'
import { isUniqueConstraintError } from '../common/utils/prisma-errors.util'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'
import type { BasaltSessionUser } from '../types/session-user'

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async getMyActiveSubmissionForSprint(user: BasaltSessionUser, sprintId: string) {
    const row = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        sprintId,
        status: { in: [...SUBMISSION_BLOCKING_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: { sprint: { select: { title: true, tabLabel: true } } },
    })
    if (!row) return { submission: null }
    if (row.status === 'approved') {
      const hasSolution = await this.prisma.solution.findFirst({
        where: { sprintId, userId: user.id },
        select: { id: true },
      })
      if (!hasSolution) return { submission: null }
    }
    return { submission: mapSubmissionForUser(row) }
  }

  async deleteMySubmission(user: BasaltSessionUser, submissionId: string) {
    const sub = await this.prisma.submission.findFirst({
      where: { id: submissionId, userId: user.id },
    })
    if (!sub) throw new NotFoundException('Отправка не найдена')
    if (sub.status !== 'pending_review') {
      throw new BadRequestException('Удалить можно только отправку, которая ещё на проверке')
    }
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'deleted_by_user' },
      include: { sprint: { select: { title: true, tabLabel: true } } },
    })
    return { submission: mapSubmissionForUser(updated) }
  }

  async createSubmission(
    user: BasaltSessionUser,
    sprintId: string,
    payload: { repoUrl: string; demoUrl?: string },
  ) {
    const repoUrl = this.assertHttpUrl(payload.repoUrl, 'Репозиторий')
    const demoUrl =
      payload.demoUrl != null && String(payload.demoUrl).trim()
        ? this.assertHttpUrl(payload.demoUrl, 'Демо')
        : null

    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } })
    if (!sprint || !sprint.published) throw new NotFoundException('Спринт не найден')
    const enrolled = await this.prisma.sprintEnrollment.findUnique({
      where: { userId_sprintId: { userId: user.id, sprintId } },
      select: { id: true },
    })
    if (!enrolled) {
      throw new ForbiddenException('Ты не зачислен в этот спринт')
    }
    if (sprint.endsAt != null && sprint.endsAt.getTime() < Date.now()) {
      throw new BadRequestException('Спринт уже завершён, приём решений закрыт')
    }
    const existingSubmission = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        sprintId,
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })
    if (existingSubmission) {
      if (existingSubmission.status === 'pending_review' || existingSubmission.status === 'deleted_by_user') {
        throw new ConflictException(
          'У тебя уже есть отправка на проверке в этом спринте. Дождись решения наставника или отзови текущую в профиле.',
        )
      }
      if (existingSubmission.status === 'approved') {
        const hasSolution = await this.prisma.solution.findFirst({
          where: { sprintId, userId: user.id },
          select: { id: true },
        })
        if (hasSolution) {
          throw new ConflictException('В этом спринте у тебя уже есть принятая отправка')
        }
        const recovered = await this.prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            repoUrl,
            demoUrl,
            status: 'pending_review',
            mentorScore: null,
            reviewNote: null,
            reviewedAt: null,
          },
        })
        return {
          id: recovered.id,
          status: recovered.status,
          statusLabel: submissionStatusLabel(recovered.status),
        }
      }
      const reused = await this.prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          repoUrl,
          demoUrl,
          status: 'pending_review',
          mentorScore: null,
          reviewNote: null,
          reviewedAt: null,
        },
      })
      return {
        id: reused.id,
        status: reused.status,
        statusLabel: submissionStatusLabel(reused.status),
      }
    }
    let sub
    try {
      sub = await this.prisma.submission.create({
        data: {
          sprintId,
          userId: user.id,
          repoUrl,
          demoUrl,
          status: 'pending_review',
        },
      })
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw new ConflictException(
          'У тебя уже есть отправка на этот спринт. Обнови страницу и проверь статус в профиле.',
        )
      }
      throw e
    }
    await this.prisma.sprintEnrollment.upsert({
      where: { userId_sprintId: { userId: user.id, sprintId } },
      create: { userId: user.id, sprintId },
      update: {},
    })
    return {
      id: sub.id,
      status: sub.status,
      statusLabel: submissionStatusLabel(sub.status),
    }
  }

  async createSubmissionForActiveSprint(
    user: BasaltSessionUser,
    payload: { repoUrl: string; demoUrl?: string },
  ) {
    const ctx = await this.users.buildSprintContextForUser(user.id)
    const sprintId = ctx.activeSprint
    if (!sprintId) {
      throw new BadRequestException('Нет активного спринта для отправки решения')
    }
    if (!ctx.enrolled) {
      throw new ForbiddenException('Ты не зачислен в этот спринт')
    }
    if (!ctx.systemActive) {
      throw new BadRequestException('Спринт завершён или приём решений закрыт')
    }
    return this.createSubmission(user, sprintId, payload)
  }

  private assertHttpUrl(url: string, fieldLabel: string) {
    const raw = String(url ?? '').trim()
    if (!raw) throw new BadRequestException(`${fieldLabel}: укажите ссылку`)
    try {
      const parsed = new URL(raw)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('bad protocol')
      }
    } catch {
      throw new BadRequestException(`${fieldLabel}: нужна ссылка вида https://…`)
    }
    return raw
  }
}
