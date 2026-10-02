const WINDOW_MS = 60 * 1000
const MAX_ATTEMPTS = 10

/** Atomically charge an attempt across Worker isolates before checking credentials. */
export async function checkRateLimit(db: D1Database, key: string, now = Date.now()): Promise<boolean> {
  const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS
  const row = await db.prepare(`
    INSERT INTO login_attempts (clientIp, windowStart, attempts) VALUES (?, ?, 1)
    ON CONFLICT(clientIp) DO UPDATE SET
      attempts = CASE
        WHEN login_attempts.windowStart < excluded.windowStart
        THEN 1
        ELSE MIN(login_attempts.attempts + 1, ?)
      END,
      windowStart = MAX(login_attempts.windowStart, excluded.windowStart)
    RETURNING attempts
  `).bind(key, windowStart, MAX_ATTEMPTS + 1).first<{ attempts: number }>()

  return row !== null && row.attempts <= MAX_ATTEMPTS
}

export async function cleanupRateLimits(db: D1Database): Promise<void> {
  const windowStart = Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS
  await db.prepare('DELETE FROM login_attempts WHERE windowStart < ?').bind(windowStart).run()
}
