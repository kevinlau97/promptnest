import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success, error } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'

const app = new Hono<AppEnv>()

// JSON table inputs avoid D1's 100-bound-parameter limit and keep large restores
// within the Free plan's 50 queries per request, including authentication.
const MAX_JSON_BYTES = 1_800_000
const MAX_BATCH_QUERIES = 40
const encoder = new TextEncoder()

export class InvalidBatchError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
  }
}

export function batchError(cause: unknown) {
  if (cause instanceof InvalidBatchError) {
    return error(cause.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST', cause.message, cause.status)
  }
  throw cause
}

export function validateItems(items: unknown): asserts items is Record<string, unknown>[] {
  if (!Array.isArray(items) || items.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new InvalidBatchError('items must be an array of records')
  }
}

export function validateValues(values: unknown[]) {
  if (values.some((value) => value !== null && typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value)))) {
    throw new InvalidBatchError('Record fields must contain valid strings or numbers')
  }
  return values
}

export function prepareJsonBatch(db: D1Database, sql: string, values: unknown[], bindings: (string | number | null)[] = []) {
  const statements: D1PreparedStatement[] = []
  let rows: string[] = []
  let bytes = 2
  const flush = () => {
    if (!rows.length) return
    if (statements.length >= MAX_BATCH_QUERIES) {
      throw new InvalidBatchError('Batch is too large; send it in smaller requests', 413)
    }
    statements.push(db.prepare(sql).bind(...bindings, `[${rows.join(',')}]`))
    rows = []
    bytes = 2
  }
  for (const value of values) {
    const row = JSON.stringify(value)
    const rowBytes = encoder.encode(row).byteLength
    if (rowBytes + 2 > MAX_JSON_BYTES) {
      throw new InvalidBatchError('A record exceeds the database size limit', 413)
    }
    if (bytes + rowBytes + (rows.length ? 1 : 0) > MAX_JSON_BYTES) flush()
    bytes += rowBytes + (rows.length ? 1 : 0)
    rows.push(row)
  }
  flush()
  return statements
}

export async function runBatch(db: D1Database, statements: D1PreparedStatement[]) {
  if (statements.length > MAX_BATCH_QUERIES) {
    throw new InvalidBatchError('Batch is too large; send it in smaller requests', 413)
  }
  if (statements.length) await db.batch(statements)
}

export function preparePromptUpserts(db: D1Database, items: unknown) {
  validateItems(items)
  const rows = items.map((item) => validateValues([
    item.id, item.title, item.content, item.description || null, item.type, item.folderId || null,
    JSON.stringify(item.tags || []), JSON.stringify(item.links || []), JSON.stringify(item.variables || []), JSON.stringify(item.images || []),
    item.isFavorite ? 1 : 0, item.isArchived ? 1 : 0, item.visibility || 'private', item.shareSlug || null,
    item.sourceUrl || null, item.sourceTitle || null, item.createdAt, item.updatedAt,
    item.deletedAt || null, item.lastUsedAt || null, item.useCount || 0, item.version || 1,
  ]))
  return prepareJsonBatch(db,
    `INSERT INTO prompts (id, title, content, description, type, folderId, tags, links, variables, images, isFavorite, isArchived, visibility, shareSlug, sourceUrl, sourceTitle, createdAt, updatedAt, deletedAt, lastUsedAt, useCount, version)
     SELECT ${Array.from({ length: 22 }, (_, index) => `json_extract(value, '$[${index}]')`).join(', ')}
     FROM json_each(?) WHERE true
     ON CONFLICT(id) DO UPDATE SET
     title=excluded.title, content=excluded.content, description=excluded.description, type=excluded.type, folderId=excluded.folderId,
     tags=excluded.tags, links=excluded.links, variables=excluded.variables, images=excluded.images, isFavorite=excluded.isFavorite, isArchived=excluded.isArchived,
     visibility=excluded.visibility, shareSlug=excluded.shareSlug, sourceUrl=excluded.sourceUrl, sourceTitle=excluded.sourceTitle,
     updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, lastUsedAt=excluded.lastUsedAt, useCount=excluded.useCount, version=excluded.version`,
    rows,
  )
}

export function prepareDeletes(db: D1Database, table: 'prompts' | 'folders', ids: unknown) {
  if (!Array.isArray(ids)) throw new InvalidBatchError('ids must be an array')
  validateValues(ids)
  return prepareJsonBatch(db, `UPDATE ${table} SET deletedAt = ? WHERE id IN (SELECT value FROM json_each(?))`, ids, [new Date().toISOString()])
}

app.get('/', requireAuth, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM prompts WHERE deletedAt IS NULL').all()
  return success(rows.results)
})

app.post('/batch-upsert', requireAuth, async (c) => {
  const body = await c.req.json()
  try {
    await runBatch(c.env.DB, preparePromptUpserts(c.env.DB, body.items || []))
    return success()
  } catch (cause) {
    return batchError(cause)
  }
})

app.post('/batch-delete', requireAuth, async (c) => {
  const body = await c.req.json()
  try {
    await runBatch(c.env.DB, prepareDeletes(c.env.DB, 'prompts', body.ids || []))
    return success()
  } catch (cause) {
    return batchError(cause)
  }
})

export default app
