import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import type { AppEnv } from '../env.js'
import { success, error } from '../utils/response.js'
import { verifyCredentials } from '../auth/password.js'
import { createSession, deleteSession } from '../auth/session.js'
import { requireAuth } from '../auth/middleware.js'
import { checkRateLimit } from '../auth/rateLimit.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const app = new Hono<AppEnv>()

app.post('/login', async (c, next) => {
  // Cloudflare supplies this header. Never trust user-controlled forwarding
  // headers; local requests without it share one conservative bucket.
  const clientIp = c.req.header('CF-Connecting-IP') || 'unknown'
  if (!await checkRateLimit(c.env.DB, clientIp)) {
    return error('RATE_LIMITED', 'Too many login attempts. Please try again later.', 429)
  }
  await next()
}, bodyLimit({
  maxSize: 8 * 1024,
  onError: () => error('INVALID_INPUT', 'Login request is too large', 413),
}), async (c) => {
  const { ADMIN_EMAIL: adminEmail, ADMIN_PASSWORD: adminPassword } = c.env
  if (!adminEmail || !adminPassword) {
    return error('AUTH_NOT_CONFIGURED', 'Administrator credentials are not configured', 503)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return error('INVALID_INPUT', 'Invalid JSON', 400)
  }
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return error('INVALID_INPUT', 'Invalid input', 400)

  const { email, password } = parsed.data
  if (!await verifyCredentials(email, password, adminEmail, adminPassword)) {
    return error('INVALID_CREDENTIALS', 'Invalid email or password', 401)
  }

  const token = await createSession(c.env.DB, adminEmail)
  return success({ token })
})

app.post('/logout', requireAuth, async (c) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  await deleteSession(c.env.DB, token)
  return success()
})

app.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  return success({ email: user.email })
})

export default app
