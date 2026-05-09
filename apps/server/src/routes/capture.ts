import { Hono } from 'hono'
import { success } from '../utils/response'
import { requireAuth } from '../auth/middleware'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.post('/', requireAuth, async (c) => {
  const body = await c.req.json()
  // Reserved for browser extension quick capture
  return success({ received: true, body })
})

export default app
