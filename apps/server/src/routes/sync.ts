import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'
import { batchError, preparePromptUpserts, runBatch } from './prompts.js'
import { prepareFolderUpserts } from './folders.js'

const app = new Hono<AppEnv>()

app.get('/pull', requireAuth, async (c) => {
  const lastSyncAt = c.req.query('lastSyncAt') || '1970-01-01T00:00:00.000Z'
  const [prompts, folders] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT * FROM prompts WHERE updatedAt > ?').bind(lastSyncAt),
    c.env.DB.prepare('SELECT * FROM folders WHERE updatedAt > ?').bind(lastSyncAt),
  ])
  return success({ prompts: prompts.results, folders: folders.results, syncAt: new Date().toISOString() })
})

app.post('/push', requireAuth, async (c) => {
  const body = await c.req.json()
  try {
    await runBatch(c.env.DB, [
      ...preparePromptUpserts(c.env.DB, body.prompts || []),
      ...prepareFolderUpserts(c.env.DB, body.folders || []),
    ])
    return success()
  } catch (cause) {
    return batchError(cause)
  }
})

app.post('/resolve-conflict', requireAuth, async () => {
  return success()
})

export default app
