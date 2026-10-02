import { Hono } from 'hono'
import { uploadToR2 } from '../lib/r2.js'
import { success, error } from '../utils/response.js'
import { requireAuth } from '../auth/middleware.js'
import type { AppEnv } from '../env.js'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const app = new Hono<AppEnv>()

app.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody()
  const file = body.file

  if (!file || !(file instanceof File)) {
    return error('INVALID_FILE', 'No file provided', 400)
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return error('INVALID_TYPE', `Unsupported file type: ${file.type}`, 400)
  }

  if (file.size > MAX_SIZE) {
    return error('FILE_TOO_LARGE', 'File exceeds 10MB limit', 400)
  }

  const arrayBuffer = await file.arrayBuffer()

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now()
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `promptnest/${year}/${month}/${timestamp}-${crypto.randomUUID()}-${originalName}`

  try {
    const url = await uploadToR2(c.env, key, arrayBuffer, file.type)
    return success({ url })
  } catch (e) {
    console.error('R2 upload failed:', e)
    return error('UPLOAD_FAILED', 'Failed to upload file to storage', 500)
  }
})

export default app
