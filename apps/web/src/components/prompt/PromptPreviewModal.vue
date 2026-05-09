<template>
  <BaseModal :model-value="modelValue" :title="prompt?.title || 'Preview'" @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="prompt" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">{{ typeLabel }}</span>
        <span class="text-xs text-gray-500">{{ folderPath }}</span>
      </div>

      <p v-if="prompt.description" class="text-sm text-gray-600 dark:text-gray-400">{{ prompt.description }}</p>

      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ prompt.content }}</pre>
      </div>

      <div v-if="prompt.variables?.length" class="space-y-2">
        <label class="text-xs font-medium text-gray-500">Variables</label>
        <div v-for="v in prompt.variables" :key="v.id" class="flex items-center gap-2">
          <span class="text-xs font-mono text-primary-600 dark:text-primary-400">{{ v.name }}</span>
          <input v-model="varValues[v.name]" class="input flex-1 text-sm" :placeholder="v.defaultValue || 'Value...'" />
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ finalContent }}</pre>
        </div>
      </div>

      <div v-if="prompt.links.length" class="space-y-1">
        <label class="text-xs font-medium text-gray-500">Links</label>
        <div v-for="link in prompt.links" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:underline dark:text-primary-400">{{ link.title || link.url }}</a>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pt-2">
        <button class="btn-primary" @click="copyContent">Copy Content</button>
        <button class="btn-secondary" @click="copyMarkdown">Copy as Markdown</button>
        <button class="btn-secondary" @click="$router.push(`/prompts/${prompt.id}`)">Edit</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { PROMPT_TYPES } from '@/types/prompt'
import type { PromptItem } from '@/types/prompt'
import { getFolderPath } from '@/lib/db/folderRepository'
import type { PromptFolder } from '@/types/folder'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  modelValue: boolean
  prompt?: PromptItem
  folders: PromptFolder[]
}>()

const { success } = useToast()
// Router available in template as $router

const varValues = ref<Record<string, string>>({})

const typeLabel = computed(() => {
  if (!props.prompt) return ''
  return PROMPT_TYPES.find((t) => t.value === props.prompt!.type)?.label || props.prompt!.type
})

const folderPath = computed(() => {
  if (!props.prompt) return ''
  return getFolderPath(props.folders, props.prompt.folderId)
})

const finalContent = computed(() => {
  if (!props.prompt) return ''
  let result = props.prompt.content
  for (const [name, val] of Object.entries(varValues.value)) {
    const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
    result = result.replace(regex, val || `{{${name}}}`)
  }
  return result
})

function copyContent() {
  if (!props.prompt) return
  navigator.clipboard.writeText(props.prompt.content)
  success('Copied')
}

function copyMarkdown() {
  if (!props.prompt) return
  const p = props.prompt
  const path = folderPath.value
  const md = `# ${p.title}\n\n**Path:** ${path}\n**Type:** ${p.type}\n${p.tags.length ? `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}\n` : ''}\n## Prompt\n${p.content}\n`
  navigator.clipboard.writeText(md)
  success('Copied as Markdown')
}
</script>
