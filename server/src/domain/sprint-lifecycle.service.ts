import { Injectable } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SprintLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async setMainActiveSprint(sprintId: string) {
    const prevMain = await this.prisma.sprint.findFirst({
      where: { isMainActive: true },
      select: { id: true },
    })
    if (prevMain?.id === sprintId) return

    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, title: true, tabLabel: true, published: true },
    })
    if (!sprint) return

    await this.prisma.$transaction([
      this.prisma.sprint.updateMany({ data: { isMainActive: false }, where: { isMainActive: true } }),
      this.prisma.sprint.update({
        where: { id: sprintId },
        data: { isMainActive: true, published: true },
      }),
    ])

    if (sprint.published) {
      await this.notifyMainSprintActivated(sprintId, sprint)
    }
  }

  private async notifyMainSprintActivated(
    sprintId: string,
    sprint: { title: string; tabLabel: string | null },
  ) {
    const label = sprint.tabLabel || sprint.title || sprintId
    const enrolled = await this.prisma.sprintEnrollment.findMany({
      where: { sprintId },
      select: { userId: true },
    })
    if (enrolled.length === 0) return
    const body = `«${label}» на главной. Отправьте решение до дедлайна.`
    for (const { userId } of enrolled) {
      await this.notifications.push(userId, 'Активный спринт', body)
    }
  }
}
