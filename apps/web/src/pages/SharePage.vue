<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <div class="mx-auto w-full max-w-3xl p-6">
      <div v-if="loading" class="py-20 text-center text-gray-400">Loading...</div>
      <div v-else-if="error" class="py-20 text-center text-red-500">{{ error }}</div>
      <div v-else-if="prompt" class="card p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold">{{ prompt.title }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ folderPath }} &middot; {{ typeLabel }}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-primary" @click="copyContent">Copy Prompt</button>
            <button class="btn-secondary" @click="copyMarkdown">Copy Markdown</button>
          </div>
        </div>

        <p v-if="prompt.description" class="mb-4 text-sm text-gray-600 dark:text-gray-400">{{ prompt.description }}</p>

        <div class="mb-4 flex flex-wrap gap-2">
          <span v-for="tag in prompt.tags" :key="tag" class="rounded-md bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">#{{ tag }}</span>
        </div>

        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ prompt.content }}</pre>
        </div>

        <div v-if="prompt.links.length" class="mt-4">
          <h3 class="mb-2 text-sm font-semibold">Links</h3>
          <ul class="space-y-1">
            <li v-for="link in prompt.links" :key="link.id">
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
import { PROMPT_TYPES } from '@/types/prompt'
import type { PromptItem } from '@/types/prompt'
import { useToast } from '@/composables/useToast'
import { useShareMeta } from '@/composables/useShareMeta'

const route = useRoute()
const { success } = useToast()

const prompt = ref<PromptItem | null>(null)
const loading = ref(true)
const error = ref('')

const folderPath = computed(() => 'Shared Prompt')
const typeLabel = computed(() => PROMPT_TYPES.find((t) => t.value === prompt.value?.type)?.label || prompt.value?.type || '')

useShareMeta(prompt)

onMounted(async () => {
  try {
    const slug = route.params.slug as string
    const res = await apiClient.get<{ prompt: PromptItem }>(`/api/share/${slug}`)
    if (res.success && res.data?.prompt) {
      prompt.value = res.data.prompt
    } else {
      error.value = 'This shared prompt is no longer available'
    }
  } catch {
    error.value = 'Failed to load shared prompt'
  } finally {
    loading.value = false
  }
})

function copyContent() {
  if (!prompt.value) return
  navigator.clipboard.writeText(prompt.value.content)
  success('Copied')
}

function copyMarkdown() {
  if (!prompt.value) return
  const p = prompt.value
  const md = `# ${p.title}\n\n**Type:** ${p.type}\n${p.tags.length ? `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}\n` : ''}\n## Prompt\n${p.content}\n`
  navigator.clipboard.writeText(md)
  success('Copied as Markdown')
}
</script>
