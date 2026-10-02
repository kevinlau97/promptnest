<template>
  <BaseModal v-model="localOpen" title="快速记录">
    <form class="space-y-3" @submit.prevent="save">
      <input v-model="form.title" class="input" placeholder="标题（可选）" />
      <textarea
        ref="contentRef"
        v-model="form.content"
        class="textarea h-32"
        placeholder="在此粘贴内容...（支持图片）"
        required
        @paste="handlePaste"
      />
      <div class="grid grid-cols-2 gap-3">
        <select v-model="form.type" class="input">
          <option v-for="t in NOTE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="form.folderId" class="input">
          <option :value="null">无文件夹</option>
          <option v-for="f in flatFolders" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <input v-model="tagInput" class="input" placeholder="标签（逗号分隔）" />
      <input v-model="form.sourceUrl" class="input" placeholder="来源链接（可选）" />
      <div v-if="form.images.length" class="space-y-2">
        <label class="mb-1 block text-xs font-medium text-gray-500">图片</label>
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="(img, i) in form.images"
            :key="(typeof img === 'string' ? img : img.url) + i"
            class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <img :src="typeof img === 'string' ? img : img.url" crossorigin="anonymous" class="h-full w-full object-cover" />
            <button
              class="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
              @click="removeImage(i)"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" class="btn-secondary" @click="localOpen = false">取消</button>
        <button type="submit" class="btn-primary" :disabled="!form.content.trim()">保存</button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { NOTE_TYPES } from '@/types/note'
import { useFolderStore } from '@/stores/folder'
import { useNoteStore } from '@/stores/note'
import { useToast } from '@/composables/useToast'
import { useImageUpload } from '@/composables/useImageUpload'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const folderStore = useFolderStore()
const noteStore = useNoteStore()
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
  type: 'other' as import('@/types/note').NoteType,
  folderId: null as string | null,
  tags: [] as string[],
  images: [] as { url: string; filename?: string; type?: string }[],
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
  await noteStore.add({
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
    form.value.images.push({ url, filename: file.name, type: file.type })
    success('Image uploaded')
  } catch (e: any) {
    toastError(e?.message || 'Image upload failed')
  }
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}
</script>
