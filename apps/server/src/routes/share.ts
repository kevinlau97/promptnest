import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success, error } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'

const app = new Hono<AppEnv>()

app.post('/create', requireAuth, async (c) => {
  const body = await c.req.json()
  const { id, slug } = body
  await c.env.DB.prepare('UPDATE prompts SET visibility = ?, shareSlug = ? WHERE id = ?').bind('shared', slug, id).run()
  return success({ slug })
})

app.post('/cancel', requireAuth, async (c) => {
  const body = await c.req.json()
  const { id } = body
  await c.env.DB.prepare('UPDATE prompts SET visibility = ?, shareSlug = ? WHERE id = ?').bind('private', null, id).run()
  return success()
})

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const row = await c.env.DB.prepare('SELECT * FROM prompts WHERE shareSlug = ? AND visibility = ?').bind(slug, 'shared').first<Record<string, unknown>>()
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
