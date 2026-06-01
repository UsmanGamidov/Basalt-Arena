// Безопасный деплой схемы через Prisma Migrate (PostgreSQL).
//
// Сценарии, которые скрипт обрабатывает сам (идемпотентно и без ручных шагов):
//   1. Свежая БД                  → migrate deploy (применит все миграции).
//   2. Существующая БД от db push → baseline (resolve --applied 0_init) + migrate deploy.
//   3. БД уже под Migrate          → migrate deploy (применит только новые).
//
// Запускается в CI/на Render после `prisma generate` для postgres-схемы.

import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const SCHEMA = 'prisma/schema.postgres.prisma'
const BASELINE_MIGRATION = '0_init'

function run(cmd) {
  console.log(`[db-deploy] $ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

async function tableExists(prisma, tableName) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS "exists"`,
    tableName,
  )
  return Boolean(rows?.[0]?.exists)
}

async function main() {
  const prisma = new PrismaClient()
  let migrationsTracked = false
  let legacyDbPushSchema = false
  try {
    migrationsTracked = await tableExists(prisma, '_prisma_migrations')
    if (!migrationsTracked) {
      legacyDbPushSchema = await tableExists(prisma, 'User')
    }
  } finally {
    await prisma.$disconnect()
  }

  if (!migrationsTracked && legacyDbPushSchema) {
    console.log('[db-deploy] Existing schema without migration history — baselining as applied.')
    run(`npx prisma migrate resolve --applied ${BASELINE_MIGRATION} --schema=${SCHEMA}`)
  }

  run(`npx prisma migrate deploy --schema=${SCHEMA}`)
  console.log('[db-deploy] Done.')
}

main().catch((error) => {
  console.error('[db-deploy] Failed:', error)
  process.exit(1)
})
