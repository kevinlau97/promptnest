import { db } from '../db/index'
import { randomUUID } from 'crypto'

const SESSION_DAYS = 7

export function createSession(email: string): string {
  const id = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  db.prepare('INSERT INTO sessions (id, email, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(
    id,
    email,
    now.toISOString(),
    expiresAt.toISOString()
  )
  return id
}

export function getSession(token: string): { email: string } | null {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ? AND expiresAt > ?').get(token, new Date().toISOString()) as
    | { email: string }
    | undefined
  return row || null
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token)
}

export function cleanupSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(new Date().toISOString())
}

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000)
