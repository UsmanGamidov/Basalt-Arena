import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl = String(process.env.DATABASE_URL ?? '').trim()
    if (!dbUrl) {
      throw new Error('DATABASE_URL is required')
    }
    super({
      datasources: { db: { url: dbUrl } },
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close()
    })
  }
}
