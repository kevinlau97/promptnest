import { Hono } from 'hono'
import { db } from '../db/index.js'
import { success } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.get('/pull', requireAuth, (c) => {
  const lastSyncAt = c.req.query('lastSyncAt') || '1970-01-01T00:00:00.000Z'
  const prompts = db.prepare('SELECT * FROM prompts WHERE updatedAt > ?').all(lastSyncAt)
  const folders = db.prepare('SELECT * FROM folders WHERE updatedAt > ?').all(lastSyncAt)
  return success({ prompts, folders, syncAt: new Date().toISOString() })
})

app.post('/push', requireAuth, async (c) => {
  const body = await c.req.json()

  const prompts = body.prompts || []
  if (prompts.length) {
    const stmt = db.prepare(
      `INSERT INTO prompts (id, title, content, description, type, folderId, tags, links, variables, isFavorite, isArchived, visibility, shareSlug, sourceUrl, sourceTitle, createdAt, updatedAt, deletedAt, lastUsedAt, useCount, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       title=excluded.title, content=excluded.content, description=excluded.description, type=excluded.type, folderId=excluded.folderId,
       tags=excluded.tags, links=excluded.links, variables=excluded.variables, isFavorite=excluded.isFavorite, isArchived=excluded.isArchived,
       visibility=excluded.visibility, shareSlug=excluded.shareSlug, sourceUrl=excluded.sourceUrl, sourceTitle=excluded.sourceTitle,
       updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, lastUsedAt=excluded.lastUsedAt, useCount=excluded.useCount, version=excluded.version`
    )
    for (const item of prompts) {
      stmt.run(
        item.id, item.title, item.content, item.description || null, item.type, item.folderId || null,
        JSON.stringify(item.tags || []), JSON.stringify(item.links || []), JSON.stringify(item.variables || []),
        item.isFavorite ? 1 : 0, item.isArchived ? 1 : 0, item.visibility || 'private', item.shareSlug || null,
        item.sourceUrl || null, item.sourceTitle || null, item.createdAt, item.updatedAt,
        item.deletedAt || null, item.lastUsedAt || null, item.useCount || 0, item.version || 1
      )
    }
  }

  const folders = body.folders || []
  if (folders.length) {
    const stmt = db.prepare(
      `INSERT INTO folders (id, name, parentId, level, icon, color, sortOrder, createdAt, updatedAt, deletedAt, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, parentId=excluded.parentId, level=excluded.level, icon=excluded.icon, color=excluded.color,
       sortOrder=excluded.sortOrder, updatedAt=excluded.updatedAt, deletedAt=excluded.deletedAt, version=excluded.version`
    )
    for (const item of folders) {
      stmt.run(
        item.id, item.name, item.parentId || null, item.level, item.icon || null, item.color || null,
        item.sortOrder || 0, item.createdAt, item.updatedAt, item.deletedAt || null, item.version || 1
      )
    }
  }

  return success()
})

app.post('/resolve-conflict', requireAuth, async (c) => {
  return success()
})

export default app
