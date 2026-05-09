import { Hono } from 'hono'
import { db } from '../db/index'
import { success } from '../utils/response'
import { requireAuth } from '../auth/middleware'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.get('/', requireAuth, (c) => {
  const rows = db.prepare('SELECT * FROM folders WHERE deletedAt IS NULL').all()
  return success(rows)
})

app.post('/batch-upsert', requireAuth, async (c) => {
  const body = await c.req.json()
  const items = body.items || []
  const stmt = db.prepare(
    `INSERT INTO folders (id, name, parentId, level, icon, color, sortOrder, createdAt, updatedAt, deletedAt, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
     name=excluded.name, parentId=excluded.parentId, level=excluded.level, icon=excluded.icon, color=excluded.color,
     sortOrder=excluded.sortOrder, updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, version=excluded.version`
  )
  for (const item of items) {
    stmt.run(
      item.id, item.name, item.parentId || null, item.level, item.icon || null, item.color || null,
      item.sortOrder || 0, item.createdAt, item.updatedAt, item.deletedAt || null, item.version || 1
    )
  }
  return success()
})

app.post('/batch-delete', requireAuth, async (c) => {
  const body = await c.req.json()
  const ids = body.ids || []
  const stmt = db.prepare('UPDATE folders SET deletedAt = ? WHERE id = ?')
  for (const id of ids) {
    stmt.run(new Date().toISOString(), id)
  }
  return success()
})

export default app
