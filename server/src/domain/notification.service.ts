import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async push(userId: string, title: string, body: string) {
    await this.prisma.$transaction([
      this.prisma.notification.create({
        data: { userId, title, body },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { notificationsUnread: { increment: 1 } },
      }),
    ])
  }
}
