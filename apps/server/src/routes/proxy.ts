import { Hono } from 'hono'
import type { AppEnv } from '../env.js'

const app = new Hono<AppEnv>()
const allowedDomains = ['bild.quarker.cc', 'img.imliuk.com']

function allowed(url: URL): boolean {
  return url.protocol === 'https:' && !url.port && !url.username && !url.password && allowedDomains.includes(url.hostname)
}

app.get('/image', async (c) => {
  const input = c.req.query('url')
  if (!input) return c.json({ error: 'Missing url' }, 400)
  let url: URL
  try { url = new URL(input) } catch { return c.json({ error: 'Invalid url' }, 400) }
  if (!allowed(url)) return c.json({ error: 'Domain not allowed' }, 403)

  // Existing bild URLs already refer to this bucket. Read through the binding
  // instead of making a cross-zone HTTP request back to Cloudflare's R2 origin.
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (!allowed(url)) return c.json({ error: 'Domain not allowed' }, 403)
    if (url.hostname === new URL(c.env.R2_PUBLIC_URL).hostname) {
      let key: string
      try { key = decodeURIComponent(url.pathname.slice(1)) } catch { return c.json({ error: 'Invalid image path' }, 400) }
      const object = await c.env.IMAGES.get(key)
      if (!object) return c.json({ error: 'Image not found' }, 404)
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('ETag', object.httpEtag)
      headers.set('Cache-Control', 'public, max-age=86400')
      if (!headers.get('Content-Type')?.startsWith('image/')) return c.json({ error: 'Invalid image content type' }, 502)
      return new Response(object.body, { headers })
    }
    const response = await fetch(url, { redirect: 'manual' })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location')
      await response.body?.cancel()
      if (!location) return c.json({ error: 'Image unavailable' }, 502)
      try { url = new URL(location, url) } catch { return c.json({ error: 'Invalid image redirect' }, 502) }
      continue
    }
    if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) {
      await response.body?.cancel()
      return c.json({ error: 'Image unavailable' }, 502)
    }
    return new Response(response.body, { headers: {
      'Content-Type': response.headers.get('Content-Type')!,
      'Cache-Control': 'public, max-age=86400',
    } })
  }
  return c.json({ error: 'Too many image redirects' }, 502)
})

export default app
