import { db } from './schema'
import type { PromptItem } from '@/types/prompt'

export async function getAllPrompts(): Promise<PromptItem[]> {
  return db.prompts.filter((p) => !p.deletedAt).toArray()
}

export async function getPromptById(id: string): Promise<PromptItem | undefined> {
  return db.prompts.get(id)
}

export async function createPrompt(item: PromptItem): Promise<void> {
  await db.prompts.put(item)
}

export async function updatePrompt(id: string, changes: Partial<PromptItem>): Promise<void> {
  await db.prompts.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deletePrompt(id: string): Promise<void> {
  await db.prompts.update(id, {
    deletedAt: new Date().toISOString(),
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function hardDeletePrompt(id: string): Promise<void> {
  await db.prompts.delete(id)
}

export async function archivePrompt(id: string, isArchived: boolean): Promise<void> {
  await db.prompts.update(id, {
    isArchived,
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function favoritePrompt(id: string, isFavorite: boolean): Promise<void> {
  await db.prompts.update(id, {
    isFavorite,
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function incrementUseCount(id: string): Promise<void> {
  const item = await db.prompts.get(id)
  if (!item) return
  await db.prompts.update(id, {
    useCount: (item.useCount || 0) + 1,
    lastUsedAt: new Date().toISOString(),
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function getPendingPrompts(): Promise<PromptItem[]> {
  return db.prompts.where('syncStatus').anyOf(['local_pending', 'conflict']).toArray()
}

export async function getPromptsByFolder(folderId: string | null): Promise<PromptItem[]> {
  if (folderId === null) {
    return db.prompts.filter((p) => !p.folderId).toArray()
  }
  return db.prompts.where('folderId').equals(folderId).toArray()
}
