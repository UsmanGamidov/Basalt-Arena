import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

function resolveDatabaseUrl(): string {
  const fromEnv = String(process.env.DATABASE_URL ?? '').trim()
  if (fromEnv) return fromEnv

  const dbPath = existsSync(resolve(process.cwd(), 'prisma/dev.db'))
    ? resolve(process.cwd(), 'prisma/dev.db')
    : resolve(process.cwd(), 'server/prisma/dev.db')
  return `file:${dbPath.replace(/\\/g, '/')}`
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: { db: { url: resolveDatabaseUrl() } },
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
