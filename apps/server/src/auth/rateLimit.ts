type LimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, LimitEntry>()
const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 10

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 0, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false
  }

  return true
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
  } else {
    entry.count++
  }
}

export function resetRateLimit(key: string): void {
  store.delete(key)
}
