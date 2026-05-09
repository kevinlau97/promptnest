import Dexie, { type Table } from 'dexie'
import type { PromptItem, PromptVersion } from '@/types/prompt'
import type { PromptFolder } from '@/types/folder'
import type { UserSettings } from '@/types/settings'

export class PromptNestDB extends Dexie {
  prompts!: Table<PromptItem, string>
  folders!: Table<PromptFolder, string>
  versions!: Table<PromptVersion, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super('PromptNestDB')

    this.version(1).stores({
      prompts: 'id, folderId, type, isFavorite, isArchived, syncStatus, updatedAt, lastUsedAt, useCount, *tags',
      folders: 'id, parentId, level, sortOrder, syncStatus',
      versions: 'id, promptId, createdAt',
      settings: 'id',
    })

    this.version(2).stores({
      prompts: 'id, folderId, type, isFavorite, isArchived, syncStatus, updatedAt, lastUsedAt, useCount, deletedAt, *tags',
      folders: 'id, parentId, level, sortOrder, syncStatus, deletedAt',
      versions: 'id, promptId, createdAt',
      settings: 'id',
    }).upgrade((tx) => {
      // Migration: ensure all existing records have required fields with defaults
      return tx.table('prompts').toCollection().modify((prompt: any) => {
        if (prompt.useCount === undefined) prompt.useCount = 0
        if (prompt.tags === undefined) prompt.tags = []
        if (prompt.links === undefined) prompt.links = []
        if (prompt.variables === undefined) prompt.variables = []
        if (prompt.isFavorite === undefined) prompt.isFavorite = false
        if (prompt.isArchived === undefined) prompt.isArchived = false
        if (prompt.visibility === undefined) prompt.visibility = 'private'
        if (prompt.syncStatus === undefined) prompt.syncStatus = 'synced'
        if (prompt.version === undefined) prompt.version = 1
      })
    })
  }
}

export const db = new PromptNestDB()
