#!/usr/bin/env node
// Run only against a disposable local `wrangler dev --local` instance:
// TEST_ADMIN_EMAIL=test@example.com TEST_ADMIN_PASSWORD=local-test-password \
//   node scripts/test-worker.mjs http://localhost:3000
// The server must use matching ADMIN_EMAIL / ADMIN_PASSWORD bindings.
// Test records are soft-deleted afterward. Reset local Wrangler state to remove
// tombstones and the uploaded test image; the API has no hard-delete endpoint.
import assert from 'node:assert/strict'

const base = new URL(process.argv[2] || 'http://localhost:3000')
assert(
  ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
    && ['http:', 'https:'].includes(base.protocol)
    && base.pathname === '/' && !base.search && !base.hash
    && !base.username && !base.password,
  'Refusing to run: provide a loopback server origin, never a production URL',
)

const email = process.env.TEST_ADMIN_EMAIL || 'test@example.com'
const password = process.env.TEST_ADMIN_PASSWORD || 'local-test-password'
const prefix = `worker-test-${crypto.randomUUID()}`
const createdAt = new Date(Date.now() - 2_000).toISOString()
const updatedAt = new Date(Date.now() - 1_000).toISOString()
const since = new Date(Date.now() - 60_000).toISOString()
const images = [{ url: 'https://example.invalid/synthetic.png', filename: 'synthetic.png', type: 'image/png' }]
const folderId = `${prefix}-folder`
const prompts = Array.from({ length: 1_000 }, (_, index) => ({
  id: `${prefix}-prompt-${index}`,
  title: `Synthetic prompt ${index}`,
  content: 'Synthetic integration test content: Unicode 中文, quotes " and {{topic}}.',
  description: 'Created by the local Worker integration test',
  type: 'general',
  folderId: null,
  tags: ['integration', 'synthetic'],
  links: [{ id: 'synthetic-link', title: 'Synthetic source', url: 'https://example.invalid/source' }],
  variables: [{ id: 'synthetic-variable', name: 'topic', defaultValue: 'local test', description: 'Synthetic variable' }],
  images,
  isFavorite: index === 0,
  isArchived: false,
  visibility: 'private',
  shareSlug: null,
  sourceUrl: 'https://example.invalid/source',
  sourceTitle: 'Synthetic source',
  createdAt,
  updatedAt,
  deletedAt: null,
  lastUsedAt: null,
  useCount: 0,
  version: 1,
}))
const promptIds = prompts.map(({ id }) => id)
const folder = {
  id: folderId, name: 'Synthetic folder', parentId: null, level: 1,
  icon: '🧪', color: '#2463eb', sortOrder: 3,
  createdAt, updatedAt, deletedAt: null, version: 1,
}

let token = ''
let promptsNeedCleanup = false
let foldersNeedCleanup = false
let passed = 0

async function request(path, { method = 'GET', body, authenticated = true, status = 200 } = {}) {
  const headers = new Headers()
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`)
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }
  const response = await fetch(new URL(path, base), {
    method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30_000),
  })
  assert.equal(response.status, status, `${method} ${path}: unexpected HTTP status`)
  assert(response.headers.get('Content-Type')?.includes('application/json'), `${method} ${path}: expected JSON response`)
  const payload = await response.json()
  assert.equal(payload.success, status >= 200 && status < 300, `${method} ${path}: unexpected success flag`)
  return payload
}

async function step(name, test) {
  await test()
  passed++
  console.log(`PASS ${name}`)
}

async function cleanupRecords() {
  if (promptsNeedCleanup) {
    await request('/api/prompts/batch-delete', { method: 'POST', body: { ids: promptIds } })
    promptsNeedCleanup = false
  }
  if (foldersNeedCleanup) {
    await request('/api/folders/batch-delete', { method: 'POST', body: { ids: [folderId] } })
    foldersNeedCleanup = false
  }
}

try {
  await step('health and JSON 404', async () => {
    const health = await request('/api/health', { authenticated: false })
    assert.equal(health.data.status, 'ok')
    assert(Number.isFinite(Date.parse(health.data.timestamp)))
    const missing = await request('/api/integration-test-missing', { authenticated: false, status: 404 })
    assert.equal(missing.error.code, 'NOT_FOUND')
  })

  await step('protected read and invalid credentials', async () => {
    const protectedRead = await request('/api/prompts', { authenticated: false, status: 401 })
    assert.equal(protectedRead.error.code, 'UNAUTHORIZED')
    const login = await request('/api/auth/login', {
      method: 'POST', authenticated: false, status: 401,
      body: { email, password: `${password}-intentionally-wrong` },
    })
    assert.equal(login.error.code, 'INVALID_CREDENTIALS')
  })

  await step('login and authenticated identity', async () => {
    const login = await request('/api/auth/login', { method: 'POST', authenticated: false, body: { email, password } })
    assert.equal(typeof login.data.token, 'string')
    assert(login.data.token.length > 0, 'Login must return a session token')
    token = login.data.token
    const me = await request('/api/auth/me')
    assert.equal(me.data.email, email)
  })

  await step('1,000-prompt batch insert and raw field round trip', async () => {
    promptsNeedCleanup = true
    await request('/api/prompts/batch-upsert', { method: 'POST', body: { items: prompts } })
    const { data } = await request('/api/prompts')
    assert(Array.isArray(data), 'Prompt read must return an array')
    const inserted = data.filter((row) => row.id?.startsWith(`${prefix}-prompt-`))
    assert.equal(inserted.length, prompts.length)
    const first = inserted.find((row) => row.id === prompts[0].id)
    assert.equal(first.content, prompts[0].content)
    for (const field of ['tags', 'links', 'variables', 'images']) {
      assert.equal(typeof first[field], 'string', `${field} must preserve the database JSON string shape`)
      assert.deepEqual(JSON.parse(first[field]), prompts[0][field])
    }
    assert.equal(first.isFavorite, 1)
    assert.equal(first.isArchived, 0)
    assert.equal(first.version, 1)
  })

  await step('sync push and pull preserve images, folders, versions, and createdAt', async () => {
    const changed = {
      ...prompts[0], title: 'Synthetic prompt updated by sync', folderId,
      images: [...images, { url: 'https://example.invalid/synthetic-second.png', type: 'image/png' }],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 7,
    }
    foldersNeedCleanup = true
    await request('/api/sync/push', { method: 'POST', body: { prompts: [changed], folders: [folder] } })
    const { data } = await request(`/api/sync/pull?lastSyncAt=${encodeURIComponent(since)}`)
    assert(Array.isArray(data.prompts) && Array.isArray(data.folders))
    assert(Number.isFinite(Date.parse(data.syncAt)))
    const synced = data.prompts.find((row) => row.id === changed.id)
    assert(synced, 'Sync pull must contain the changed prompt')
    assert.equal(synced.title, changed.title)
    assert.equal(synced.folderId, folderId)
    assert.equal(synced.createdAt, createdAt, 'Upsert must preserve the original creation time')
    assert.equal(synced.version, 7, 'Upsert must preserve the incoming version')
    assert.deepEqual(JSON.parse(synced.images), changed.images)
    const syncedFolder = data.folders.find((row) => row.id === folderId)
    assert.equal(syncedFolder?.name, folder.name)
    assert.equal(syncedFolder?.level, 1)
    const future = new Date(Date.now() + 60_000).toISOString()
    const empty = await request(`/api/sync/pull?lastSyncAt=${encodeURIComponent(future)}`)
    assert(!empty.data.prompts.some((row) => row.id?.startsWith(prefix)), 'Sync cutoff must exclude older test prompts')
    assert(!empty.data.folders.some((row) => row.id === folderId), 'Sync cutoff must exclude older test folders')
  })

  await step('folder batch upsert and protected read', async () => {
    await request('/api/folders/batch-upsert', {
      method: 'POST', body: { items: [{ ...folder, name: 'Synthetic folder renamed', createdAt: new Date().toISOString(), version: 4 }] },
    })
    const { data } = await request('/api/folders')
    const updated = data.find((row) => row.id === folderId)
    assert.equal(updated?.name, 'Synthetic folder renamed')
    assert.equal(updated?.createdAt, createdAt)
    assert.equal(updated?.version, 4)
  })

  await step('invalid batch is rejected before any writes', async () => {
    const rejected = await request('/api/prompts/batch-upsert', {
      method: 'POST', status: 400,
      body: { items: [{ ...prompts[1], title: 'Must not be committed' }, { id: `${prefix}-invalid` }] },
    })
    assert.equal(rejected.error.code, 'INVALID_REQUEST')
    const { data } = await request('/api/prompts')
    assert.equal(data.find((row) => row.id === prompts[1].id)?.title, prompts[1].title)
  })

  await step('share create, public read, and cancel', async () => {
    const slug = `${prefix}-share`
    const shared = await request('/api/share/create', { method: 'POST', body: { id: prompts[0].id, slug } })
    assert.equal(shared.data.slug, slug)
    const publicRead = await request(`/api/share/${slug}`, { authenticated: false })
    assert.equal(publicRead.data.prompt.id, prompts[0].id)
    assert.equal(publicRead.data.prompt.visibility, 'shared')
    assert.equal(publicRead.data.prompt.isFavorite, true)
    assert.deepEqual(publicRead.data.prompt.tags, prompts[0].tags)
    assert.deepEqual(publicRead.data.prompt.links, prompts[0].links)
    assert.deepEqual(publicRead.data.prompt.variables, prompts[0].variables)
    await request('/api/share/cancel', { method: 'POST', body: { id: prompts[0].id } })
    const cancelled = await request(`/api/share/${slug}`, { authenticated: false, status: 404 })
    assert.equal(cancelled.error.code, 'NOT_FOUND')
  })

  await step('tiny PNG upload to local R2', async () => {
    const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII='), (character) => character.charCodeAt(0))
    const form = new FormData()
    form.append('file', new Blob([png], { type: 'image/png' }), `${prefix}.png`)
    const uploaded = await request('/api/upload', { method: 'POST', body: form })
    assert.equal(typeof uploaded.data.url, 'string')
    const imageUrl = new URL(uploaded.data.url)
    assert(['http:', 'https:'].includes(imageUrl.protocol))
    assert(imageUrl.pathname.endsWith(`-${prefix}.png`), 'Upload must return the generated image URL')
    // Do not fetch this URL: the configured public R2 domain may be remote.
  })

  await step('batch soft-deletes hide prompts and folders', async () => {
    await cleanupRecords()
    const promptResult = await request('/api/prompts')
    assert(!promptResult.data.some((row) => row.id?.startsWith(prefix)), 'Deleted test prompts must be absent from active reads')
    const folderResult = await request('/api/folders')
    assert(!folderResult.data.some((row) => row.id === folderId), 'Deleted test folders must be absent from active reads')
  })

  await step('logout invalidates the session', async () => {
    await request('/api/auth/logout', { method: 'POST' })
    const loggedOut = await request('/api/auth/me', { status: 401 })
    assert.equal(loggedOut.error.code, 'UNAUTHORIZED')
    token = ''
  })

  console.log(`Passed ${passed} local Worker integration checks.`)
  console.log('Manual verification: browser SPA/navigation; production bindings/secrets; public R2 image bytes and cache headers; scheduled cleanup and rate limiting across Worker instances.')
  console.log('The uploaded image and soft-delete tombstones remain only in local Wrangler state.')
} catch (cause) {
  process.exitCode = 1
  console.error(`FAIL after ${passed} checks: ${cause instanceof Error ? cause.message : String(cause)}`)
} finally {
  if (token) {
    try {
      await cleanupRecords()
      await request('/api/auth/logout', { method: 'POST' })
    } catch (cause) {
      process.exitCode = 1
      console.error(`Local test cleanup failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }
}
