import argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function requiredEnv(name) {
  const value = String(process.env[name] ?? '').trim()
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

async function main() {
  const handle = requiredEnv('BASALT_BOOTSTRAP_ADMIN_HANDLE').replace(/^@/, '').toLowerCase()
  const email = requiredEnv('BASALT_BOOTSTRAP_ADMIN_EMAIL').toLowerCase()
  const password = requiredEnv('BASALT_BOOTSTRAP_ADMIN_PASSWORD')
  const displayName = String(process.env.BASALT_BOOTSTRAP_ADMIN_DISPLAY_NAME ?? '').trim()

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      handle,
      role: 'admin',
      displayName,
      passwordHash,
      github: `/${handle}`,
    },
    create: {
      handle,
      email,
      role: 'admin',
      displayName,
      passwordHash,
      github: `/${handle}`,
    },
    select: { id: true, handle: true, email: true, role: true },
  })

  console.log(`Bootstrap admin ready: @${user.handle} (${user.email}) role=${user.role}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
