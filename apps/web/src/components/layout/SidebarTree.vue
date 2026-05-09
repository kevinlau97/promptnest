<template>
  <div class="flex h-full flex-col border-r border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
    <div class="p-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Folders</span>
        <button class="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800" @click="showNewFolder = true" title="New folder">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto px-2 pb-4">
      <div class="space-y-0.5">
        <button
          v-for="entry in quickEntries"
          :key="entry.key"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
          :class="selectedQuick === entry.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
          @click="selectQuick(entry.key)"
        >
          <span v-html="entry.icon" />
          {{ entry.label }}
          <span v-if="entry.count" class="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{{ entry.count }}</span>
        </button>
      </div>
      <div class="my-2 border-t border-gray-200 dark:border-gray-800" />
      <div class="space-y-0.5">
        <TreeNode
          v-for="node in folderStore.folderTree"
          :key="node.id"
          :node="node"
          :selected-id="selectedFolderId"
          @select="selectFolder"
        />
      </div>
    </div>

    <BaseModal v-model="showNewFolder" title="New Folder">
      <div class="space-y-3">
        <input v-model="newFolderName" class="input" placeholder="Folder name" @keyup.enter="createFolder" />
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showNewFolder = false">Cancel</button>
          <button class="btn-primary" @click="createFolder">Create</button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFolderStore } from '@/stores/folder'
import { usePromptStore } from '@/stores/prompt'
import { useSyncStore } from '@/stores/sync'
import BaseModal from '@/components/ui/BaseModal.vue'
import TreeNode from './TreeNode.vue'

const emit = defineEmits<{ (e: 'select-folder', id: string | null): void; (e: 'select-quick', key: string): void }>()

const folderStore = useFolderStore()
const promptStore = usePromptStore()
const syncStore = useSyncStore()

const selectedFolderId = ref<string | null>(null)
const selectedQuick = ref('all')

const quickEntries = computed(() => [
  { key: 'all', label: 'All Prompts', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 10h16M4 14h16M4 18h16\"/></svg>', count: promptStore.activePrompts.length },
  { key: 'favorites', label: 'Favorites', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z\"/></svg>', count: promptStore.favoritePrompts.length },
  { key: 'recent', label: 'Recently Used', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z\"/></svg>', count: promptStore.recentlyUsed.length },
  { key: 'most', label: 'Most Used', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6\"/></svg>', count: promptStore.mostUsed.length },
  { key: 'unsynced', label: 'Unsynced', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12\"/></svg>', count: syncStore.pendingCount },
  { key: 'archived', label: 'Archived', icon: '<svg class=\"h-4 w-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4\"/></svg>', count: promptStore.archivedPrompts.length },
])

function selectFolder(id: string | null) {
  selectedFolderId.value = id
  selectedQuick.value = ''
  emit('select-folder', id)
}

function selectQuick(key: string) {
  selectedQuick.value = key
  selectedFolderId.value = null
  emit('select-quick', key)
}

const showNewFolder = ref(false)
const newFolderName = ref('')

async function createFolder() {
  if (!newFolderName.value.trim()) return
  await folderStore.addFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showNewFolder.value = false
}
</script>
