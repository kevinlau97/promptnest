import { createMiddleware } from 'hono/factory'
import type { Context, Next } from 'hono'
import { getSession } from './session'

type Variables = {
  user: { email: string }
}

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c: Context<{ Variables: Variables }>, next: Next) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, 401)
  }
  const session = getSession(token)
  if (!session) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, 401)
  }
  c.set('user', session)
  await next()
})
