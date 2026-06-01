import assert from 'node:assert/strict'
import {
  formatMoneyRub,
  normalizeMoneyRub,
  parseLegacyMoneyEarned,
} from '../server/dist/common/utils/money.util.js'

assert.equal(normalizeMoneyRub(12_500), 12_500)
assert.equal(normalizeMoneyRub(-5), 0)
assert.equal(parseLegacyMoneyEarned('12 500 ₽'), 12500)
assert.equal(parseLegacyMoneyEarned(3000), 3000)
const formatted = formatMoneyRub(5000)
assert.ok(formatted.includes('5'), `expected digit in ${formatted}`)
assert.ok(formatted.includes('₽'), `expected currency in ${formatted}`)

console.log('money.util tests passed')
