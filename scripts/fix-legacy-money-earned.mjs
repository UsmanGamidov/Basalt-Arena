/**
 * Одноразово: moneyEarned в SQLite был строкой «20 000 ₽», схема ожидает Int.
 * Запуск: npm run build -w server && node scripts/fix-legacy-money-earned.mjs
 * (читает DATABASE_URL из server/.env через cwd server)
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = join(root, 'server')
const envPath = join(serverDir, '.env')

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('Нет server/.env')
    process.exit(1)
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/)
    if (m) process.env[m[1]] = m[2]
  }
}

function parseLegacyMoneyEarned(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  return digits ? Math.max(0, Math.trunc(Number(digits))) : 0
}

loadEnv()
process.chdir(serverDir)
const require = createRequire(import.meta.url)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

try {
  const rows = await prisma.$queryRawUnsafe('SELECT id, moneyEarned FROM User')
  let updated = 0
  for (const row of rows) {
    const rub = parseLegacyMoneyEarned(row.moneyEarned)
    const needsFix = typeof row.moneyEarned === 'string' || rub !== Number(row.moneyEarned)
    if (needsFix) {
      await prisma.$executeRawUnsafe('UPDATE User SET moneyEarned = ? WHERE id = ?', rub, row.id)
      updated++
      console.log(`  ${row.id}: ${JSON.stringify(row.moneyEarned)} → ${rub}`)
    }
  }
  console.log(updated > 0 ? `Готово: обновлено ${updated} пользователей.` : 'Нечего исправлять.')
} finally {
  await prisma.$disconnect()
}
