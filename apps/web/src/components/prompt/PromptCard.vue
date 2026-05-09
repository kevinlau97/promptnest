<template>
  <div class="card group relative flex flex-col gap-3 p-4">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{{ prompt.title }}</h3>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ folderPath }}</p>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="rounded p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-amber-500 dark:hover:bg-gray-700"
          :class="prompt.isFavorite ? 'text-amber-500 opacity-100' : ''"
          @click="emit('favorite')"
        >
          <svg class="h-4 w-4" :fill="prompt.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </button>
        <button class="rounded p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" @click="emit('preview')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        </button>
        <button class="rounded p-1.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" @click="emit('edit')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </button>
      </div>
    </div>

    <p v-if="prompt.description" class="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{{ prompt.description }}</p>

    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">{{ typeLabel }}</span>
      <span v-for="tag in prompt.tags.slice(0, 3)" :key="tag" class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">#{{ tag }}</span>
      <span v-if="prompt.tags.length > 3" class="text-xs text-gray-400">+{{ prompt.tags.length - 3 }}</span>
    </div>

    <div class="mt-auto flex items-center justify-between pt-2">
      <div class="flex items-center gap-3 text-xs text-gray-400">
        <span>{{ formatRelative(prompt.updatedAt) }}</span>
        <span v-if="prompt.useCount > 0">Used {{ prompt.useCount }}x</span>
        <span v-if="prompt.syncStatus !== 'synced'" class="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{{ prompt.syncStatus }}</span>
      </div>
      <button class="btn-primary rounded-lg px-3 py-1.5 text-xs" @click="emit('copy')">
        Copy
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PromptItem } from '@/types/prompt'
import { PROMPT_TYPES } from '@/types/prompt'
import { getFolderPath } from '@/lib/db/folderRepository'
import { formatRelative } from '@/lib/utils/date'
import type { PromptFolder } from '@/types/folder'

const props = defineProps<{
  prompt: PromptItem
  folders: PromptFolder[]
}>()

const emit = defineEmits<{ (e: 'copy'): void; (e: 'edit'): void; (e: 'favorite'): void; (e: 'preview'): void }>()

const folderPath = computed(() => getFolderPath(props.folders, props.prompt.folderId))
const typeLabel = computed(() => PROMPT_TYPES.find((t) => t.value === props.prompt.type)?.label || props.prompt.type)
</script>
