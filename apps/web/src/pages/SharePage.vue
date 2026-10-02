<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto w-full max-w-3xl p-6">
      <div v-if="loading" class="py-20 text-center text-gray-400">加载中...</div>
      <div v-else-if="error" class="py-20 text-center text-red-500">{{ error }}</div>
      <div v-else-if="sharedNote" class="card p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold">{{ sharedNote?.title || '分享的笔记' }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ folderPath }} &middot; {{ typeLabel }}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-primary" @click="copyContent">复制 Note</button>
            <button class="btn-secondary" @click="copyMarkdown">复制 Markdown</button>
          </div>
        </div>

        <p v-if="sharedNote?.description" class="mb-4 text-sm text-gray-600 dark:text-gray-400">{{ sharedNote?.description }}</p>

        <div class="mb-4 flex flex-wrap gap-2">
          <span v-for="tag in sharedNote.tags" :key="tag" class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">#{{ tag }}</span>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div class="prose prose-sm max-w-none text-sm" v-html="renderedContent"></div>
        </div>

        <div v-if="sharedNote.links && sharedNote.links.length" class="mt-4">
          <h3 class="mb-2 text-sm font-semibold">Links</h3>
          <ul class="space-y-1">
            <li v-for="link in sharedNote.links" :key="link.id">
              <a :href="link.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:underline dark:text-primary-400">{{ link.title || link.url }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/lib/api/client'
import { NOTE_TYPES } from '@/types/note'
import type { Note } from '@/types/note'
import { useToast } from '@/composables/useToast'
import { useShareMeta } from '@/composables/useShareMeta'
import { renderMarkdown } from '@/composables/useMarkdown'

const route = useRoute()
const { success } = useToast()

const sharedNote = ref<Note | null>(null)
const loading = ref(true)
const error = ref('')

const folderPath = computed(() => '分享的笔记')
const renderedContent = computed(() => {
  if (!sharedNote.value) return ''
  return renderMarkdown(sharedNote.value.content || '')
})

const typeLabel = computed(() => NOTE_TYPES.find((t) => t.value === sharedNote.value?.type)?.label || sharedNote.value?.type || '')

useShareMeta(sharedNote)

onMounted(async () => {
  try {
    const slug = route.params.slug as string
    const res = await apiClient.get<{ prompt: Note }>(`/api/share/${slug}`)
    if (res.success && res.data?.prompt) {
      sharedNote.value = res.data.prompt
    } else {
      error.value = '该分享已失效'
    }
  } catch {
    error.value = '加载分享失败'
  } finally {
    loading.value = false
  }
})

function copyContent() {
  if (!sharedNote.value) return
  navigator.clipboard.writeText(sharedNote.value?.content || '')
  success('已复制')
}

function copyMarkdown() {
  if (!sharedNote.value) return
  const p = sharedNote.value
  const md = `# ${p.title}\n\n**Type:** ${p.type}\n${p.tags.length ? `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}\n` : ''}\n## Prompt\n${p.content}\n`
  navigator.clipboard.writeText(md)
  success('已复制 as Markdown')
}
</script>
