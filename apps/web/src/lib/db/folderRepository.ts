import { db } from './schema'
import type { PromptFolder, FolderTreeNode } from '@/types/folder'

export async function getAllFolders(): Promise<PromptFolder[]> {
  return db.folders.filter((f) => !f.deletedAt).sortBy('sortOrder')
}

export async function getFolderById(id: string): Promise<PromptFolder | undefined> {
  return db.folders.get(id)
}

export async function createFolder(folder: PromptFolder): Promise<void> {
  await db.folders.put(folder)
}

export async function updateFolder(id: string, changes: Partial<PromptFolder>): Promise<void> {
  await db.folders.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteFolder(id: string): Promise<void> {
  await db.folders.update(id, {
    deletedAt: new Date().toISOString(),
    syncStatus: 'local_pending',
    updatedAt: new Date().toISOString(),
  })
}

export async function getChildFolders(parentId: string): Promise<PromptFolder[]> {
  return db.folders.where('parentId').equals(parentId).toArray()
}

export function getFolderPath(folders: PromptFolder[], folderId: string | null | undefined): string {
  if (!folderId) return 'Uncategorized'
  const map = new Map(folders.map((f) => [f.id, f]))
  const parts: string[] = []
  let current = map.get(folderId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? map.get(current.parentId) : undefined
  }
  return parts.join(' / ') || 'Uncategorized'
}

export function buildFolderTree(folders: PromptFolder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>()
  const roots: FolderTreeNode[] = []

  for (const f of folders) {
    map.set(f.id, { ...f, children: [] })
  }

  for (const f of folders) {
    const node = map.get(f.id)!
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function getFolderDescendants(folders: PromptFolder[], folderId: string): string[] {
  const result: string[] = [folderId]
  const children = folders.filter((f) => f.parentId === folderId)
  for (const child of children) {
    result.push(...getFolderDescendants(folders, child.id))
  }
  return result
}
