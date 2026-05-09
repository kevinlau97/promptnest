<template>
  <div class="flex items-center gap-3 rounded-lg border-b border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3 class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ prompt.title }}</h3>
        <span class="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{{ typeLabel }}</span>
      </div>
      <div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
        <span class="truncate">{{ folderPath }}</span>
        <span v-for="tag in prompt.tags.slice(0, 2)" :key="tag" class="text-primary-600 dark:text-primary-400">#{{ tag }}</span>
        <span>{{ formatRelative(prompt.updatedAt) }}</span>
      </div>
    </div>
    <button class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700" @click="emit('preview')">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
    </button>
    <button class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700" @click="emit('copy')">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
    </button>
    <button class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700" @click="emit('edit')">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
    </button>
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

const emit = defineEmits<{ (e: 'copy'): void; (e: 'edit'): void; (e: 'preview'): void }>()

const folderPath = computed(() => getFolderPath(props.folders, props.prompt.folderId))
const typeLabel = computed(() => PROMPT_TYPES.find((t) => t.value === props.prompt.type)?.label || props.prompt.type)
</script>
