import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'

const PASSWORD_HASH_ROUNDS = 10

@Injectable()
export class PasswordService {
  constructor(private readonly prisma: PrismaService) {}

  isBcryptHash(value: string) {
    return /^\$2[aby]\$\d{2}\$/.test(value)
  }

  hashPassword(plain: string) {
    return bcrypt.hash(plain, PASSWORD_HASH_ROUNDS)
  }

  async verifyPassword(stored: string, plain: string) {
    if (this.isBcryptHash(stored)) return bcrypt.compare(plain, stored)
    return stored === plain
  }

  /** Однократный апгрейд старых записей с паролем в открытом виде. */
  async upgradeLegacyPasswordHashes() {
    const users = await this.prisma.user.findMany({
      select: { id: true, passwordHash: true },
    })
    for (const u of users) {
      if (this.isBcryptHash(u.passwordHash)) continue
      await this.prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: await this.hashPassword(u.passwordHash) },
      })
    }
  }
}
