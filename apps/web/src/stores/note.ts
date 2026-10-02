import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
  favoriteNote,
  archiveNote,
  incrementUseCount,
} from '@/lib/db/noteRepository'
import { createVersionSnapshot } from '@/lib/db/versionRepository'
import type { Note } from '@/types/note'
import { generateId } from '@/lib/utils/id'
import { now } from '@/lib/utils/date'
import { autoTitle, extractUrls } from '@/lib/utils/text'

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])
  const loaded = ref(false)

  const activeNotes = computed(() =>
    notes.value.filter((p) => !p.deletedAt && !p.isArchived)
  )

  const favoriteNotes = computed(() =>
    activeNotes.value.filter((p) => p.isFavorite)
  )

  const recentlyUsed = computed(() =>
    [...activeNotes.value]
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''))
  )

  const mostUsed = computed(() =>
    [...activeNotes.value].sort((a, b) => b.useCount - a.useCount)
  )

  const unsyncedNotes = computed(() =>
    notes.value.filter((p) => p.syncStatus === 'local_pending' || p.syncStatus === 'conflict')
  )

  const archivedNotes = computed(() =>
    notes.value.filter((p) => p.isArchived && !p.deletedAt)
  )

  async function load() {
    notes.value = await getAllNotes()
    loaded.value = true
  }

  function buildItem(partial: Partial<Note> & { content: string; title?: string }): Note {
    const title = partial.title?.trim() || autoTitle(partial.content)
    const links = partial.links || []
    const extracted = extractUrls(partial.content)
    for (const url of extracted) {
      if (!links.some((l) => l.url === url)) {
        links.push({ id: generateId(), url })
      }
    }

    return {
      id: partial.id || generateId(),
      title,
      content: partial.content,
      description: partial.description || '',
      folderId: partial.folderId || null,
      tags: partial.tags || [],
      links,
      variables: partial.variables || [],
      images: partial.images || [],
      isFavorite: partial.isFavorite ?? false,
      isArchived: partial.isArchived ?? false,
      visibility: partial.visibility || 'private',
      shareSlug: partial.shareSlug,
      sourceUrl: partial.sourceUrl,
      sourceTitle: partial.sourceTitle,
      createdAt: partial.createdAt || now(),
      updatedAt: now(),
      useCount: partial.useCount ?? 0,
      syncStatus: 'local_pending',
      version: (partial.version || 0) + 1,
      type: partial.type || 'general',
    }
  }

  async function add(partial: Partial<Note> & { content: string; title?: string }) {
    const item = buildItem(partial)
    await createNote(item)
    notes.value.unshift(item)
    return item
  }

  async function update(
    id: string,
    changes: Partial<Note>
  ) {
    const existing = notes.value.find((p) => p.id === id)
    if (!existing) return
    if (changes.content && !changes.title) {
      changes.title = autoTitle(changes.content)
    }
    await createVersionSnapshot(existing, 'manual_save')
    await updateNote(id, { ...changes, syncStatus: 'local_pending' })
    Object.assign(existing, changes, { updatedAt: now(), syncStatus: 'local_pending' })
  }

  async function remove(id: string) {
    await deleteNote(id)
    const p = notes.value.find((x) => x.id === id)
    if (p) p.deletedAt = now()
  }

  async function favorite(id: string) {
    const p = notes.value.find((x) => x.id === id)
    if (!p) return
    await favoriteNote(id, !p.isFavorite)
    p.isFavorite = !p.isFavorite
  }

  async function archive(id: string) {
    const p = notes.value.find((x) => x.id === id)
    if (!p) return
    await archiveNote(id, !p.isArchived)
    p.isArchived = !p.isArchived
  }

  async function recordUse(id: string) {
    await incrementUseCount(id)
    const p = notes.value.find((x) => x.id === id)
    if (p) {
      p.useCount = (p.useCount || 0) + 1
      p.lastUsedAt = now()
    }
  }

  function getById(id: string): Note | undefined {
    return notes.value.find((p) => p.id === id)
  }

  return {
    notes,
    loaded,
    activeNotes,
    favoriteNotes,
    recentlyUsed,
    mostUsed,
    unsyncedNotes,
    archivedNotes,
    load,
    add,
    update,
    remove,
    favorite,
    archive,
    recordUse,
    getById,
  }
})
