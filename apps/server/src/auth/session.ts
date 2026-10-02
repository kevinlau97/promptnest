const SESSION_DAYS = 7

export async function createSession(db: D1Database, email: string): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.prepare('INSERT INTO sessions (id, email, createdAt, expiresAt) VALUES (?, ?, ?, ?)')
    .bind(id, email, now.toISOString(), expiresAt.toISOString())
    .run()
  return id
}

export async function getSession(db: D1Database, token: string): Promise<{ email: string } | null> {
  return db.prepare('SELECT email FROM sessions WHERE id = ? AND expiresAt > ?')
    .bind(token, new Date().toISOString())
    .first<{ email: string }>()
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run()
}

export async function cleanupSessions(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE expiresAt <= ?').bind(new Date().toISOString()).run()
}
