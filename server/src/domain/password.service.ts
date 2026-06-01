import { Injectable, Logger } from '@nestjs/common'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Хэширование паролей. Новые хэши — argon2id (современный стандарт).
 * Проверка обратно совместима: argon2 → bcrypt → legacy plaintext.
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name)

  constructor(private readonly prisma: PrismaService) {}

  isArgon2Hash(value: string) {
    return value.startsWith('$argon2')
  }

  isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value)
  }

  hashPassword(plain: string) {
    return argon2.hash(plain, { type: argon2.argon2id })
  }

  async verifyPassword(stored: string, plain: string) {
    if (this.isArgon2Hash(stored)) {
      try {
        return await argon2.verify(stored, plain)
      } catch {
        return false
      }
    }
    if (this.isBcryptHash(stored)) return bcrypt.compare(plain, stored)
    return stored === plain
  }

  /** Однократный апгрейд старых записей с паролем в открытом виде → argon2. */
  async upgradeLegacyPasswordHashes() {
    const users = await this.prisma.user.findMany({
      select: { id: true, passwordHash: true },
    })
    let upgraded = 0
    for (const u of users) {
      if (this.isArgon2Hash(u.passwordHash) || this.isBcryptHash(u.passwordHash)) continue
      await this.prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: await this.hashPassword(u.passwordHash) },
      })
      upgraded++
    }
    if (upgraded > 0) {
      this.logger.log(`Upgraded ${upgraded} legacy plaintext password(s) to argon2`)
    }
  }
}
