import { Hono } from 'hono'
import { db } from '../db/index'
import { success, error } from '../utils/response'
import { requireAuth } from '../auth/middleware'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.post('/create', requireAuth, async (c) => {
  const body = await c.req.json()
  const { id, slug } = body
  db.prepare('UPDATE prompts SET visibility = ?, shareSlug = ? WHERE id = ?').run('shared', slug, id)
  return success({ slug })
})

app.post('/cancel', requireAuth, async (c) => {
  const body = await c.req.json()
  const { id } = body
  db.prepare('UPDATE prompts SET visibility = ?, shareSlug = ? WHERE id = ?').run('private', null, id)
  return success()
})

app.get('/:slug', (c) => {
  const slug = c.req.param('slug')
  const row = db.prepare('SELECT * FROM prompts WHERE shareSlug = ? AND visibility = ?').get(slug, 'shared') as
    | Record<string, unknown>
    | undefined
  if (!row) return error('NOT_FOUND', 'Shared prompt not found', 404)

  const prompt = {
    ...row,
    tags: JSON.parse((row.tags as string) || '[]'),
    links: JSON.parse((row.links as string) || '[]'),
    variables: JSON.parse((row.variables as string) || '[]'),
    isFavorite: Boolean(row.isFavorite),
    isArchived: Boolean(row.isArchived),
  }
  return success({ prompt })
})

export default app
