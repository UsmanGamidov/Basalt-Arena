import fs from 'node:fs'
import path from 'node:path'

const root = path.join(import.meta.dirname, '..')
const src = path.join(root, 'src/basalt-data.service.ts')
const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/)
const start = lines.findIndex((l) => l.includes('async adminCreateUser('))
const end = lines.findIndex((l, i) => i > start && l.includes('private toPublicUser('))
if (start < 0 || end < 0) {
  throw new Error(`markers not found start=${start} end=${end}`)
}
let body = lines.slice(start, end).join('\n')
const reps = [
  [/this\.appendAdminLog\(/g, 'this.audit.append('],
  [/await this\.userHandleById\(/g, 'await this.audit.resolveUserHandle('],
  [/this\.mapSubmissionForAdmin\(/g, 'mapSubmissionForAdmin('],
  [/this\.setMainActiveSprint\(/g, 'this.sprintLifecycle.setMainActiveSprint('],
  [/await this\.pushNotification\(/g, 'await this.notifications.push('],
  [/this\.isUniqueConstraintError\(/g, 'isUniqueConstraintError('],
  [/this\.recalculateSprintRanks\(/g, 'this.prizeSettlement.recalculateSprintRanks('],
  [/this\.reconcileUserDerivedStats\(/g, 'this.prizeSettlement.reconcileUserDerivedStats('],
]
for (const [a, b] of reps) body = body.replace(a, b)

const header = `import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { mapSubmissionForAdmin } from '../common/presenters/submission.presenter'
import { isUniqueConstraintError } from '../common/utils/prisma-errors.util'
import { parseOptionalIsoDate } from '../common/utils/sprint-timing.util'
import { formatMoneyRub } from '../common/utils/money.util'
import { USER_ROLE_ADMIN, USER_ROLE_USER } from '../common/constants/user-role'
import { MENTOR_SCORE_MAX } from '../modules/admin/dto/admin.dto'
import { AdminAuditService } from './admin-audit.service'
import { NotificationService } from './notification.service'
import { PasswordService } from './password.service'
import { PrizeSettlementService } from './prize-settlement.service'
import { SprintLifecycleService } from './sprint-lifecycle.service'
import { PrismaService } from '../prisma/prisma.service'
import type { AdminActor } from '../types/admin-actor'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly passwords: PasswordService,
    private readonly notifications: NotificationService,
    private readonly sprintLifecycle: SprintLifecycleService,
    private readonly prizeSettlement: PrizeSettlementService,
  ) {}

  private normalizeMentorScore(score: number): number {
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new BadRequestException('Балл за спринт должен быть числом от 0 до 100')
    }
    const n = Math.round(score)
    if (n < 0 || n > MENTOR_SCORE_MAX) {
      throw new BadRequestException(\`Балл за спринт: от 0 до \${MENTOR_SCORE_MAX}\`)
    }
    return n
  }

  private rankToBadge(rank: number) {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'slate'
    if (rank === 3) return 'bronze'
    return 'muted'
  }

`

const out = path.join(root, 'src/domain/admin.service.ts')
fs.writeFileSync(out, header + body + '\n}\n')
console.log('Wrote', out, 'lines', (header + body).split('\n').length)
