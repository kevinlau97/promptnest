import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../env.js'
import { getSession } from './session.js'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, 401)
  }
  const session = await getSession(c.env.DB, token)
  if (!session) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, 401)
  }
  c.set('user', session)
  await next()
})
