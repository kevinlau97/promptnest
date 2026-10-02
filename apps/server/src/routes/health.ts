import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success } from '../utils/response.js'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  await c.env.DB.prepare('SELECT 1').first()
  return success({ status: 'ok', hosting: 'cloudflare-workers', timestamp: new Date().toISOString() })
})

export default app
