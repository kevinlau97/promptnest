import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { resolve } from 'path'
import auth from './routes/auth.js'
import prompts from './routes/prompts.js'
import folders from './routes/folders.js'
import sync from './routes/sync.js'
import share from './routes/share.js'
import capture from './routes/capture.js'
import health from './routes/health.js'
import upload from './routes/upload.js'

type Variables = {
  user: { email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.use(logger())
app.use(cors({ origin: '*', credentials: true }))

app.route('/api/auth', auth)
app.route('/api/prompts', prompts)
app.route('/api/folders', folders)
app.route('/api/sync', sync)
app.route('/api/share', share)
app.route('/api/capture', capture)
app.route('/api/health', health)
app.route('/api/upload', upload)

// Serve frontend build - use absolute path
const webDistPath = resolve(import.meta.dirname, '../../web/dist')
app.use('*', serveStatic({ root: webDistPath }))
app.use('*', serveStatic({ path: resolve(webDistPath, 'index.html') }))

const port = parseInt(process.env.PORT || '3000')

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})
