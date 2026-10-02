import { computed, type Ref } from 'vue'
import type { Note } from '@/types/note'
import type { PromptFolder } from '@/types/folder'
import { getFolderPath } from '@/lib/db/folderRepository'

export interface SearchFilters {
  query: string
  folderId: string | null
  tags: string[]
  types: string[]
  favoriteOnly: boolean
  archivedOnly: boolean
  unsyncedOnly: boolean
}

export function useNoteSearch(
  notes: Ref<Note[]>,
  folders: Ref<PromptFolder[]>,
  filters: Ref<SearchFilters>
) {
  const filtered = computed(() => {
    let list = notes.value
    const f = filters.value

    if (f.folderId) {
      const ids = new Set([f.folderId])
      const collectChildren = (pid: string) => {
        folders.value.forEach((fo) => {
          if (fo.parentId === pid) {
            ids.add(fo.id)
            collectChildren(fo.id)
          }
        })
      }
      collectChildren(f.folderId)
      list = list.filter((p) => p.folderId && ids.has(p.folderId))
    }

    if (f.tags.length) {
      list = list.filter((p: Note) => f.tags.some((t) => p.tags.includes(t)))
    }

    if (f.types.length) {
      list = list.filter((p: Note) => f.types.includes(p.type || ''))
    }

    if (f.favoriteOnly) {
      list = list.filter((p: Note) => p.isFavorite)
    }

    if (f.archivedOnly) {
      list = list.filter((p: Note) => p.isArchived)
    } else {
      list = list.filter((p: Note) => !p.isArchived && !p.deletedAt)
    }

    if (f.unsyncedOnly) {
      list = list.filter((p: Note) => p.syncStatus === 'local_pending' || p.syncStatus === 'conflict')
    }

    if (f.query.trim()) {
      const q = f.query.toLowerCase()
      list = list.filter((p: Note) => {
        const path = getFolderPath(folders.value, p.folderId).toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          p.tags.some((t: string) => t.toLowerCase().includes(q)) ||
          (p.type || '').toLowerCase().includes(q) ||
          path.includes(q) ||
          p.links.some((l) => (l.title || '').toLowerCase().includes(q) || l.url.toLowerCase().includes(q)) ||
          (p.sourceUrl || '').toLowerCase().includes(q) ||
          (p.sourceTitle || '').toLowerCase().includes(q)
        )
      })
    }

    return list
  })

  return { filtered }
}
