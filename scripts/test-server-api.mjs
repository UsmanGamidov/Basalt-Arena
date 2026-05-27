import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const PORT = Number(process.env.BASALT_API_TEST_PORT ?? 39002)
const BASE = `http://127.0.0.1:${PORT}/api/mock/v1`
const START_TIMEOUT_MS = 45000
const POLL_INTERVAL_MS = 300

function createEnv(overrides) {
  const merged = {
    ...process.env,
    ...overrides,
  }
  const clean = {}
  for (const [k, v] of Object.entries(merged)) {
    if (v == null) continue
    clean[k] = String(v)
  }
  return clean
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function spawnCapture(command, args, env, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      cwd,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += String(d)
    })
    child.stderr.on('data', (d) => {
      stderr += String(d)
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(
          new Error(
            `Command failed (${command} ${args.join(' ')}), code=${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
          ),
        )
      }
    })
  })
}

async function waitForHealth(url) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const text = await res.text()
        if (text.toLowerCase().includes('ok')) return true
      }
    } catch {
      // still booting
    }
    await sleep(POLL_INTERVAL_MS)
  }
  return false
}

async function requestJson(path, { method = 'GET', token, body } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

async function requestJsonWithHeaders(path, { method = 'GET', token, body, headers = {} } = {}) {
  const allHeaders = { ...headers, 'content-type': 'application/json' }
  if (token) allHeaders.authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function toIntDigits(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), 'basalt-api-test-'))
  const dbPath = join(tempDir, 'test.db')
  const dbUrl = `file:${dbPath.replace(/\\/g, '/')}`

  const env = createEnv({
    DATABASE_URL: dbUrl,
    JWT_SECRET: 'test-jwt-secret',
    BASALT_DEV_REGISTER_KEY: 'dev-register-key',
    BASALT_BOOTSTRAP_ADMIN_HANDLE: 'admin',
    BASALT_BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
    BASALT_BOOTSTRAP_ADMIN_PASSWORD: 'admin1234',
    BASALT_BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Admin',
  })

  await spawnCapture(npmCommand(), ['run', 'prisma:push', '-w', 'server'], env)
  await spawnCapture(npmCommand(), ['run', 'bootstrap:admin', '-w', 'server'], env)

  const server = spawn(process.execPath, ['server/dist/main.js'], {
    env: createEnv({
      ...env,
      PORT: String(PORT),
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  let exitCode = null
  server.stdout.on('data', (d) => {
    stdout += String(d)
  })
  server.stderr.on('data', (d) => {
    stderr += String(d)
  })
  server.once('exit', (code) => {
    exitCode = code ?? 0
  })

  try {
    const healthOk = await waitForHealth(`http://127.0.0.1:${PORT}/health`)
    if (!healthOk) {
      throw new Error(
        `Server did not become healthy\nexitCode=${exitCode}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
      )
    }

    const anonAdmin = await requestJson('/admin/users')
    assert(anonAdmin.status === 401, `Expected 401 for anonymous admin endpoint, got ${anonAdmin.status}`)

    const badRegister = await requestJson('/auth/register', {
      method: 'POST',
      body: {
        handle: 'nouser',
        email: 'nouser@example.com',
        password: 'user1234',
      },
    })
    assert(badRegister.status === 401, `Expected 401 for register without dev key, got ${badRegister.status}`)

    const registerUser = await requestJsonWithHeaders('/auth/register', {
      method: 'POST',
      headers: { 'x-dev-register-key': 'dev-register-key' },
      body: {
        handle: 'reguser',
        email: 'reguser@example.com',
        password: 'user1234',
      },
    })
    assert(registerUser.status === 201, `Register with dev key failed: ${registerUser.status}`)
    const regToken = registerUser.data?.accessToken
    assert(typeof regToken === 'string' && regToken.length > 20, 'Missing token from register')

    const badLogin = await requestJson('/auth/login', {
      method: 'POST',
      body: { loginOrEmail: 'reguser@example.com', password: 'wrong-pass' },
    })
    assert(badLogin.status === 401, `Expected 401 on bad login, got ${badLogin.status}`)

    const adminLogin = await requestJson('/auth/login', {
      method: 'POST',
      body: { loginOrEmail: 'admin@example.com', password: 'admin1234' },
    })
    assert(adminLogin.status === 201, `Admin login failed with status ${adminLogin.status}`)
    const adminToken = adminLogin.data?.accessToken
    assert(typeof adminToken === 'string' && adminToken.length > 20, 'Missing admin accessToken')
    const adminId = adminLogin.data?.user?.id
    assert(typeof adminId === 'string', 'Missing admin id')

    const anonMe = await requestJson('/v2/me')
    assert(anonMe.status === 401, `Expected 401 for anonymous /v2/me, got ${anonMe.status}`)

    const regMe = await requestJson('/v2/me', { token: regToken })
    assert(regMe.status === 200, `Registered user /v2/me failed: ${regMe.status}`)

    const patchProfile = await requestJson('/v2/me/profile', {
      method: 'PATCH',
      token: regToken,
      body: {
        form: {
          username: 'reguser2',
          email: 'reguser2@example.com',
          telegram: '@reguser2',
          about: 'about from integration test',
        },
      },
    })
    assert(patchProfile.status === 200, `Patch profile failed: ${patchProfile.status}`)

    const regMeAfterPatch = await requestJson('/v2/me', { token: regToken })
    assert(regMeAfterPatch.status === 200, `Get /v2/me after profile patch failed: ${regMeAfterPatch.status}`)
    assert(
      regMeAfterPatch.data?.user?.profile?.form?.username === 'reguser2',
      'Username patch not reflected in /v2/me',
    )

    const createUser = await requestJson('/admin/users', {
      method: 'POST',
      token: adminToken,
      body: {
        handle: 'user1',
        email: 'user1@example.com',
        password: 'user1234',
        displayName: 'User One',
      },
    })
    assert(createUser.status === 201, `Admin create user failed: ${createUser.status}`)
    const userId = createUser.data?.user?.id
    assert(typeof userId === 'string', 'Missing created user id')

    const listUsers = await requestJson('/admin/users', { token: adminToken })
    assert(listUsers.status === 200, `Admin list users failed: ${listUsers.status}`)
    assert(
      Array.isArray(listUsers.data?.users) && listUsers.data.users.some((u) => u.id === userId),
      'Created user missing in users list',
    )

    const updateUser = await requestJson(`/admin/users/${userId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        displayName: 'User One Patched',
        password: 'user5678',
      },
    })
    assert(updateUser.status === 200, `Admin patch user failed: ${updateUser.status}`)

    const userLogin = await requestJson('/auth/login', {
      method: 'POST',
      body: { loginOrEmail: 'user1@example.com', password: 'user5678' },
    })
    assert(userLogin.status === 201, `User login failed: ${userLogin.status}`)
    const userToken = userLogin.data?.accessToken
    assert(typeof userToken === 'string' && userToken.length > 20, 'Missing user accessToken')

    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const createSprint = await requestJson('/admin/sprints', {
      method: 'POST',
      token: adminToken,
      body: {
        id: 'S-IT-1',
        tabLabel: 'S-IT-1',
        title: 'S-IT-1',
        published: true,
        isMainActive: true,
        endsAt,
        prizeMoney: 5000,
        tags: [],
        brief: {},
      },
    })
    assert(createSprint.status === 201, `Admin create sprint failed: ${createSprint.status}`)

    const enroll = await requestJson('/admin/sprints/S-IT-1/participants', {
      method: 'POST',
      token: adminToken,
      body: { userIds: [userId, regMeAfterPatch.data?.user?.id] },
    })
    assert(enroll.status === 201, `Enroll user failed: ${enroll.status}`)

    const participants = await requestJson('/admin/sprints/S-IT-1/participants', { token: adminToken })
    assert(participants.status === 200, `List participants failed: ${participants.status}`)
    assert(
      Array.isArray(participants.data?.enrollments) && participants.data.enrollments.length >= 2,
      'Expected at least 2 participants in sprint',
    )

    const removeParticipant = await requestJson(
      `/admin/sprints/S-IT-1/participants/${regMeAfterPatch.data?.user?.id}`,
      {
        method: 'DELETE',
        token: adminToken,
      },
    )
    assert(removeParticipant.status === 200, `Remove participant failed: ${removeParticipant.status}`)

    const addBackParticipant = await requestJson('/admin/sprints/S-IT-1/participants', {
      method: 'POST',
      token: adminToken,
      body: { userIds: [regMeAfterPatch.data?.user?.id] },
    })
    assert(addBackParticipant.status === 201, `Re-add participant failed: ${addBackParticipant.status}`)

    const createAchDefinition = await requestJson('/admin/achievements/definitions', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Top performer',
        subtitle: 'Integration test badge',
        icon: 'star',
        variant: 'earned',
      },
    })
    assert(
      createAchDefinition.status === 201,
      `Create achievement definition failed: ${createAchDefinition.status}`,
    )
    const definitionId = createAchDefinition.data?.definition?.id
    assert(typeof definitionId === 'string', 'Missing achievement definition id')

    const updateAchDefinition = await requestJson(`/admin/achievements/definitions/${definitionId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        title: 'Top performer updated',
        subtitle: 'Updated subtitle',
      },
    })
    assert(updateAchDefinition.status === 200, `Update achievement definition failed: ${updateAchDefinition.status}`)

    const grantAchievement = await requestJson('/admin/achievements/grant', {
      method: 'POST',
      token: adminToken,
      body: {
        definitionId,
        userIds: [userId, regMeAfterPatch.data?.user?.id],
      },
    })
    assert(grantAchievement.status === 201, `Grant achievement failed: ${grantAchievement.status}`)
    assert(Number(grantAchievement.data?.granted ?? 0) >= 2, 'Expected granted>=2 on achievement grant')

    const listAchievements = await requestJson('/admin/achievements', {
      token: adminToken,
    })
    assert(listAchievements.status === 200, `List achievements failed: ${listAchievements.status}`)
    const grantedAchievement = Array.isArray(listAchievements.data?.achievements)
      ? listAchievements.data.achievements.find((a) => a.userId === userId && a.definitionId === definitionId)
      : null
    assert(grantedAchievement?.id, 'Expected granted achievement to be listed')

    const revokeAchievement = await requestJson(`/admin/achievements/${grantedAchievement.id}`, {
      method: 'DELETE',
      token: adminToken,
    })
    assert(revokeAchievement.status === 200, `Revoke achievement failed: ${revokeAchievement.status}`)

    const createSubmission = await requestJson('/v2/submissions', {
      method: 'POST',
      token: userToken,
      body: {
        repoUrl: 'https://github.com/example/repo',
        demoUrl: 'https://example.com/demo',
      },
    })
    assert(createSubmission.status === 201, `Create submission failed: ${createSubmission.status}`)
    const submissionId = createSubmission.data?.id
    assert(typeof submissionId === 'string', 'Missing submission id')

    const activeSubmission = await requestJson('/v2/sprints/S-IT-1/submissions/active', { token: userToken })
    assert(activeSubmission.status === 200, `Active submission endpoint failed: ${activeSubmission.status}`)
    assert(activeSubmission.data?.submission?.id === submissionId, 'Active submission id mismatch')

    const reviewSubmission = await requestJson(`/admin/submissions/${submissionId}/review`, {
      method: 'POST',
      token: adminToken,
      body: { action: 'approve', mentorScore: 88, reviewNote: 'ok' },
    })
    assert(reviewSubmission.status === 201, `Review submission failed: ${reviewSubmission.status}`)

    const duplicateSubmission = await requestJson('/v2/submissions', {
      method: 'POST',
      token: userToken,
      body: { repoUrl: 'https://github.com/example/repo2' },
    })
    assert(
      duplicateSubmission.status === 409,
      `Expected 409 for duplicate submission, got ${duplicateSubmission.status}`,
    )

    const me = await requestJson('/v2/me', { token: userToken })
    assert(me.status === 200, `GET /v2/me failed: ${me.status}`)
    const historyItems = me.data?.user?.sprintHistory?.items
    assert(Array.isArray(historyItems) && historyItems.length > 0, 'Expected non-empty sprintHistory')
    assert(
      historyItems.some((x) => x.id === submissionId && x.status === 'approved'),
      'Expected approved submission in sprintHistory',
    )

    const createSprint2 = await requestJson('/admin/sprints', {
      method: 'POST',
      token: adminToken,
      body: {
        id: 'S-IT-2',
        tabLabel: 'S-IT-2',
        title: 'S-IT-2',
        published: true,
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        prizeMoney: 0,
        tags: [],
        brief: {},
      },
    })
    assert(createSprint2.status === 201, `Admin create second sprint failed: ${createSprint2.status}`)

    const createManualSolution = await requestJson('/admin/sprints/S-IT-2/solutions', {
      method: 'POST',
      token: adminToken,
      body: {
        userId,
        mentorScore: 77,
        codeUrl: 'https://github.com/example/manual-solution',
      },
    })
    assert(createManualSolution.status === 201, `Manual solution create failed: ${createManualSolution.status}`)
    const solutionId = createManualSolution.data?.solution?.id
    assert(typeof solutionId === 'string', 'Missing manual solution id')

    const updateManualSolution = await requestJson(`/admin/solutions/${solutionId}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        mentorScore: 79,
      },
    })
    assert(updateManualSolution.status === 200, `Manual solution update failed: ${updateManualSolution.status}`)

    const deleteManualSolution = await requestJson(`/admin/solutions/${solutionId}`, {
      method: 'DELETE',
      token: adminToken,
    })
    assert(deleteManualSolution.status === 200, `Manual solution delete failed: ${deleteManualSolution.status}`)

    const closeSprint = await requestJson('/admin/sprints/S-IT-1', {
      method: 'PATCH',
      token: adminToken,
      body: {
        endsAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    })
    assert(closeSprint.status === 200, `Close sprint failed: ${closeSprint.status}`)

    const meAfterClose = await requestJson('/v2/me', { token: userToken })
    assert(meAfterClose.status === 200, `GET /v2/me after close failed: ${meAfterClose.status}`)
    const moneyEarned = meAfterClose.data?.user?.stats?.moneyEarned
    assert(toIntDigits(moneyEarned) >= 5000, `Expected moneyEarned >= 5000, got "${moneyEarned}"`)

    const adminSubmissions = await requestJson('/admin/submissions?limit=50', { token: adminToken })
    assert(adminSubmissions.status === 200, `Admin submissions list failed: ${adminSubmissions.status}`)
    assert(
      Number(adminSubmissions.data?.total ?? 0) >= 1,
      'Expected at least one submission in admin submissions list',
    )

    const adminLogs = await requestJson('/admin/logs?limit=50', { token: adminToken })
    assert(adminLogs.status === 200, `Admin logs list failed: ${adminLogs.status}`)
    assert(Array.isArray(adminLogs.data?.logs), 'Expected logs array')

    const deleteSelfAdmin = await requestJson(`/admin/users/${adminId}`, {
      method: 'DELETE',
      token: adminToken,
    })
    assert(deleteSelfAdmin.status === 400, `Expected 400 when deleting self admin, got ${deleteSelfAdmin.status}`)

    console.log('Server API integration test passed (full critical flow)')
  } finally {
    server.kill('SIGTERM')
    await Promise.race([
      new Promise((resolve) => server.once('exit', resolve)),
      sleep(3000),
    ])
    await rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
