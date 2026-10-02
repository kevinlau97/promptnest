<template>
  <div class="card group relative flex flex-col gap-3 p-4 cursor-pointer" @click="handleClick" @dblclick="handleDblClick">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{{ note.title }}</h3>
        <p v-if="folderPath" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ folderPath }}</p>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="rounded p-1.5 text-gray-400 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-gray-100 hover:text-amber-500 dark:hover:bg-gray-700"
          :class="note.isFavorite ? 'text-amber-500 opacity-100' : ''"
          @click.stop="emit('favorite')"
        >
          <svg class="h-4 w-4" :fill="note.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
        </button>
        <button class="rounded p-1.5 text-gray-400 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" @click.stop="emit('preview')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
        </button>
        <button class="rounded p-1.5 text-gray-400 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200" @click.stop="emit('edit')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </button>
        <button class="rounded p-1.5 text-gray-400 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700 dark:hover:text-red-400" title="删除" @click.stop="emit('delete')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>

    <div v-if="note.content" class="prose prose-sm max-w-none dark:prose-invert text-xs line-clamp-5 overflow-hidden text-gray-700 dark:text-gray-300 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-primary-400" v-html="renderMarkdown(note.content)" @click.stop></div>

    <!-- 图片缩略图 -->
    <div v-if="note.images?.length" class="flex gap-2 overflow-hidden">
      <div
        v-for="(img, idx) in note.images.slice(0, 3)"
        :key="img.url"
        class="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      >
        <img :src="img.url" class="h-full w-full object-cover" crossorigin="anonymous" />
        <span v-if="idx === 2 && note.images.length > 3" class="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">+{{ note.images.length - 3 }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">{{ typeLabel }}</span>
      <button v-for="tag in note.tags.slice(0, 3)" :key="tag" class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40" @click.stop="emit('tag-click', tag)">#{{ tag }}</button>
      <span v-if="note.tags.length > 3" class="text-xs text-gray-400">+{{ note.tags.length - 3 }}</span>
    </div>

    <div class="mt-auto flex items-center justify-between pt-2">
      <div class="flex items-center gap-3 text-xs text-gray-400">
        <span>{{ formatRelative(note.updatedAt) }}</span>

        <span v-if="note.syncStatus !== 'synced'" class="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">{{ note.syncStatus }}</span>
      </div>
      <button class="btn-primary rounded-lg px-3 py-1.5 text-xs" @click.stop="emit('copy')">
        复制
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { Note } from '@/types/note'
import { NOTE_TYPES } from '@/types/note'
import { getFolderPath } from '@/lib/db/folderRepository'
import { formatRelative } from '@/lib/utils/date'
import type { PromptFolder } from '@/types/folder'

// Configure marked to open links in new tab
marked.setOptions({ breaks: true, gfm: true })

// Custom extension for target="_blank"
const targetBlankExtension = {
  name: 'link',
  renderer(token: any) {
    const href = token.href
    const title = token.title ? ` title="${token.title}"` : ''
    const text = token.text || href
    return `<a href="${href}"${title} target="_blank" rel="noopener noreferrer">${text}</a>`
  }
}

marked.use({ extensions: [targetBlankExtension] })

function renderMarkdown(md: string): string {
  return marked(md) as string
}

const props = defineProps<{
  note: Note
  folders: PromptFolder[]
}>()

const emit = defineEmits<{ (e: 'copy'): void; (e: 'delete'): void; (e: 'edit'): void; (e: 'favorite'): void; (e: 'preview'): void; (e: 'tag-click', tag: string): void }>()

// Click state for double-click detection
let clickTimeout: any = null


const folderPath = computed(() => getFolderPath(props.folders, props.note.folderId))
const typeLabel = computed(() => NOTE_TYPES.find((t) => t.value === props.note.type)?.label || props.note.type)

function handleClick() {
  if (clickTimeout) {
    clearTimeout(clickTimeout)
  }
  clickTimeout = setTimeout(() => {
    emit('preview')
  }, 200)
}

function handleDblClick() {
  if (clickTimeout) {
    clearTimeout(clickTimeout)
    clickTimeout = null
  }
  emit('preview')
}
</script>
