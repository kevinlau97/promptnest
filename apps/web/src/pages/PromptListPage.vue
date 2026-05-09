<template>
  <AppLayout>
    <template #sidebar>
      <aside class="hidden w-60 shrink-0 md:block">
        <SidebarTree class="h-full" @select-folder="onSelectFolder" @select-quick="onSelectQuick" />
      </aside>
    </template>
    <div class="flex h-full flex-col">
      <!-- Top bar -->
      <div class="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <button class="rounded-lg p-2 hover:bg-gray-100 md:hidden dark:hover:bg-gray-800" @click="showDrawer = true">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input v-model="searchQuery" class="input w-full pl-9 pr-8" placeholder="Search prompts... (Cmd+K)" />
          <button v-if="searchQuery" class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" @click="searchQuery = ''">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <button class="btn-primary hidden md:inline-flex" @click="showCapture = true">
          <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          New
        </button>
        <button class="btn-secondary rounded-lg p-2" title="Sync" @click="handleSync">
          <svg class="h-5 w-5" :class="syncStore.isSyncing ? 'animate-spin' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-2 overflow-x-auto border-b border-gray-200 bg-gray-50/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/50">
        <button
          v-for="t in typeFilters"
          :key="t.value"
          class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          :class="selectedTypes.includes(t.value) ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
          @click="toggleType(t.value)"
        >
          {{ t.label }}
        </button>
        <div class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <select v-model="sortBy" class="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800">
          <option value="updatedAt">Recently Updated</option>
          <option value="createdAt">Created</option>
          <option value="lastUsedAt">Recently Used</option>
          <option value="useCount">Most Used</option>
          <option value="title">Title</option>
        </select>
        <button class="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" @click="sortDesc = !sortDesc">
          <svg class="h-4 w-4" :class="sortDesc ? '' : 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
        </button>
        <div class="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-700" />
        <button
          class="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          :class="viewMode === 'card' ? 'bg-gray-200 dark:bg-gray-700' : ''"
          @click="viewMode = 'card'"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
        </button>
        <button
          class="rounded p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          :class="viewMode === 'compact' ? 'bg-gray-200 dark:bg-gray-700' : ''"
          @click="viewMode = 'compact'"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="viewMode === 'card'" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PromptCard
            v-for="p in sortedPrompts"
            :key="p.id"
            :prompt="p"
            :folders="folderStore.folders"
            @copy="copyPrompt(p)"
            @edit="router.push(`/prompts/${p.id}`)"
            @favorite="promptStore.favorite(p.id)"
            @preview="previewPrompt = p; showPreview = true"
          />
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <PromptCompactItem
            v-for="p in sortedPrompts"
            :key="p.id"
            :prompt="p"
            :folders="folderStore.folders"
            @copy="copyPrompt(p)"
            @edit="router.push(`/prompts/${p.id}`)"
            @preview="previewPrompt = p; showPreview = true"
          />
        </div>
        <div v-if="sortedPrompts.length === 0" class="mt-20 flex flex-col items-center text-center text-gray-400">
          <svg class="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          <p class="text-sm font-medium">No prompts found</p>
          <p class="mt-1 text-xs">Try adjusting your search or create a new prompt</p>
          <button class="btn-primary mt-4" @click="showCapture = true">
            <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            New Prompt
          </button>
        </div>
      </div>
    </div>

    <QuickCaptureModal v-model="showCapture" />
    <MobileFolderDrawer v-model="showDrawer" @select-folder="onSelectFolder" @select-quick="onSelectQuick" />
    <CommandPalette v-model="paletteOpen" :items="paletteItems" />
    <PromptPreviewModal v-model="showPreview" :prompt="previewPrompt" :folders="folderStore.folders" />
    <BaseToast />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { usePromptStore } from '@/stores/prompt'
import { useFolderStore } from '@/stores/folder'
import { useSyncStore } from '@/stores/sync'
import { useSettingsStore } from '@/stores/settings'
import { usePromptSearch } from '@/composables/usePromptSearch'
import { useToast } from '@/composables/useToast'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { syncAll } from '@/lib/sync/syncService'
import AppLayout from '@/components/layout/AppLayout.vue'
import PromptCard from '@/components/prompt/PromptCard.vue'
import PromptCompactItem from '@/components/prompt/PromptCompactItem.vue'
import QuickCaptureModal from '@/components/prompt/QuickCaptureModal.vue'
import SidebarTree from '@/components/layout/SidebarTree.vue'
import MobileFolderDrawer from '@/components/layout/MobileFolderDrawer.vue'
import CommandPalette from '@/components/prompt/CommandPalette.vue'
import PromptPreviewModal from '@/components/prompt/PromptPreviewModal.vue'
import BaseToast from '@/components/ui/BaseToast.vue'

const router = useRouter()
const promptStore = usePromptStore()
const folderStore = useFolderStore()
const syncStore = useSyncStore()
const settings = useSettingsStore()
const { success, error } = useToast()

const searchQuery = ref('')
const debouncedQuery = ref('')
const showCapture = ref(false)
const showDrawer = ref(false)
const showPreview = ref(false)
const previewPrompt = ref<import('@/types/prompt').PromptItem | undefined>()
const selectedFolderId = ref<string | null>(null)
const selectedQuick = ref('all')
const selectedTypes = ref<string[]>([])
const viewMode = ref<'card' | 'compact'>(settings.viewMode)
const sortBy = ref(settings.sortBy)
const sortDesc = ref(settings.sortDesc)

const palette = useCommandPalette(
  computed(() => promptStore.activePrompts),
  (id) => router.push(`/prompts/${id}`),
  () => showCapture.value = true,
  () => router.push('/settings'),
  handleSync
)
const paletteOpen = palette.open
const paletteItems = ref<import('@/composables/useCommandPalette').PaletteItem[]>([])
watchEffect(() => {
  paletteItems.value = palette.items.value
})

const debounceSearch = useDebounceFn((q: string) => {
  debouncedQuery.value = q
}, 100)

watch(searchQuery, (q) => debounceSearch(q))

const typeFilters = [
  { value: 'chat', label: 'AI Chat' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'code', label: 'Code' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Research' },
  { value: 'seo', label: 'SEO' },
  { value: 'other', label: 'Other' },
]

onMounted(async () => {
  await settings.load()
  viewMode.value = settings.viewMode
  sortBy.value = settings.sortBy
  sortDesc.value = settings.sortDesc
  if (!promptStore.loaded) await promptStore.load()
  if (!folderStore.loaded) await folderStore.load()
  syncStore.setPending(promptStore.unsyncedPrompts.length)
})

const filters = computed(() => ({
  query: debouncedQuery.value,
  folderId: selectedFolderId.value,
  tags: [],
  types: selectedTypes.value,
  favoriteOnly: selectedQuick.value === 'favorites',
  archivedOnly: selectedQuick.value === 'archived',
  unsyncedOnly: selectedQuick.value === 'unsynced',
}))

const { filtered } = usePromptSearch(
  computed(() => {
    if (selectedQuick.value === 'favorites') return promptStore.favoritePrompts
    if (selectedQuick.value === 'recent') return promptStore.recentlyUsed
    if (selectedQuick.value === 'most') return promptStore.mostUsed
    if (selectedQuick.value === 'archived') return promptStore.archivedPrompts
    if (selectedQuick.value === 'unsynced') return promptStore.unsyncedPrompts
    return promptStore.activePrompts
  }),
  computed(() => folderStore.folders),
  filters
)

const sortedPrompts = computed(() => {
  const list = [...filtered.value]
  list.sort((a, b) => {
    let av: string | number = ''
    let bv: string | number = ''
    switch (sortBy.value) {
      case 'title':
        av = a.title
        bv = b.title
        break
      case 'useCount':
        av = a.useCount || 0
        bv = b.useCount || 0
        break
      case 'lastUsedAt':
        av = a.lastUsedAt || ''
        bv = b.lastUsedAt || ''
        break
      case 'createdAt':
        av = a.createdAt
        bv = b.createdAt
        break
      case 'updatedAt':
      default:
        av = a.updatedAt
        bv = b.updatedAt
    }
    if (av < bv) return sortDesc.value ? 1 : -1
    if (av > bv) return sortDesc.value ? -1 : 1
    return 0
  })
  return list
})

function onSelectFolder(id: string | null) {
  selectedFolderId.value = id
  selectedQuick.value = 'all'
}

function onSelectQuick(key: string) {
  selectedQuick.value = key
  selectedFolderId.value = null
}

function toggleType(type: string) {
  const idx = selectedTypes.value.indexOf(type)
  if (idx > -1) selectedTypes.value.splice(idx, 1)
  else selectedTypes.value.push(type)
}

function copyPrompt(p: import('@/types/prompt').PromptItem) {
  navigator.clipboard.writeText(p.content)
  promptStore.recordUse(p.id)
  success('Copied to clipboard')
}

async function handleSync() {
  syncStore.setSyncing(true)
  try {
    await syncAll()
    await promptStore.load()
    await folderStore.load()
    syncStore.setPending(0)
    success('Synced')
  } catch {
    error('Sync failed')
  } finally {
    syncStore.setSyncing(false)
  }
}

useKeyboardShortcuts({
  onNew: () => showCapture.value = true,
  onPalette: () => paletteOpen.value = true,
})

watch([viewMode, sortBy, sortDesc], () => {
  settings.save({ viewMode: viewMode.value, sortBy: sortBy.value, sortDesc: sortDesc.value })
})
</script>
