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
  sourceUrl: '',
})

const tagInput = ref('')
const contentRef = ref<HTMLTextAreaElement>()

watch(localOpen, (open) => {
  if (open) {
    form.value = { title: '', content: '', type: 'other', folderId: null, tags: [], sourceUrl: '' }
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
    insertAtCursor(`![image](${url})`)
    success('Image uploaded')
  } catch (e: any) {
    toastError(e?.message || 'Image upload failed')
  }
}

function insertAtCursor(text: string) {
  const textarea = contentRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = form.value.content.slice(0, start)
  const after = form.value.content.slice(end)

  form.value.content = before + text + after

  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length
    textarea.focus()
  })
}
</script>
