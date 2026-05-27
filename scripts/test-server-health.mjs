import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = Number(process.env.BASALT_HEALTH_TEST_PORT ?? 39001)
const HEALTH_URL = `http://127.0.0.1:${PORT}/health`
const START_TIMEOUT_MS = 45000
const POLL_INTERVAL_MS = 300

async function waitForHealth() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    try {
      const res = await fetch(HEALTH_URL, { method: 'GET' })
      if (res.ok) {
        const text = await res.text()
        if (text.toLowerCase().includes('ok')) return true
      }
    } catch {
      // server is still booting
    }
    await sleep(POLL_INTERVAL_MS)
  }
  return false
}

async function main() {
  const server = spawn(
    process.execPath,
    ['server/dist/main.js'],
    {
      env: {
        ...process.env,
        PORT: String(PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  let stdout = ''
  let stderr = ''
  server.stdout.on('data', (d) => {
    stdout += String(d)
  })
  server.stderr.on('data', (d) => {
    stderr += String(d)
  })

  let exitCode = null
  server.once('exit', (code) => {
    exitCode = code ?? 0
  })

  try {
    const ready = await waitForHealth()
    if (!ready) {
      const details = [`Health check timeout (${HEALTH_URL})`]
      if (exitCode !== null) details.push(`Server exited early with code: ${exitCode}`)
      if (stdout.trim()) details.push(`STDOUT:\n${stdout.trim()}`)
      if (stderr.trim()) details.push(`STDERR:\n${stderr.trim()}`)
      throw new Error(details.join('\n\n'))
    }
    console.log(`Server health OK: ${HEALTH_URL}`)
  } finally {
    server.kill('SIGTERM')
    await Promise.race([
      new Promise((resolve) => server.once('exit', resolve)),
      sleep(3000),
    ])
  }

  if (stderr.trim()) {
    console.log('Server stderr:')
    console.log(stderr.trim())
  }
  if (!stdout.includes('Server http://localhost')) {
    console.log('Server stdout:')
    console.log(stdout.trim())
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
