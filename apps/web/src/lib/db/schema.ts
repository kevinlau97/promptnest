import Dexie, { type Table } from 'dexie'
import type { Note, NoteVersion } from '@/types/note'
import type { PromptFolder } from '@/types/folder'
import type { UserSettings } from '@/types/settings'

export class ThoughtNestDB extends Dexie {
  notes!: Table<Note, string>
  folders!: Table<PromptFolder, string>
  versions!: Table<NoteVersion, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super('ThoughtNestDB')

    // Version 1: 初始化 notes 表
    this.version(1).stores({
      notes: 'id, folderId, type, isFavorite, isArchived, syncStatus, updatedAt, lastUsedAt, useCount, deletedAt, *tags',
      folders: 'id, parentId, level, sortOrder, syncStatus, deletedAt',
      versions: 'id, noteId, createdAt',
      settings: 'id',
    }).upgrade(async (tx) => {
      // 尝试从旧的 MemosDB 迁移数据
      try {
        const oldDB = new Dexie('MemosDB')
        await oldDB.open()
        
        // 迁移 prompts → notes
        const oldPrompts = await oldDB.table('prompts').toArray()
        if (oldPrompts.length > 0) {
          await tx.table('notes').bulkAdd(oldPrompts)
        }
        
        // 迁移 folders
        const oldFolders = await oldDB.table('folders').toArray()
        if (oldFolders.length > 0) {
          await tx.table('folders').bulkAdd(oldFolders)
        }
        
        // 迁移 versions
        const oldVersions = await oldDB.table('versions').toArray()
        if (oldVersions.length > 0) {
          // 把 promptId 改成 noteId
          const newVersions = oldVersions.map((v: any) => ({
            ...v,
            noteId: v.promptId,
          }))
          await tx.table('versions').bulkAdd(newVersions)
        }
        
        oldDB.close()
      } catch (e) {
        // 旧数据库不存在，没关系，不用迁移
        console.log('No old database found, starting fresh')
      }
    })
  }
}

export const db = new ThoughtNestDB()
