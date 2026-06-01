import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AdminActor } from '../types/admin-actor'

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    actor: AdminActor,
    action: string,
    targetType: string,
    targetId: string | null,
    message: string,
  ) {
    if (!actor?.id) return
    await this.prisma.adminLog.create({
      data: {
        actorId: actor.id,
        actorHandle: String(actor.handle ?? ''),
        action,
        targetType,
        targetId,
        message,
      },
    })
  }

  async resolveUserHandle(userId: string) {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })
    return row?.handle ?? userId
  }

  async listLogs(limit = 100, offset = 0, q?: string) {
    const take = Math.min(200, Math.max(1, Math.floor(limit)))
    const skip = Math.max(0, Math.floor(offset))
    const needle = q?.trim()
    const dbUrl = String(process.env.DATABASE_URL ?? '')
    const logSearchInsensitive =
      dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
    const logTextFilter = (field: 'actorHandle' | 'action' | 'targetType' | 'targetId' | 'message') =>
      logSearchInsensitive
        ? { [field]: { contains: needle, mode: 'insensitive' as const } }
        : { [field]: { contains: needle } }
    const where = needle
      ? {
          OR: [
            logTextFilter('actorHandle'),
            logTextFilter('action'),
            logTextFilter('targetType'),
            logTextFilter('targetId'),
            logTextFilter('message'),
          ],
        }
      : undefined
    const [rows, total] = await Promise.all([
      this.prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.adminLog.count({ where }),
    ])
    const userIds = new Set<string>()
    const sprintIds = new Set<string>()
    const submissionIds = new Set<string>()
    const solutionIds = new Set<string>()
    const achievementIds = new Set<string>()
    const definitionIds = new Set<string>()
    const userIdPattern = /user=([a-z0-9]{20,})/gi
    for (const row of rows) {
      if (row.targetType === 'user' && row.targetId) userIds.add(row.targetId)
      if (row.targetType === 'sprint' && row.targetId) sprintIds.add(row.targetId)
      if (row.targetType === 'submission' && row.targetId) submissionIds.add(row.targetId)
      if (row.targetType === 'solution' && row.targetId) solutionIds.add(row.targetId)
      if (row.targetType === 'achievement' && row.targetId) achievementIds.add(row.targetId)
      if (row.targetType === 'achievement_definition' && row.targetId) definitionIds.add(row.targetId)
      let m: RegExpExecArray | null
      while ((m = userIdPattern.exec(row.message)) != null) {
        if (m[1]) userIds.add(m[1])
      }
    }
    const userMap =
      userIds.size > 0
        ? new Map(
            (
              await this.prisma.user.findMany({
                where: { id: { in: [...userIds] } },
                select: { id: true, handle: true },
              })
            ).map((u) => [u.id, u.handle]),
          )
        : new Map<string, string>()
    const sprintMap =
      sprintIds.size > 0
        ? new Map(
            (
              await this.prisma.sprint.findMany({
                where: { id: { in: [...sprintIds] } },
                select: { id: true, tabLabel: true, title: true },
              })
            ).map((s) => [s.id, s.tabLabel || s.title || s.id]),
          )
        : new Map<string, string>()
    const submissionMap =
      submissionIds.size > 0
        ? new Map(
            (
              await this.prisma.submission.findMany({
                where: { id: { in: [...submissionIds] } },
                select: { id: true, sprintId: true, user: { select: { handle: true } } },
              })
            ).map((s) => [s.id, `@${s.user.handle} · ${s.sprintId}`]),
          )
        : new Map<string, string>()
    const solutionMap =
      solutionIds.size > 0
        ? new Map(
            (
              await this.prisma.solution.findMany({
                where: { id: { in: [...solutionIds] } },
                select: { id: true, sprintId: true, user: { select: { handle: true } } },
              })
            ).map((s) => [s.id, `@${s.user.handle} · ${s.sprintId}`]),
          )
        : new Map<string, string>()
    const achievementMap =
      achievementIds.size > 0
        ? new Map(
            (
              await this.prisma.achievement.findMany({
                where: { id: { in: [...achievementIds] } },
                select: { id: true, title: true, user: { select: { handle: true } } },
              })
            ).map((a) => [a.id, `@${a.user.handle} · ${a.title}`]),
          )
        : new Map<string, string>()
    const definitionMap =
      definitionIds.size > 0
        ? new Map(
            (
              await this.prisma.achievementDefinition.findMany({
                where: { id: { in: [...definitionIds] } },
                select: { id: true, title: true },
              })
            ).map((d) => [d.id, d.title]),
          )
        : new Map<string, string>()

    const prettifyMessage = (message: string) =>
      message.replace(/user=([a-z0-9]{20,})/gi, (_whole, id: string) => {
        const handle = userMap.get(id)
        return handle ? `user=@${handle}` : `user=${id}`
      })

    const prettifyTargetLabel = (targetType: string, targetId: string | null) => {
      if (!targetId) return targetType
      switch (targetType) {
        case 'user':
          return userMap.has(targetId) ? `@${userMap.get(targetId)}` : targetType
        case 'sprint':
          return sprintMap.get(targetId) ?? targetType
        case 'submission':
          return submissionMap.get(targetId) ?? targetType
        case 'solution':
          return solutionMap.get(targetId) ?? targetType
        case 'achievement':
          return achievementMap.get(targetId) ?? targetType
        case 'achievement_definition':
          return definitionMap.get(targetId) ?? targetType
        default:
          return targetType
      }
    }

    return {
      total,
      logs: rows.map((r) => ({
        id: r.id,
        actorId: r.actorId,
        actorHandle: r.actorHandle || userMap.get(r.actorId) || r.actorId,
        action: r.action,
        targetType: r.targetType,
        targetId: r.targetId,
        targetLabel: prettifyTargetLabel(r.targetType, r.targetId),
        message: prettifyMessage(r.message),
        createdAt: r.createdAt.toISOString(),
      })),
    }
  }
}
