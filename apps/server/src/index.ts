import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv, Bindings } from './env.js'
import auth from './routes/auth.js'
import prompts from './routes/prompts.js'
import folders from './routes/folders.js'
import sync from './routes/sync.js'
import share from './routes/share.js'
import capture from './routes/capture.js'
import health from './routes/health.js'
import upload from './routes/upload.js'
import proxy from './routes/proxy.js'
import { cleanupSessions } from './auth/session.js'
import { cleanupRateLimits } from './auth/rateLimit.js'

export const app = new Hono<AppEnv>()

app.use('/api/*', cors())
app.use('/api/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store')
  c.header('X-Content-Type-Options', 'nosniff')
})

app.route('/api/auth', auth)
app.route('/api/prompts', prompts)
app.route('/api/folders', folders)
app.route('/api/sync', sync)
app.route('/api/share', share)
app.route('/api/capture', capture)
app.route('/api/health', health)
app.route('/api/upload', upload)
app.route('/api/proxy', proxy)
app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, 404))
app.onError((err, c) => {
  console.error('API request failed:', err.message)
  return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Please try again later' } }, 500)
})

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Bindings) {
    await cleanupSessions(env.DB)
    await cleanupRateLimits(env.DB)
  },
} satisfies ExportedHandler<Bindings>
