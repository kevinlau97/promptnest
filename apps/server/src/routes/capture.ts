import { Hono } from 'hono'
import type { AppEnv } from '../env.js'
import { success } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'

const app = new Hono<AppEnv>()

app.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  // Reserved for browser extension quick capture
  return success({ received: true, body })
})

export default app
