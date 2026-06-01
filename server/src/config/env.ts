import { z } from 'zod'

/**
 * Централизованная типобезопасная конфигурация окружения.
 * Валидируется один раз при импорте (fail-fast). В dev/test подставляются
 * безопасные дефолты; в production критичные переменные обязательны.
 */

const isProd = process.env.NODE_ENV === 'production'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),

  /** Список разрешённых origin (через запятую). Пусто → разрешить все (только вне prod). */
  BASALT_CORS_ORIGIN: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),

  /** Ключ для POST /auth/register (заголовок x-dev-register-key). Пусто → регистрация выключена. */
  BASALT_DEV_REGISTER_KEY: z.string().optional().default(''),

  /** Метаданные витрины (GET /v2/meta). */
  BASALT_APP_BUILD: z.string().default('basalt-arena'),
  BASALT_PRIZE_POOL_SHORT: z.string().default('120K'),
  BASALT_PRIZE_CURRENCY: z.string().default('₽'),
})

function applyDevDefaults(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (isProd) return source
  return {
    DATABASE_URL: 'file:./dev.db',
    JWT_SECRET: 'basalt-local-dev-jwt',
    ...source,
  }
}

function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.safeParse(applyDevDefaults(source))
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Некорректная конфигурация окружения:\n${issues}`)
  }
  const data = parsed.data

  // Прод-гарды: явные требования к безопасной конфигурации.
  if (data.NODE_ENV === 'production') {
    if (data.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET в production должен быть не короче 32 символов')
    }
    if (data.BASALT_CORS_ORIGIN.length === 0) {
      // Не валим деплой, но громко предупреждаем: рефлективный CORS в проде небезопасен.
      console.warn(
        '[env] ВНИМАНИЕ: BASALT_CORS_ORIGIN не задан в production — CORS разрешает все origin. Укажите allow-list.',
      )
    }
  }

  return data
}

export type AppEnv = ReturnType<typeof loadEnv>

export const env: AppEnv = loadEnv()

/** CORS-конфигурация для NestExpressApplication. */
export function resolveCorsOrigin(): true | string[] {
  return env.BASALT_CORS_ORIGIN.length > 0 ? env.BASALT_CORS_ORIGIN : true
}
