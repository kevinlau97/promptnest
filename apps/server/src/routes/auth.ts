import { Hono } from 'hono'
import { z } from 'zod'
import { success, error } from '../utils/response.js'
import { hashPassword, verifyPassword } from '../auth/password.js'
import { createSession, deleteSession } from '../auth/session.js'
import { requireAuth } from '../auth/middleware.js'
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../auth/rateLimit.js'

type Variables = {
  user: { email: string }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const app = new Hono<{ Variables: Variables }>()

let passwordHash: string | null = null

function getPasswordHash(): string {
  if (!passwordHash) {
    passwordHash = hashPassword(process.env.ADMIN_PASSWORD || 'admin')
  }
  return passwordHash
}

app.post('/login', async (c) => {
  const clientIp = c.req.header('x-forwarded-for') || 'unknown'

  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return error('INVALID_INPUT', 'Invalid input', 400)

  const { email, password } = parsed.data
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'

  if (email !== adminEmail || !verifyPassword(password, getPasswordHash())) {
    if (!checkRateLimit(clientIp)) {
      return error('RATE_LIMITED', 'Too many login attempts. Please try again later.', 429)
    }
    recordFailedAttempt(clientIp)
    return error('INVALID_CREDENTIALS', 'Invalid email or password', 401)
  }

  resetRateLimit(clientIp)
  const token = createSession(email)
  return success({ token })
})

app.post('/logout', requireAuth, async (c) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  deleteSession(token)
  return success()
})

app.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  return success({ email: user.email })
})

export default app
