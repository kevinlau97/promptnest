import { Hono } from 'hono'
import { db } from '../db/index'
import { success } from '../utils/response'
import { requireAuth } from '../auth/middleware'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.get('/', requireAuth, (c) => {
  const rows = db.prepare('SELECT * FROM prompts WHERE deletedAt IS NULL').all()
  return success(rows)
})

app.post('/batch-upsert', requireAuth, async (c) => {
  const body = await c.req.json()
  const items = body.items || []
  const stmt = db.prepare(
    `INSERT INTO prompts (id, title, content, description, type, folderId, tags, links, variables, isFavorite, isArchived, visibility, shareSlug, sourceUrl, sourceTitle, createdAt, updatedAt, deletedAt, lastUsedAt, useCount, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
     title=excluded.title, content=excluded.content, description=excluded.description, type=excluded.type, folderId=excluded.folderId,
     tags=excluded.tags, links=excluded.links, variables=excluded.variables, isFavorite=excluded.isFavorite, isArchived=excluded.isArchived,
     visibility=excluded.visibility, shareSlug=excluded.shareSlug, sourceUrl=excluded.sourceUrl, sourceTitle=excluded.sourceTitle,
     updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, lastUsedAt=excluded.lastUsedAt, useCount=excluded.useCount, version=excluded.version`
  )
  for (const item of items) {
    stmt.run(
      item.id, item.title, item.content, item.description || null, item.type, item.folderId || null,
      JSON.stringify(item.tags || []), JSON.stringify(item.links || []), JSON.stringify(item.variables || []),
      item.isFavorite ? 1 : 0, item.isArchived ? 1 : 0, item.visibility || 'private', item.shareSlug || null,
      item.sourceUrl || null, item.sourceTitle || null, item.createdAt, item.updatedAt,
      item.deletedAt || null, item.lastUsedAt || null, item.useCount || 0, item.version || 1
    )
  }
  return success()
})

app.post('/batch-delete', requireAuth, async (c) => {
  const body = await c.req.json()
  const ids = body.ids || []
  const stmt = db.prepare('UPDATE prompts SET deletedAt = ? WHERE id = ?')
  for (const id of ids) {
    stmt.run(new Date().toISOString(), id)
  }
  return success()
})

export default app
