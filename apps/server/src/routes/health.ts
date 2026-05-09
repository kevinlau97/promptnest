import { Hono } from 'hono'
import { success } from '../utils/response.js'

const app = new Hono()

app.get('/', (c) => {
  return success({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app
