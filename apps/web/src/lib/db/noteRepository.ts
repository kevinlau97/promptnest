import { db } from './schema'
import type { Note } from '@/types/note'

export async function getAllNotes(): Promise<Note[]> {
  const notes = await db.notes.filter((p) => !p.deletedAt).toArray()
  // 解析 images 字段（防止是 JSON 字符串）
  return notes.map((p) => ({
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
  }))
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  const p = await db.notes.get(id)
  if (!p) return undefined
  return {
    ...p,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
  }
}

export async function createNote(item: Note): Promise<void> {
  await db.notes.put(item)
}

export async function updateNote(id: string, changes: Partial<Note>): Promise<void> {
  await db.notes.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.update(id, {
    deletedAt: new Date().toISOString(),
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function hardDeleteNote(id: string): Promise<void> {
  await db.notes.delete(id)
}

export async function archiveNote(id: string, isArchived: boolean): Promise<void> {
  await db.notes.update(id, {
    isArchived,
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function favoriteNote(id: string, isFavorite: boolean): Promise<void> {
  await db.notes.update(id, {
    isFavorite,
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function incrementUseCount(id: string): Promise<void> {
  const item = await db.notes.get(id)
  if (!item) return
  await db.notes.update(id, {
    useCount: (item.useCount || 0) + 1,
    lastUsedAt: new Date().toISOString(),
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function getPendingNotes(): Promise<Note[]> {
  return db.notes.where('syncStatus').anyOf(['local_pending', 'conflict']).toArray()
}

export async function getNotesByFolder(folderId: string | null): Promise<Note[]> {
  if (folderId === null) {
    return db.notes.filter((p) => !p.folderId).toArray()
  }
  return db.notes.where('folderId').equals(folderId).toArray()
}
