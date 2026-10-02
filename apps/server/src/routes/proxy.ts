import { Hono } from 'hono'

const app = new Hono()

// 图片代理 - 绕过 CORS 限制
app.get('/image', async (c) => {
  const url = c.req.query('url')
  if (!url) {
    return c.json({ error: 'Missing url' }, 400)
  }

  try {
    // 只允许白名单域名
    const allowedDomains = ['bild.quarker.cc', 'img.imliuk.com']
    const parsed = new URL(url)
    if (!allowedDomains.some(d => parsed.hostname === d || parsed.hostname.endsWith(d))) {
      return c.json({ error: 'Domain not allowed' }, 403)
    }

    const res = await fetch(url)
    const blob = await res.blob()
    const headers = new Headers()
    headers.set('Content-Type', res.headers.get('Content-Type') || 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=86400')
    
    return new Response(blob, { headers })
  } catch (e) {
    return c.json({ error: 'Failed to fetch image' }, 500)
  }
})

export default app
