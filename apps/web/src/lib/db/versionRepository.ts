import { db } from './schema'
import type { Note, NoteVersion } from '@/types/note'
import { generateId } from '@/lib/utils/id'

export async function createVersionSnapshot(
  note: Note,
  reason: NoteVersion['reason'] = 'manual_save'
): Promise<void> {
  const snapshot: NoteVersion = {
    id: generateId(),
    noteId: note.id,
    title: note.title,
    content: note.content,
    snapshot: { ...note },
    createdAt: new Date().toISOString(),
    reason,
  }
  await db.versions.add(snapshot)
}

export async function getVersionsByNoteId(noteId: string): Promise<NoteVersion[]> {
  return db.versions.where('noteId').equals(noteId).reverse().sortBy('createdAt')
}
