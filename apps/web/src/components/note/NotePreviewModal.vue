<template>
  <BaseModal :model-value="modelValue" :title="note?.title || '预览'" @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="note" class="h-full flex flex-col space-y-3 md:space-y-4">
      <!-- 元信息行 -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">{{ typeLabel }}</span>
        <span v-if="folderPath" class="text-xs text-gray-500 truncate max-w-[200px]">{{ folderPath }}</span>
      </div>

      <p v-if="note.description" class="text-sm text-gray-600 dark:text-gray-400 shrink-0">{{ note.description }}</p>

      <!-- 图片展示 -->
      <div v-if="note.images?.length" class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 shrink-0">
        <div
          v-for="(img, idx) in note.images"
          :key="img.url"
          class="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:border-primary-300 cursor-pointer dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-primary-600"
          @click="openImagePreview(idx)"
        >
          <img
            :src="img.url" crossorigin="anonymous"
            :alt="img.filename || 'Image'"
            class="h-28 md:h-40 w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <svg class="h-6 w-6 md:h-8 md:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto min-h-0 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
        <div class="prose prose-sm max-w-none dark:prose-invert text-sm
  prose-img:rounded-lg
  prose-img:border
  prose-img:border-gray-200
  prose-img:dark:border-gray-700
  prose-img:shadow-sm
  prose-img:max-w-full
  prose-img:h-auto
  prose-img:cursor-pointer"
  v-html="renderedContent"
  @click="handleContentImageClick"></div>
      </div>

      <!-- Variables -->
      <div v-if="note.variables?.length" class="space-y-2 shrink-0">
        <label class="text-xs font-medium text-gray-500">Variables</label>
        <div v-for="v in note.variables" :key="v.id" class="flex items-center gap-2">
          <span class="text-xs font-mono text-primary-600 dark:text-primary-400">{{ v.name }}</span>
          <input v-model="varValues[v.name]" class="input flex-1 text-sm" :placeholder="v.defaultValue || 'Value...'" />
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <div class="prose prose-sm max-w-none dark:prose-invert text-sm
  prose-img:rounded-lg
  prose-img:border
  prose-img:border-gray-200
  prose-img:dark:border-gray-700
  prose-img:shadow-sm
  prose-img:max-w-full
  prose-img:h-auto"
  v-html="renderMarkdown(finalContent)"></div>
        </div>
      </div>

      <!-- Links -->
      <div v-if="note.links.length" class="space-y-1 shrink-0">
        <label class="text-xs font-medium text-gray-500">Links</label>
        <div v-for="link in note.links" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:underline dark:text-primary-400">{{ link.title || link.url }}</a>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-wrap gap-2 pt-2 shrink-0">
        <button class="btn-primary text-sm" @click="copyContent">复制</button>
        <button class="btn-secondary text-sm" @click="copyMarkdown">Markdown</button>
        <button class="btn-secondary text-sm" @click="handleEdit">编辑</button>
        <button class="btn-secondary text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" @click="handleDelete">删除</button>
      </div>
    </div>
  </BaseModal>

  <!-- 图片全屏预览 -->
  <Teleport to="body">
    <transition name="fade">
      <div v-if="imagePreviewVisible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" @click.self="closeImagePreview">
        <!-- 关闭按钮 -->
        <button class="absolute top-3 right-3 md:top-4 md:right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors z-10" @click="closeImagePreview">
          <svg class="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <!-- 上一张 -->
        <button v-if="note?.images && note.images.length > 1" class="absolute left-2 md:left-4 rounded-full bg-white/10 p-2 md:p-3 text-white hover:bg-white/20 transition-colors" @click.stop="prevImage">
          <svg class="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <!-- 下一张 -->
        <button v-if="note?.images && note.images.length > 1" class="absolute right-2 md:right-4 rounded-full bg-white/10 p-2 md:p-3 text-white hover:bg-white/20 transition-colors" @click.stop="nextImage">
          <svg class="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <!-- 图片 -->
        <img
          v-if="currentPreviewImage"
          :src="currentPreviewImage"
          crossorigin="anonymous"
          class="max-h-[85vh] md:max-h-[90vh] max-w-[95vw] md:max-w-[90vw] object-contain select-none"
          draggable="false"
          @click.stop
        />
        <!-- 图片计数 -->
        <div v-if="note?.images && note.images.length > 1" class="absolute bottom-3 md:bottom-4 text-white/70 text-sm">
          {{ currentImageIndex + 1 }} / {{ note.images.length }}
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { NOTE_TYPES } from '@/types/note'
import type { Note } from '@/types/note'
import { getFolderPath } from '@/lib/db/folderRepository'
import type { PromptFolder } from '@/types/folder'
import { useToast } from '@/composables/useToast'
import { renderMarkdown } from '@/composables/useMarkdown'

const props = defineProps<{
  modelValue: boolean
  note?: Note
  folders: PromptFolder[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
}>()

// 图片预览相关状态
const imagePreviewVisible = ref(false)
const currentImageIndex = ref(0)

const currentPreviewImage = computed(() => {
  if (!props.note?.images?.length) return null
  return props.note.images[currentImageIndex.value]?.url || null
})

function openImagePreview(index: number) {
  currentImageIndex.value = index
  imagePreviewVisible.value = true
}

function closeImagePreview() {
  imagePreviewVisible.value = false
}

function prevImage() {
  if (!props.note?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + props.note.images.length) % props.note.images.length
}

function nextImage() {
  if (!props.note?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % props.note.images.length
}

function handleContentImageClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'IMG') {
    const imgSrc = (target as HTMLImageElement).src
    if (props.note?.images) {
      const idx = props.note.images.findIndex(img => img.url === imgSrc)
      if (idx >= 0) {
        openImagePreview(idx)
        return
      }
    }
    window.open(imgSrc, '_blank')
  }
}

function handleEdit() {
  if (!props.note) return
  emit('update:modelValue', false)
  nextTick(() => {
    emit('edit', props.note!.id)
  })
}

function handleDelete() {
  if (!props.note) return
  if (!confirm('确定要删除这条笔记吗？')) return
  emit('delete', props.note.id)
  emit('update:modelValue', false)
}

const { success } = useToast()

const varValues = ref<Record<string, string>>({})

const renderedContent = computed(() => {
  if (!props.note) return ''
  return renderMarkdown(finalContent.value)
})

const typeLabel = computed(() => {
  if (!props.note) return ''
  return NOTE_TYPES.find((t) => t.value === props.note!.type)?.label || props.note!.type
})

const folderPath = computed(() => {
  if (!props.note) return ''
  return getFolderPath(props.folders, props.note.folderId)
})

const finalContent = computed(() => {
  if (!props.note) return ''
  let result = props.note.content
  for (const [name, val] of Object.entries(varValues.value)) {
    const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
    result = result.replace(regex, val || `{{${name}}}`)
  }
  return result
})

function copyContent() {
  if (!props.note) return
  navigator.clipboard.writeText(props.note.content)
  success('已复制')
}

function copyMarkdown() {
  if (!props.note) return
  const p = props.note
  const path = folderPath.value
  const md = `# ${p.title}\n\n**Path:** ${path}\n**Type:** ${p.type}\n${p.tags.length ? `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}\n` : ''}\n## Prompt\n${p.content}\n`
  navigator.clipboard.writeText(md)
  success('已复制 as Markdown')
}
</script>
