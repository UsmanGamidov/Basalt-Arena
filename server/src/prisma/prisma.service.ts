import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbPath = existsSync(resolve(process.cwd(), 'server/prisma/dev.db'))
      ? resolve(process.cwd(), 'server/prisma/dev.db')
      : resolve(process.cwd(), 'prisma/dev.db')
    const absoluteSqliteUrl = `file:${dbPath.replace(/\\/g, '/')}`
    const dbUrl = process.env.DATABASE_URL ?? absoluteSqliteUrl
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
