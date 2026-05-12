import { db } from '@/lib/db/schema'
import { apiClient } from '@/lib/api/client'
import type { PromptItem } from '@/types/prompt'
import type { PromptFolder } from '@/types/folder'

export interface ConflictItem {
  id: string
  type: 'prompt' | 'folder'
  local: PromptItem | PromptFolder
  remote: PromptItem | PromptFolder
}

export async function getSyncSummary() {
  const pendingPrompts = await db.prompts.where('syncStatus').equals('local_pending').count()
  const pendingFolders = await db.folders.where('syncStatus').equals('local_pending').count()
  const conflictPrompts = await db.prompts.where('syncStatus').equals('conflict').count()
  const conflictFolders = await db.folders.where('syncStatus').equals('conflict').count()
  return {
    localPending: pendingPrompts + pendingFolders,
    conflicts: conflictPrompts + conflictFolders,
  }
}

export async function getConflicts(): Promise<ConflictItem[]> {
  const promptConflicts = await db.prompts.where('syncStatus').equals('conflict').toArray()
  const result: ConflictItem[] = []

  for (const p of promptConflicts) {
    result.push({ id: p.id, type: 'prompt', local: p, remote: p })
  }

  return result
}

export async function pushLocalChanges(): Promise<boolean> {
  const prompts = await db.prompts.where('syncStatus').equals('local_pending').toArray()
  const folders = await db.folders.where('syncStatus').equals('local_pending').toArray()

  if (prompts.length) {
    await apiClient.post('/api/prompts/batch-upsert', { items: prompts })
    for (const p of prompts) {
      await db.prompts.update(p.id, { syncStatus: 'synced' })
    }
  }

  if (folders.length) {
    await apiClient.post('/api/folders/batch-upsert', { items: folders })
    for (const f of folders) {
      await db.folders.update(f.id, { syncStatus: 'synced' })
    }
  }

  return true
}

export async function pullRemote(lastSyncAt?: string): Promise<boolean> {
  const res = await apiClient.get<{ prompts: PromptItem[]; folders: PromptFolder[]; syncAt: string }>(
    `/api/sync/pull?lastSyncAt=${encodeURIComponent(lastSyncAt || '1970-01-01T00:00:00.000Z')}`
  )
  if (!res.success || !res.data) return false

  for (const p of res.data.prompts) {
    const existing = await db.prompts.get(p.id)
    if (!existing) {
      const parsed = {
        ...p,
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
        links: typeof p.links === 'string' ? JSON.parse(p.links) : p.links,
        variables: typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
        isFavorite: Boolean(p.isFavorite),
        isArchived: Boolean(p.isArchived),
        syncStatus: 'synced' as const,
      }
      await db.prompts.put(parsed)
    } else if (existing.syncStatus === 'local_pending') {
      // Conflict: both local and remote have changes
      await db.prompts.update(p.id, { syncStatus: 'conflict' })
    } else if (p.updatedAt > existing.updatedAt) {
      const parsed = {
        ...p,
        tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
        links: typeof p.links === 'string' ? JSON.parse(p.links) : p.links,
        variables: typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
        isFavorite: Boolean(p.isFavorite),
        isArchived: Boolean(p.isArchived),
        syncStatus: 'synced' as const,
      }
      await db.prompts.put(parsed)
    }
  }

  for (const f of res.data.folders) {
    const existing = await db.folders.get(f.id)
    if (!existing) {
      await db.folders.put({ ...f, syncStatus: 'synced' })
    } else if (existing.syncStatus === 'local_pending') {
      await db.folders.update(f.id, { syncStatus: 'conflict' })
    } else if (f.updatedAt > existing.updatedAt) {
      await db.folders.put({ ...f, syncStatus: 'synced' })
    }
  }

  return true
}

export async function resolveConflict(id: string, type: 'prompt' | 'folder', choice: 'local' | 'remote'): Promise<void> {
  if (choice === 'local') {
    if (type === 'prompt') {
      await db.prompts.update(id, { syncStatus: 'local_pending' })
    } else {
      await db.folders.update(id, { syncStatus: 'local_pending' })
    }
    await pushLocalChanges()
  } else {
    // For remote, we'll re-pull just this item
    // Since we don't have single-item pull, mark as synced and next pull will overwrite
    if (type === 'prompt') {
      await db.prompts.update(id, { syncStatus: 'synced' })
    } else {
      await db.folders.update(id, { syncStatus: 'synced' })
    }
    await pullRemote()
  }
}

export async function forcePullRemote(): Promise<boolean> {
  const res = await apiClient.get<{ prompts: PromptItem[]; folders: PromptFolder[]; syncAt: string }>(
    `/api/sync/pull?lastSyncAt=1970-01-01T00:00:00.000Z`
  )
  if (!res.success || !res.data) return false

  for (const p of res.data.prompts) {
    const parsed = {
      ...p,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
      links: typeof p.links === 'string' ? JSON.parse(p.links) : p.links,
      variables: typeof p.variables === 'string' ? JSON.parse(p.variables) : p.variables,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
      isFavorite: Boolean(p.isFavorite),
      isArchived: Boolean(p.isArchived),
      syncStatus: 'synced' as const,
    }
    await db.prompts.put(parsed)
  }

  for (const f of res.data.folders) {
    await db.folders.put({ ...f, syncStatus: 'synced' })
  }

  return true
}

export async function syncAll(): Promise<boolean> {
  await pushLocalChanges()
  await pullRemote()
  return true
}
