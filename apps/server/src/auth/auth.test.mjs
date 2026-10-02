import assert from 'node:assert/strict'
import { timingSafeEqual } from 'node:crypto'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import { verifyCredentials } from './password.ts'
import { checkRateLimit, cleanupRateLimits } from './rateLimit.ts'
import { createSession, getSession, deleteSession, cleanupSessions } from './session.ts'

// Node does not have Workers' native Web Crypto extension. Use its native
// constant-time primitive while exercising the production digest path.
Object.defineProperty(crypto.subtle, 'timingSafeEqual', { value: timingSafeEqual })

const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
const authSchema = readFileSync(new URL('../db/auth-schema.sql', import.meta.url), 'utf8')

function asD1(sqlite) {
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      return {
        bind(...values) {
          return {
            async first() { return statement.get(...values) ?? null },
            async run() { statement.run(...values); return { success: true } },
          }
        },
      }
    },
  }
}

function memoryDb(t) {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(schema + authSchema)
  t.after(() => sqlite.close())
  return { sqlite, db: asD1(sqlite) }
}

test('credentials compare both values, preserve boundaries, and have no empty-secret fallback', async () => {
  const email = 'test-admin@example.invalid'
  const password = 'only-a-test-密码-🔑'
  assert.equal(await verifyCredentials(email, password, email, password), true)
  assert.equal(await verifyCredentials(email, password + 'x', email, password), false)
  assert.equal(await verifyCredentials('other@example.invalid', password, email, password), false)
  assert.equal(await verifyCredentials('ab', 'c', 'a', 'bc'), false)
  assert.equal(await verifyCredentials(email, '', email, ''), false)
  assert.equal(await verifyCredentials('', password, '', password), false)
})

test('one atomic D1 statement admits exactly 10 attempts across connections and process restarts', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'promptnest-auth-test-'))
  const filename = join(directory, 'test.sqlite')
  const first = new DatabaseSync(filename)
  first.exec(schema + authSchema)
  const second = new DatabaseSync(filename)
  t.after(() => {
    first.close()
    second.close()
    rmSync(directory, { recursive: true, force: true })
  })
  const connections = [asD1(first), asD1(second)]
  const results = await Promise.all(Array.from({ length: 30 }, (_, i) =>
    checkRateLimit(connections[i % 2], '192.0.2.1', 120_000),
  ))
  assert.equal(results.filter(Boolean).length, 10)
  assert.equal(first.prepare('SELECT attempts FROM login_attempts').get().attempts, 11)
  const restarted = new DatabaseSync(filename)
  try {
    assert.equal(await checkRateLimit(asD1(restarted), '192.0.2.1', 179_999), false)
  } finally {
    restarted.close()
  }
  assert.equal(await checkRateLimit(connections[0], '192.0.2.2', 179_999), true)
  assert.equal(await checkRateLimit(connections[0], '192.0.2.1', 180_000), true)
  assert.equal(await checkRateLimit(connections[0], '192.0.2.1', 120_000), true)
  const row = first.prepare('SELECT * FROM login_attempts WHERE clientIp = ?').get('192.0.2.1')
  assert.equal(row.windowStart, 180_000, 'late attempts must not reopen an older window')
  assert.equal(row.attempts, 2)
})

test('sessions persist, expire, revoke, and are cleaned without a timer', async (t) => {
  const { sqlite, db } = memoryDb(t)
  const token = await createSession(db, 'test-admin@example.invalid')
  assert.match(token, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  assert.equal((await getSession(db, token)).email, 'test-admin@example.invalid')
  const row = sqlite.prepare('SELECT * FROM sessions WHERE id = ?').get(token)
  assert.equal(Date.parse(row.expiresAt) - Date.parse(row.createdAt), 7 * 24 * 60 * 60 * 1000)
  assert.equal(await getSession(db, 'unknown-token'), null)
  await deleteSession(db, token)
  assert.equal(await getSession(db, token), null)

  const active = await createSession(db, 'test-admin@example.invalid')
  sqlite.prepare('INSERT INTO sessions (id, email, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
    .run('expired', 'test-admin@example.invalid', '2000-01-01T00:00:00.000Z', '2000-01-02T00:00:00.000Z')
  assert.equal(await getSession(db, 'expired'), null)
  await cleanupSessions(db)
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM sessions').get().count, 1)
  assert.equal((await getSession(db, active)).email, 'test-admin@example.invalid')
})

test('rate-limit cleanup retains the active window', async (t) => {
  const { sqlite, db } = memoryDb(t)
  await checkRateLimit(db, '192.0.2.1', 0)
  await checkRateLimit(db, '192.0.2.2')
  await cleanupRateLimits(db)
  const rows = sqlite.prepare('SELECT clientIp FROM login_attempts').all()
  assert.deepEqual(rows.map(row => row.clientIp), ['192.0.2.2'])
})
