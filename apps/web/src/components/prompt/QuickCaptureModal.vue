<template>
  <BaseModal v-model="localOpen" title="Quick Capture">
    <form class="space-y-3" @submit.prevent="save">
      <input v-model="form.title" class="input" placeholder="Title (optional)" />
      <textarea
        ref="contentRef"
        v-model="form.content"
        class="textarea h-32"
        placeholder="Paste your prompt here... (paste images)"
        required
        @paste="handlePaste"
      />
      <div class="grid grid-cols-2 gap-3">
        <select v-model="form.type" class="input">
          <option v-for="t in PROMPT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="form.folderId" class="input">
          <option :value="null">No folder</option>
          <option v-for="f in flatFolders" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <input v-model="tagInput" class="input" placeholder="Tags (comma separated)" />
      <input v-model="form.sourceUrl" class="input" placeholder="Source URL (optional)" />
      <div v-if="form.images.length" class="space-y-2">
        <label class="mb-1 block text-xs font-medium text-gray-500">Images</label>
        <div class="grid grid-cols-4 gap-2">
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
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="localOpen = false">Cancel</button>
        <button type="submit" class="btn-primary" :disabled="!form.content.trim()">Save</button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { PROMPT_TYPES } from '@/types/prompt'
import { useFolderStore } from '@/stores/folder'
import { usePromptStore } from '@/stores/prompt'
import { useToast } from '@/composables/useToast'
import { useImageUpload } from '@/composables/useImageUpload'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const folderStore = useFolderStore()
const promptStore = usePromptStore()
const { success, error: toastError } = useToast()
const { uploadImage } = useImageUpload()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const flatFolders = computed(() => folderStore.folders)

const form = ref({
  title: '',
  content: '',
  type: 'other' as import('@/types/prompt').PromptType,
  folderId: null as string | null,
  tags: [] as string[],
  images: [] as string[],
  sourceUrl: '',
})

const tagInput = ref('')
const contentRef = ref<HTMLTextAreaElement>()

watch(localOpen, (open) => {
  if (open) {
    form.value = { title: '', content: '', type: 'other', folderId: null, tags: [], images: [], sourceUrl: '' }
    tagInput.value = ''
    requestAnimationFrame(() => {
      contentRef.value?.focus()
    })
  }
})

async function save() {
  if (!form.value.content.trim()) return
  const tags = tagInput.value.split(',').map((t) => t.trim()).filter(Boolean)
  await promptStore.add({
    title: form.value.title,
    content: form.value.content,
    type: form.value.type,
    folderId: form.value.folderId,
    tags,
    images: [...form.value.images],
    sourceUrl: form.value.sourceUrl || undefined,
  })
  success('Prompt saved')
  localOpen.value = false
}

async function handlePaste(e: ClipboardEvent) {
  const files = e.clipboardData?.files
  if (!files || files.length === 0) return

  const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'))
  if (!imageFile) return

  e.preventDefault()
  await processImageFile(imageFile)
}

async function processImageFile(file: File) {
  try {
    const url = await uploadImage(file)
    form.value.images.push(url)
    success('Image uploaded')
  } catch (e: any) {
    toastError(e?.message || 'Image upload failed')
  }
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}
</script>
