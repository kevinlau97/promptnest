<template>
  <AppLayout>
    <div class="flex h-full flex-col">
      <!-- Top bar -->
      <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <button class="btn-secondary" @click="goBack">
          <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back
        </button>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
            :class="form.isFavorite ? '' : 'text-gray-400'"
            @click="form.isFavorite = !form.isFavorite"
          >
            <svg class="h-5 w-5" :fill="form.isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
          </button>
          <button class="btn-secondary" :class="form.isArchived ? 'bg-gray-300 dark:bg-gray-700' : ''" @click="form.isArchived = !form.isArchived">
            {{ form.isArchived ? 'Unarchive' : 'Archive' }}
          </button>
          <button v-if="isEdit" class="btn-secondary" @click="toggleShare">
            {{ shareSlug ? 'Unshare' : 'Share' }}
          </button>
          <button class="btn-primary" :disabled="saving || !form.content.trim()" @click="save">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <div v-if="shareSlug" class="mt-2 flex items-center gap-2 text-xs">
          <span class="text-gray-500">Share URL:</span>
          <code class="rounded bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ shareUrl }}</code>
          <button class="text-primary-600 hover:underline dark:text-primary-400" @click="copyShareUrl">Copy</button>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <!-- Form -->
        <div class="flex-1 overflow-y-auto p-4 lg:p-6">
          <div class="mx-auto max-w-3xl space-y-4">
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
                class="textarea min-h-[200px] font-mono text-sm"
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

            <!-- AI Enhance -->
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">AI Enhance</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="action in aiActions" :key="action" class="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800" disabled>{{ action }}</button>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button class="btn-secondary" @click="copyContent">Copy Content</button>
              <button class="btn-secondary" @click="copyMarkdown">Copy as Markdown</button>
              <button v-if="isEdit" class="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="confirmDelete">Delete</button>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50 lg:w-96 lg:border-l lg:border-t-0">
          <h3 class="mb-3 text-sm font-semibold">Preview</h3>
          <div class="space-y-3">
            <div v-if="isEdit && versions.length" class="border-t border-gray-200 pt-3 dark:border-gray-700">
              <button class="flex w-full items-center justify-between text-xs font-semibold text-gray-500" @click="showVersions = !showVersions">
                <span>Version History ({{ versions.length }})</span>
                <svg class="h-3 w-3 transition-transform" :class="showVersions ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div v-if="showVersions" class="mt-2 space-y-1">
                <div
                  v-for="v in versions.slice(0, 10)"
                  :key="v.id"
                  class="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">{{ v.title }}</div>
                    <div class="text-gray-400">{{ formatDate(v.createdAt) }} {{ v.reason ? `· ${v.reason}` : '' }}</div>
                  </div>
                  <button class="ml-2 rounded p-1 text-gray-400 hover:text-primary-600" @click="restoreVersion(v)">Restore</button>
                </div>
              </div>
            </div>
            <div v-if="variables.detected.length" class="space-y-2">
              <label class="text-xs font-medium text-gray-500">Variables</label>
              <div v-for="v in variables.detected" :key="v.id" class="flex items-center gap-2">
                <span class="text-xs font-mono text-primary-600 dark:text-primary-400">{{ v.name }}</span>
                <input v-model="variables.values[v.name]" class="input flex-1 text-sm" :placeholder="v.defaultValue || 'Value...'" />
              </div>
            </div>
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ variables.finalContent }}</pre>
            </div>
            <button class="btn-primary w-full" @click="copyFinal">Copy Final Prompt</button>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { usePromptStore } from '@/stores/prompt'
import { useFolderStore } from '@/stores/folder'
import { useToast } from '@/composables/useToast'
import { usePromptVariables } from '@/composables/usePromptVariables'
import { useDebounceFn } from '@vueuse/core'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useAutoResize } from '@/composables/useAutoResize'
import { useConfirm } from '@/composables/useConfirm'
import { useImageUpload } from '@/composables/useImageUpload'
import { PROMPT_TYPES } from '@/types/prompt'
import { generateId, generateSlug } from '@/lib/utils/id'
import { getFolderPath } from '@/lib/db/folderRepository'
import { formatDate } from '@/lib/utils/date'
import { getVersionsByPromptId } from '@/lib/db/versionRepository'
import { apiClient } from '@/lib/api/client'
import type { PromptVersion } from '@/types/prompt'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseToast from '@/components/ui/BaseToast.vue'
import BaseConfirm from '@/components/ui/BaseConfirm.vue'

const route = useRoute()
const router = useRouter()
const promptStore = usePromptStore()
const folderStore = useFolderStore()
const { success, error: toastError } = useToast()

const isEdit = computed(() => route.params.id !== 'new')
const promptId = computed(() => route.params.id as string)

const shareUrl = computed(() => {
  if (!shareSlug.value) return ''
  const base = window.location.origin
  return `${base}/share/${shareSlug.value}`
})

const saving = ref(false)
const shareSlug = ref('')
const tagInput = ref('')
const isDirty = ref(false)
const showVersions = ref(false)
const versions = ref<PromptVersion[]>([])
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
  isFavorite: false,
  isArchived: false,
})

function getDraftKey(): string {
  return isEdit.value ? `draft_${promptId.value}` : 'draft_new'
}

function saveDraft() {
  const key = getDraftKey()
  localStorage.setItem(key, JSON.stringify({
    title: form.title,
    content: form.content,
    description: form.description,
    type: form.type,
    folderId: form.folderId,
    tags: form.tags,
    links: form.links,
    savedAt: new Date().toISOString(),
  }))
}

function loadDraft(): boolean {
  const key = getDraftKey()
  const raw = localStorage.getItem(key)
  if (!raw) return false
  try {
    const draft = JSON.parse(raw)
    form.title = draft.title || ''
    form.content = draft.content || ''
    form.description = draft.description || ''
    form.type = draft.type || 'other'
    form.folderId = draft.folderId || null
    form.tags = draft.tags || []
    form.links = draft.links || []
    return true
  } catch {
    return false
  }
}

function clearDraft() {
  localStorage.removeItem(getDraftKey())
}

const autoSaveDraft = useDebounceFn(() => {
  if (form.content.trim()) saveDraft()
}, 2000)

watch(() => [form.title, form.content, form.description, form.type, form.folderId, form.tags, form.links], () => {
  isDirty.value = true
  autoSaveDraft()
}, { deep: true })

const variables = usePromptVariables(computed(() => form.content))

const contentTextarea = ref<HTMLTextAreaElement>()
const { resize: resizeTextarea, init: initTextarea } = useAutoResize(contentTextarea, 8, 30)
watch(() => form.content, () => {
  resizeTextarea()
})

const aiActions = ['Improve', 'Concise', 'To English', 'To Image Prompt', 'To Video Prompt', 'To Claude Code', 'Extract Variables']

onMounted(async () => {
  if (!promptStore.loaded) await promptStore.load()
  if (!folderStore.loaded) await folderStore.load()

  if (isEdit.value) {
    const p = promptStore.getById(promptId.value)
    if (p) {
      form.title = p.title
      form.content = p.content
      form.description = p.description || ''
      form.type = p.type
      form.folderId = p.folderId || null
      form.tags = [...p.tags]
      form.links = p.links.map((l) => ({ ...l }))
      form.isFavorite = p.isFavorite
      form.isArchived = p.isArchived
      shareSlug.value = p.shareSlug || ''
    }
  }
  if (isEdit.value) {
    versions.value = await getVersionsByPromptId(promptId.value)
  }

  // Load draft if exists and newer than saved content
  const draftLoaded = loadDraft()
  if (draftLoaded && isEdit.value) {
    const draftRaw = localStorage.getItem(getDraftKey())
    if (draftRaw) {
      const draft = JSON.parse(draftRaw)
      const saved = promptStore.getById(promptId.value)
      if (saved && draft.savedAt > saved.updatedAt) {
        isDirty.value = true
        success('Draft restored')
      }
    }
  }

  initTextarea()
})

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
    if (isEdit.value) {
      await promptStore.update(promptId.value, {
        title: form.title,
        content: form.content,
        description: form.description,
        type: form.type,
        folderId: form.folderId,
        tags: [...form.tags],
        links: form.links.map((l) => ({ ...l })),
        isFavorite: form.isFavorite,
        isArchived: form.isArchived,
      })
    } else {
      const p = await promptStore.add({
        title: form.title,
        content: form.content,
        description: form.description,
        type: form.type,
        folderId: form.folderId,
        tags: [...form.tags],
        links: form.links.map((l) => ({ ...l })),
        isFavorite: form.isFavorite,
        isArchived: form.isArchived,
      })
      await router.replace(`/prompts/${p.id}`)
    }
    isDirty.value = false
    clearDraft()
    success('Saved')
  } catch (e) {
    toastError('Save failed')
  } finally {
    saving.value = false
  }
}

function copyContent() {
  navigator.clipboard.writeText(form.content)
  if (isEdit.value) promptStore.recordUse(promptId.value)
  success('Copied content')
}

function copyMarkdown() {
  const path = getFolderPath(folderStore.folders, form.folderId)
  const md = `# ${form.title || 'Untitled'}\n\n**Path:** ${path}\n**Type:** ${form.type}\n${form.tags.length ? `**Tags:** ${form.tags.map((t) => `#${t}`).join(' ')}\n` : ''}\n## Description\n${form.description || ''}\n\n## Prompt\n${form.content}\n\n${form.links.length ? `## Links\n${form.links.map((l) => `- [${l.title || l.url}](${l.url})`).join('\n')}\n` : ''}`
  navigator.clipboard.writeText(md)
  if (isEdit.value) promptStore.recordUse(promptId.value)
  success('Copied as Markdown')
}

function copyFinal() {
  navigator.clipboard.writeText(variables.finalContent)
  if (isEdit.value) promptStore.recordUse(promptId.value)
  success('Copied final prompt')
}

function copyShareUrl() {
  if (!shareUrl.value) return
  navigator.clipboard.writeText(shareUrl.value)
  success('Share link copied')
}

const { state: confirmState, confirm: showConfirm, close: confirmClose } = useConfirm()

async function goBack() {
  if (isDirty.value) {
    const ok = await showConfirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Leave anyway?',
      confirmText: 'Leave',
      variant: 'danger',
    })
    if (!ok) return
  }
  router.push('/')
}

async function confirmDelete() {
  const ok = await showConfirm({
    title: 'Delete Prompt',
    message: 'Are you sure you want to delete this prompt?',
    confirmText: 'Delete',
    variant: 'danger',
  })
  if (!ok) return
  promptStore.remove(promptId.value)
  router.push('/')
}

async function restoreVersion(v: PromptVersion) {
  const ok = await showConfirm({
    title: 'Restore Version',
    message: 'Restore this version? Current unsaved changes will be lost.',
    confirmText: 'Restore',
    variant: 'primary',
  })
  if (!ok) return
  form.title = v.snapshot.title
  form.content = v.snapshot.content
  form.description = v.snapshot.description || ''
  form.type = v.snapshot.type
  form.folderId = v.snapshot.folderId || null
  form.tags = [...v.snapshot.tags]
  form.links = v.snapshot.links.map((l) => ({ ...l }))
  form.isFavorite = v.snapshot.isFavorite
  form.isArchived = v.snapshot.isArchived
  isDirty.value = true
  success('Version restored')
}

async function toggleShare() {
  if (!isEdit.value) return
  if (shareSlug.value) {
    await apiClient.post('/api/share/cancel', { id: promptId.value })
    shareSlug.value = ''
    success('Share cancelled')
  } else {
    const slug = generateSlug()
    await apiClient.post('/api/share/create', { id: promptId.value, slug })
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
    insertAtCursor(`![image](${url})`)
    success('Image uploaded')
  } catch (e: any) {
    toastError(e?.message || 'Image upload failed')
  }
}

function insertAtCursor(text: string) {
  const textarea = contentTextarea.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = form.content.slice(0, start)
  const after = form.content.slice(end)

  form.content = before + text + after

  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length
    textarea.focus()
  })
}

useKeyboardShortcuts({ onSave: save })
</script>
