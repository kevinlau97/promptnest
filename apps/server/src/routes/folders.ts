import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'
import { batchError, prepareDeletes, prepareJsonBatch, runBatch, validateItems, validateValues } from './prompts.js'

const app = new Hono<AppEnv>()

export function prepareFolderUpserts(db: D1Database, items: unknown) {
  validateItems(items)
  const rows = items.map((item) => validateValues([
    item.id, item.name, item.parentId || null, item.level, item.icon || null, item.color || null,
    item.sortOrder || 0, item.createdAt, item.updatedAt, item.deletedAt || null, item.version || 1,
  ]))
  return prepareJsonBatch(db,
    `INSERT INTO folders (id, name, parentId, level, icon, color, sortOrder, createdAt, updatedAt, deletedAt, version)
     SELECT ${Array.from({ length: 11 }, (_, index) => `json_extract(value, '$[${index}]')`).join(', ')}
     FROM json_each(?) WHERE true
     ON CONFLICT(id) DO UPDATE SET
     name=excluded.name, parentId=excluded.parentId, level=excluded.level, icon=excluded.icon, color=excluded.color,
     sortOrder=excluded.sortOrder, updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, version=excluded.version`,
    rows,
  )
}

app.get('/', requireAuth, async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM folders WHERE deletedAt IS NULL').all()
  return success(rows.results)
})

app.post('/batch-upsert', requireAuth, async (c) => {
  const body = await c.req.json()
  try {
    await runBatch(c.env.DB, prepareFolderUpserts(c.env.DB, body.items || []))
    return success()
  } catch (cause) {
    return batchError(cause)
  }
})

app.post('/batch-delete', requireAuth, async (c) => {
  const body = await c.req.json()
  try {
    await runBatch(c.env.DB, prepareDeletes(c.env.DB, 'folders', body.ids || []))
    return success()
  } catch (cause) {
    return batchError(cause)
  }
})

export default app
