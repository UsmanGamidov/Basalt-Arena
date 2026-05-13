import argon2 from 'argon2'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

const avatar = (seed: string) =>
  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&scale=62&radius=12`

const SPRINTS = [
  {
    slug: 'sprint-2-basalt-arena',
    title: '#2 Basalt Arena (frontend)',
    tabLabel: '#2 Basalt Arena (frontend)',
    tabIcon: 'deployed_code',
    completedLabel: 'Активный спринт',
    tags: ['HTML', 'Tailwind CSS', 'React'],
    active: true,
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    brief: {
      quote:
        'Перед вами макет той самой платформы, на которой вы сейчас находитесь. Ваша задача — сверстать его.',
      taskParagraphs: [
        {
          chunks: [
            'Реализуйте все три страницы по макету: главный экран спринта, зал славы, профиль. Стек — любой.',
          ],
        },
      ],
      acceptanceTitle: 'Критерии приёмки',
      acceptanceItems: [
        { parts: ['Соответствие макету.'] },
        { parts: ['JS-функционал должен работать без бэка.'] },
      ],
      resourceLinks: [
        { label: 'Figma-макет', href: '#', icon: 'view_quilt' },
        { label: 'Гайд по API', href: '#', icon: 'code' },
      ],
      sprintPath: '/',
    },
    metrics: {
      submissions: 0,
      submissionsBarPct: 0,
      deltaLabel: 'Старт спринта',
      successRate: '—',
      verifiedSolutions: 0,
    },
  },
  {
    slug: 'sprint-1-listea',
    title: '#1 Listea',
    tabLabel: '#1 Listea',
    tabIcon: null,
    completedLabel: 'Завершён 2 марта',
    tags: ['Vue', 'Pinia'],
    active: false,
    startsAt: new Date('2026-02-15'),
    endsAt: new Date('2026-03-02'),
    brief: {
      quote: 'Spring #1 — отдельное задание в экосистеме Vue.',
      taskParagraphs: [{ chunks: ['Подробности — в материалах спринта.'] }],
      acceptanceTitle: 'Критерии приёмки',
      acceptanceItems: [{ parts: ['Соответствие ТЗ.'] }],
      resourceLinks: [],
      sprintPath: '/',
    },
    metrics: {
      submissions: 892,
      submissionsBarPct: 62,
      deltaLabel: '+4% к прошлому спринту',
      successRate: '38,1%',
      verifiedSolutions: 340,
    },
  },
] as const

const ACHIEVEMENTS = [
  { slug: 'gaz', title: 'Газующий', subtitle: 'Не пропустил ни одного спринта', icon: 'calendar_month' },
  { slug: 'arch', title: 'Архитектор', subtitle: 'Создатель Basalt Arena', icon: 'architecture' },
  { slug: 'first', title: 'Первый', subtitle: 'Выложил решение первым', icon: 'looks_one' },
  { slug: 'ghost', title: 'Невидимка', subtitle: 'Ни разу не участвовал', icon: 'block' },
] as const

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin1234'
  const mentorPassword = process.env.SEED_MENTOR_PASSWORD ?? 'mentor1234'

  const [adminHash, mentorHash] = await Promise.all([
    argon2.hash(adminPassword, { type: argon2.argon2id }),
    argon2.hash(mentorPassword, { type: argon2.argon2id }),
  ])

  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      handle: 'dev_architect',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      avatarUrl: avatar('dev_architect'),
      bio: 'Архитектор арены. Разработчик.',
      skillsLabel: 'TypeScript, Postgres, Rust',
      realName: 'Команда Basalt',
      stack: ['TypeScript', 'Postgres', 'Rust'],
      telegram: '@dev_architect',
      githubUrl: '/dev_architect',
      points: 90,
      moneyEarned: 0,
    },
  })

  await prisma.user.upsert({
    where: { email: 'mentor@basalt-arena.io' },
    update: {},
    create: {
      email: 'mentor@basalt-arena.io',
      handle: 'senior_mentor',
      passwordHash: mentorHash,
      role: UserRole.MENTOR,
      avatarUrl: avatar('senior_mentor'),
      skillsLabel: 'Senior reviewer',
      realName: 'Старший ментор',
      stack: ['Review', 'Architecture'],
      telegram: '@senior_mentor',
      githubUrl: '/senior_mentor',
      moneyEarned: 0,
    },
  })

  for (const sprint of SPRINTS) {
    await prisma.sprint.upsert({
      where: { slug: sprint.slug },
      update: {},
      create: {
        slug: sprint.slug,
        title: sprint.title,
        tabLabel: sprint.tabLabel,
        tabIcon: sprint.tabIcon ?? null,
        completedLabel: sprint.completedLabel,
        tags: [...sprint.tags],
        active: sprint.active,
        startsAt: sprint.startsAt,
        endsAt: sprint.endsAt,
        brief: sprint.brief,
        metrics: sprint.metrics,
      },
    })
  }

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: { ...achievement },
    })
  }

  const archAchievement = await prisma.achievement.findUnique({ where: { slug: 'arch' } })
  if (archAchievement) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: admin.id, achievementId: archAchievement.id } },
      update: {},
      create: { userId: admin.id, achievementId: archAchievement.id },
    })
  }

  const allUsers = await prisma.user.findMany({ select: { id: true, role: true } })
  const allSprints = await prisma.sprint.findMany({ select: { id: true, active: true } })
  for (const u of allUsers) {
    for (const sp of allSprints) {
      const canSubmit = sp.active
      await prisma.sprintAccess.upsert({
        where: { sprint_access_user_sprint_unique: { userId: u.id, sprintId: sp.id } },
        create: {
          userId: u.id,
          sprintId: sp.id,
          canSubmit,
          canView: true,
        },
        update: { canSubmit, canView: true },
      })
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
