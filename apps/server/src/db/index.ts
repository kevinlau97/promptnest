import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const dbPath = process.env.DATABASE_PATH || resolve(process.cwd(), 'data', 'promptnest.db')
export const db: InstanceType<typeof Database> = new Database(dbPath)
db.pragma('journal_mode = WAL')

const schemaPath = resolve(import.meta.dirname, 'schema.sql')
const schema = readFileSync(schemaPath, 'utf-8')
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) {
  db.exec(statement + ';')
}
