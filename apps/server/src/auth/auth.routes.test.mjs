import assert from 'node:assert/strict'
import { timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import auth from '../routes/auth.ts'

Object.defineProperty(crypto.subtle, 'timingSafeEqual', { value: timingSafeEqual })
const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
const authSchema = readFileSync(new URL('../db/auth-schema.sql', import.meta.url), 'utf8')

function setup(t) {
  t.mock.method(Date, 'now', () => 1_800_000)
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(schema + authSchema)
  t.after(() => sqlite.close())
  const env = {
    ADMIN_EMAIL: 'test-admin@example.invalid',
    ADMIN_PASSWORD: 'only-a-test-password',
    DB: {
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
    },
  }
  function login({ body, ip = '192.0.2.1', forwardedFor } = {}) {
    const headers = new Headers({ 'content-type': 'application/json' })
    if (ip) headers.set('CF-Connecting-IP', ip)
    if (forwardedFor) headers.set('X-Forwarded-For', forwardedFor)
    return auth.request('/login', {
      method: 'POST', headers,
      body: body ?? JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
    }, env)
  }
  return { sqlite, env, login }
}

test('login, /me, and logout preserve bearer-token behavior', async (t) => {
  const { env, login } = setup(t)
  assert.equal((await auth.request('/me', {}, env)).status, 401)
  const loggedIn = await login()
  assert.equal(loggedIn.status, 200)
  const token = (await loggedIn.json()).data.token
  const headers = { Authorization: `Bearer ${token}` }
  const me = await auth.request('/me', { headers }, env)
  assert.deepEqual(await me.json(), { success: true, data: { email: env.ADMIN_EMAIL } })
  assert.equal((await auth.request('/logout', { method: 'POST', headers }, env)).status, 200)
  assert.equal((await auth.request('/me', { headers }, env)).status, 401)
})

test('the 11th attempt is rejected before parsing or comparing valid credentials', async (t) => {
  const { env, login } = setup(t)
  const digest = crypto.subtle.digest.bind(crypto.subtle)
  let digestCalls = 0
  t.mock.method(crypto.subtle, 'digest', (...args) => {
    digestCalls++
    return digest(...args)
  })
  for (let i = 0; i < 10; i++) {
    const response = await login({ body: JSON.stringify({ email: env.ADMIN_EMAIL, password: 'wrong' }) })
    assert.equal(response.status, 401)
  }
  assert.equal(digestCalls, 20)
  assert.equal((await login({ body: '{' })).status, 429)
  assert.equal((await login()).status, 429)
  assert.equal(digestCalls, 20, 'blocked requests must not hash credentials')
  assert.equal((await login({ ip: '192.0.2.2' })).status, 200)
})

test('forwarding headers cannot bypass the shared fallback IP bucket', async (t) => {
  const { env, login } = setup(t)
  for (let i = 0; i < 10; i++) {
    const response = await login({
      ip: null, forwardedFor: `198.51.100.${i}`,
      body: JSON.stringify({ email: env.ADMIN_EMAIL, password: 'wrong' }),
    })
    assert.equal(response.status, 401)
  }
  assert.equal((await login({ ip: null, forwardedFor: '198.51.100.200' })).status, 429)
})

test('malformed and oversized bodies fail cleanly, and missing secrets never use defaults', async (t) => {
  const { env, login } = setup(t)
  assert.equal((await login({ body: '{' })).status, 400)
  assert.equal((await login({ body: JSON.stringify({ email: 'invalid', password: '' }) })).status, 400)
  assert.equal((await login({ body: 'x'.repeat(8 * 1024 + 1) })).status, 413)
  env.ADMIN_PASSWORD = ''
  const response = await login({ body: JSON.stringify({ email: 'admin@example.com', password: 'admin' }) })
  assert.equal(response.status, 503)
  assert.equal((await response.json()).error.code, 'AUTH_NOT_CONFIGURED')
})
