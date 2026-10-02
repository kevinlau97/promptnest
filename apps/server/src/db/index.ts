import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { mkdirSync, existsSync } from 'fs'

const dbPath = process.env.DATABASE_PATH || resolve(process.cwd(), 'data', 'promptnest.db')

// Create directory if needed
const dbDir = dirname(dbPath)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

export const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL')

// Run schema
const schemaPath = resolve(import.meta.dirname, 'schema.sql')
const schema = readFileSync(schemaPath, 'utf-8')
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) {
  db.exec(statement + ';')
}
