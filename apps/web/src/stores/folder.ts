import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  buildFolderTree,
  getFolderDescendants,
} from '@/lib/db/folderRepository'
import { updateNote } from '@/lib/db/noteRepository'
import type { PromptFolder } from '@/types/folder'
import { generateId } from '@/lib/utils/id'
import { now } from '@/lib/utils/date'

export const useFolderStore = defineStore('folder', () => {
  const folders = ref<PromptFolder[]>([])
  const loaded = ref(false)

  const folderTree = computed(() => buildFolderTree(folders.value))

  async function load() {
    folders.value = await getAllFolders()
    loaded.value = true
  }

  async function addFolder(
    name: string,
    parentId?: string | null
  ): Promise<PromptFolder> {
    const parent = parentId ? folders.value.find((f) => f.id === parentId) : undefined
    const level = parent ? ((parent.level + 1) as 1 | 2 | 3) : 1
    if (level > 3) throw new Error('Max folder depth is 3')

    const folder: PromptFolder = {
      id: generateId(),
      name,
      parentId: parentId || null,
      level,
      sortOrder: folders.value.length,
      createdAt: now(),
      updatedAt: now(),
      syncStatus: 'local_pending',
      version: 1,
    }
    await createFolder(folder)
    folders.value.push(folder)
    return folder
  }

  async function updateName(id: string, name: string) {
    await updateFolder(id, { name, syncStatus: 'local_pending' })
    const f = folders.value.find((x) => x.id === id)
    if (f) f.name = name
  }

  async function remove(id: string, moveToParent = true) {
    const folder = folders.value.find((f) => f.id === id)
    const targetFolderId = moveToParent ? folder?.parentId || null : null

    // Reassign notes in this folder to parent or uncategorized
    const { useNoteStore } = await import('@/stores/note')
    const noteStore = useNoteStore()
    for (const p of noteStore.notes) {
      if (p.folderId === id) {
        await updateNote(p.id, { folderId: targetFolderId, syncStatus: 'local_pending' })
        p.folderId = targetFolderId
        p.syncStatus = 'local_pending'
      }
    }

    await deleteFolder(id)
    folders.value = folders.value.filter((f) => f.id !== id)
  }

  function getDescendantIds(folderId: string): string[] {
    return getFolderDescendants(folders.value, folderId)
  }

  return { folders, folderTree, loaded, load, addFolder, updateName, remove, getDescendantIds }
})
