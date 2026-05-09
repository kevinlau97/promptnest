import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  favoritePrompt,
  archivePrompt,
  incrementUseCount,
} from '@/lib/db/promptRepository'
import { createVersionSnapshot } from '@/lib/db/versionRepository'
import type { PromptItem } from '@/types/prompt'
import { generateId } from '@/lib/utils/id'
import { now } from '@/lib/utils/date'
import { autoTitle, extractUrls } from '@/lib/utils/text'

export const usePromptStore = defineStore('prompt', () => {
  const prompts = ref<PromptItem[]>([])
  const loaded = ref(false)

  const activePrompts = computed(() =>
    prompts.value.filter((p) => !p.deletedAt && !p.isArchived)
  )

  const favoritePrompts = computed(() =>
    activePrompts.value.filter((p) => p.isFavorite)
  )

  const recentlyUsed = computed(() =>
    [...activePrompts.value]
      .filter((p) => p.lastUsedAt)
      .sort((a, b) => (b.lastUsedAt || '').localeCompare(a.lastUsedAt || ''))
  )

  const mostUsed = computed(() =>
    [...activePrompts.value].sort((a, b) => b.useCount - a.useCount)
  )

  const unsyncedPrompts = computed(() =>
    prompts.value.filter((p) => p.syncStatus === 'local_pending' || p.syncStatus === 'conflict')
  )

  const archivedPrompts = computed(() =>
    prompts.value.filter((p) => p.isArchived && !p.deletedAt)
  )

  async function load() {
    prompts.value = await getAllPrompts()
    loaded.value = true
  }

  function buildItem(partial: Partial<PromptItem> & { content: string; title?: string }): PromptItem {
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
      type: partial.type || 'other',
      folderId: partial.folderId || null,
      tags: partial.tags || [],
      links,
      variables: partial.variables || [],
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
    }
  }

  async function add(partial: Partial<PromptItem> & { content: string; title?: string }) {
    const item = buildItem(partial)
    await createPrompt(item)
    prompts.value.unshift(item)
    return item
  }

  async function update(
    id: string,
    changes: Partial<PromptItem>
  ) {
    const existing = prompts.value.find((p) => p.id === id)
    if (!existing) return
    if (changes.content && !changes.title) {
      changes.title = autoTitle(changes.content)
    }
    await createVersionSnapshot(existing, 'manual_save')
    await updatePrompt(id, { ...changes, syncStatus: 'local_pending' })
    Object.assign(existing, changes, { updatedAt: now(), syncStatus: 'local_pending' })
  }

  async function remove(id: string) {
    await deletePrompt(id)
    const p = prompts.value.find((x) => x.id === id)
    if (p) p.deletedAt = now()
  }

  async function favorite(id: string) {
    const p = prompts.value.find((x) => x.id === id)
    if (!p) return
    await favoritePrompt(id, !p.isFavorite)
    p.isFavorite = !p.isFavorite
  }

  async function archive(id: string) {
    const p = prompts.value.find((x) => x.id === id)
    if (!p) return
    await archivePrompt(id, !p.isArchived)
    p.isArchived = !p.isArchived
  }

  async function recordUse(id: string) {
    await incrementUseCount(id)
    const p = prompts.value.find((x) => x.id === id)
    if (p) {
      p.useCount = (p.useCount || 0) + 1
      p.lastUsedAt = now()
    }
  }

  function getById(id: string): PromptItem | undefined {
    return prompts.value.find((p) => p.id === id)
  }

  return {
    prompts,
    loaded,
    activePrompts,
    favoritePrompts,
    recentlyUsed,
    mostUsed,
    unsyncedPrompts,
    archivedPrompts,
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
