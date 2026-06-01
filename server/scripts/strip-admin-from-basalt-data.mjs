import fs from 'node:fs'
import path from 'node:path'

const file = path.join(import.meta.dirname, '../src/basalt-data.service.ts')
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
const start = lines.findIndex((l) => l.includes('async adminCreateUser('))
const end = lines.findIndex((l, i) => i > start && l.includes('private toPublicUser('))
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`)
const next = [...lines.slice(0, start), ...lines.slice(end)]
fs.writeFileSync(file, next.join('\n'))
console.log('Removed lines', start, '-', end, 'new length', next.length)
