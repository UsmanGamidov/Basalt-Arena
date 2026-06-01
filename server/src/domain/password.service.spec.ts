import * as bcrypt from 'bcrypt'
import { PasswordService } from './password.service'

describe('PasswordService', () => {
  const prisma = { user: { findMany: jest.fn(), update: jest.fn() } } as never
  const svc = new PasswordService(prisma)

  it('hashes new passwords with argon2id and verifies them', async () => {
    const hash = await svc.hashPassword('secret123')
    expect(svc.isArgon2Hash(hash)).toBe(true)
    expect(await svc.verifyPassword(hash, 'secret123')).toBe(true)
    expect(await svc.verifyPassword(hash, 'wrong-password')).toBe(false)
  })

  it('stays backward compatible with bcrypt hashes', async () => {
    const bcryptHash = await bcrypt.hash('legacy-pass', 10)
    expect(svc.isBcryptHash(bcryptHash)).toBe(true)
    expect(await svc.verifyPassword(bcryptHash, 'legacy-pass')).toBe(true)
    expect(await svc.verifyPassword(bcryptHash, 'nope')).toBe(false)
  })

  it('verifies legacy plaintext passwords', async () => {
    expect(await svc.verifyPassword('plain', 'plain')).toBe(true)
    expect(await svc.verifyPassword('plain', 'other')).toBe(false)
  })

  it('returns false for a malformed argon2 hash instead of throwing', async () => {
    expect(await svc.verifyPassword('$argon2id$broken', 'whatever')).toBe(false)
  })
})
