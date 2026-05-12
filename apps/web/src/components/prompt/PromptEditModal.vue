<template>
  <BaseModal v-model="localOpen" :title="isEdit ? 'Edit Prompt' : 'New Prompt'" size="full">
    <div class="flex max-h-[80vh] flex-col gap-4 overflow-y-auto">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
            :class="form.isFavorite ? '' : 'text-gray-400'"
            @click="form.isFavorite = !form.isFavorite"
          >
            <svg class="h-5 w-5" :fill="form.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          </button>
          <button class="btn-secondary text-xs" :class="form.isArchived ? 'bg-gray-300 dark:bg-gray-700' : ''" @click="form.isArchived = !form.isArchived">
            {{ form.isArchived ? 'Unarchive' : 'Archive' }}
          </button>
          <button v-if="isEdit" class="btn-secondary text-xs" @click="toggleShare">
            {{ shareSlug ? 'Unshare' : 'Share' }}
          </button>
        </div>
        <button class="btn-primary text-xs" :disabled="saving || !form.content.trim()" @click="save">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>

      <div v-if="shareSlug" class="flex items-center gap-2 text-xs">
        <span class="text-gray-500">Share URL:</span>
        <code class="rounded bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ shareUrl }}</code>
        <button class="text-primary-600 hover:underline dark:text-primary-400" @click="copyShareUrl">Copy</button>
      </div>

      <div class="space-y-3">
        <input v-model="form.title" class="input text-lg font-semibold" placeholder="Title (auto-generated if empty)" />
        <input v-model="form.description" class="input" placeholder="Description (optional)" />

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select v-model="form.type" class="input">
            <option v-for="t in PROMPT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <select v-model="form.folderId" class="input">
            <option :value="null">No folder</option>
            <option v-for="f in folderStore.folders" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500">Tags</label>
          <div class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800">
            <span v-for="tag in form.tags" :key="tag" class="inline-flex items-center gap-1 rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
              #{{ tag }}
              <button class="text-primary-400 hover:text-primary-600" @click="removeTag(tag)">&times;</button>
            </span>
            <input
              v-model="tagInput"
              class="min-w-[80px] flex-1 bg-transparent text-sm outline-none"
              placeholder="Add tag..."
              @keydown.enter.prevent="addTag"
              @keydown.backspace="!tagInput && form.tags.length && removeTag(form.tags[form.tags.length - 1])"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500">Links</label>
          <div class="space-y-2">
            <div v-for="(link, i) in form.links" :key="link.id" class="flex items-center gap-2">
              <input v-model="link.title" class="input w-1/3 text-sm" placeholder="Title" />
              <input v-model="link.url" class="input flex-1 text-sm" placeholder="https://..." />
              <button class="rounded p-1 text-gray-400 hover:text-red-500" @click="form.links.splice(i, 1)">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
            <button class="btn-secondary text-xs" @click="form.links.push({ id: generateId(), url: '' })">+ Add Link</button>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500">Content</label>
          <textarea
            ref="contentTextarea"
            v-model="form.content"
            class="textarea min-h-[160px] font-mono text-sm"
            placeholder="Write your prompt here... (paste or drop images)"
            required
            @paste="handlePaste"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            :class="isDragging ? 'ring-2 ring-primary-400' : ''"
          />
          <div v-if="imageLoading" class="mt-1 text-xs text-primary-600 dark:text-primary-400">
            Processing image...
          </div>
        </div>

        <div v-if="form.images.length" class="space-y-2">
          <label class="mb-1 block text-xs font-medium text-gray-500">Images</label>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-5">
            <div
              v-for="(url, i) in form.images"
              :key="url + i"
              class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img :src="url" class="h-full w-full object-cover" />
              <button
                class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                @click="removeImage(i)"
              >
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <BaseToast />
    <BaseConfirm
      v-model="confirmState.visible"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :variant="confirmState.variant"
      @confirm="confirmClose(true)"
      @cancel="confirmClose(false)"
    />
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { usePromptStore } from '@/stores/prompt'
import { useFolderStore } from '@/stores/folder'
import { useToast } from '@/composables/useToast'
import { useImageUpload } from '@/composables/useImageUpload'
import { useConfirm } from '@/composables/useConfirm'
import { useAutoResize } from '@/composables/useAutoResize'
import { PROMPT_TYPES } from '@/types/prompt'
import { generateId, generateSlug } from '@/lib/utils/id'
import { apiClient } from '@/lib/api/client'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseToast from '@/components/ui/BaseToast.vue'
import BaseConfirm from '@/components/ui/BaseConfirm.vue'

const props = defineProps<{
  modelValue: boolean
  promptId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const promptStore = usePromptStore()
const folderStore = useFolderStore()
const { success, error: toastError } = useToast()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.promptId)

const shareUrl = computed(() => {
  if (!shareSlug.value) return ''
  const base = window.location.origin
  return `${base}/share/${shareSlug.value}`
})

const saving = ref(false)
const shareSlug = ref('')
const tagInput = ref('')
const isDragging = ref(false)

const { loading: imageLoading, uploadImage } = useImageUpload()

const form = reactive({
  title: '',
  content: '',
  description: '',
  type: 'other' as import('@/types/prompt').PromptType,
  folderId: null as string | null,
  tags: [] as string[],
  links: [] as { id: string; title?: string; url: string }[],
  images: [] as string[],
  isFavorite: false,
  isArchived: false,
})

const contentTextarea = ref<HTMLTextAreaElement>()
const { resize: resizeTextarea, init: initTextarea } = useAutoResize(contentTextarea, 8, 30)
watch(() => form.content, () => {
  resizeTextarea()
})

watch(localOpen, (open) => {
  if (open) {
    initForm()
  }
})

function initForm() {
  tagInput.value = ''
  shareSlug.value = ''
  if (isEdit.value && props.promptId) {
    const p = promptStore.getById(props.promptId)
    if (p) {
      form.title = p.title
      form.content = p.content
      form.description = p.description || ''
      form.type = p.type
      form.folderId = p.folderId || null
      form.tags = [...p.tags]
      form.links = p.links.map((l) => ({ ...l }))
      form.images = p.images || []
      form.isFavorite = p.isFavorite
      form.isArchived = p.isArchived
      shareSlug.value = p.shareSlug || ''
    }
  } else {
    form.title = ''
    form.content = ''
    form.description = ''
    form.type = 'other'
    form.folderId = null
    form.tags = []
    form.links = []
    form.images = []
    form.isFavorite = false
    form.isArchived = false
  }
  initTextarea()
}

function addTag() {
  const t = tagInput.value.trim()
  if (t && !form.tags.includes(t)) form.tags.push(t)
  tagInput.value = ''
}

function removeTag(tag: string) {
  const idx = form.tags.indexOf(tag)
  if (idx > -1) form.tags.splice(idx, 1)
}

async function save() {
  if (!form.content.trim()) {
    toastError('Content is required')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && props.promptId) {
      await promptStore.update(props.promptId, {
        title: form.title,
        content: form.content,
        description: form.description,
        type: form.type,
        folderId: form.folderId,
        tags: [...form.tags],
        links: form.links.map((l) => ({ ...l })),
        images: [...form.images],
        isFavorite: form.isFavorite,
        isArchived: form.isArchived,
      })
    } else {
      await promptStore.add({
        title: form.title,
        content: form.content,
        description: form.description,
        type: form.type,
        folderId: form.folderId,
        tags: [...form.tags],
        links: form.links.map((l) => ({ ...l })),
        images: [...form.images],
        isFavorite: form.isFavorite,
        isArchived: form.isArchived,
      })
    }
    success('Saved')
    emit('saved')
    localOpen.value = false
  } catch (e) {
    toastError('Save failed')
  } finally {
    saving.value = false
  }
}

function copyShareUrl() {
  if (!shareUrl.value) return
  navigator.clipboard.writeText(shareUrl.value)
  success('Share link copied')
}

async function toggleShare() {
  if (!isEdit.value || !props.promptId) return
  if (shareSlug.value) {
    await apiClient.post('/api/share/cancel', { id: props.promptId })
    shareSlug.value = ''
    success('Share cancelled')
  } else {
    const slug = generateSlug()
    await apiClient.post('/api/share/create', { id: props.promptId, slug })
    shareSlug.value = slug
    success('Share link created')
  }
}

async function handlePaste(e: ClipboardEvent) {
  const files = e.clipboardData?.files
  if (!files || files.length === 0) return
  const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'))
  if (!imageFile) return
  e.preventDefault()
  await processImageFile(imageFile)
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'))
  if (!imageFile) return
  e.preventDefault()
  await processImageFile(imageFile)
}

async function processImageFile(file: File) {
  try {
    const url = await uploadImage(file)
    form.images.push(url)
    success('Image uploaded')
  } catch (e: any) {
    toastError(e?.message || 'Image upload failed')
  }
}

function removeImage(index: number) {
  form.images.splice(index, 1)
}

const { state: confirmState, close: confirmClose } = useConfirm()
</script>
