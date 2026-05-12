<template>
  <BaseModal :model-value="modelValue" title="Settings" @update:model-value="val => emit('update:modelValue', val)">
    <div class="max-h-[70vh] overflow-y-auto pr-1">
      <div class="space-y-6">
        <!-- Appearance -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <div class="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                <button
                  v-for="t in themeOptions"
                  :key="t.value"
                  class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                  :class="settings.theme === t.value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
                  @click="settings.save({ theme: t.value })"
                >
                  {{ t.label }}
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Default View</span>
              <select v-model="settings.viewMode" class="input w-32 text-sm" @change="settings.save({ viewMode: settings.viewMode })">
                <option value="card">Card</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Default Sort</span>
              <select v-model="settings.sortBy" class="input w-40 text-sm" @change="settings.save({ sortBy: settings.sortBy })">
                <option value="updatedAt">Recently Updated</option>
                <option value="createdAt">Created</option>
                <option value="lastUsedAt">Recently Used</option>
                <option value="useCount">Most Used</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Stats -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Local Data</h3>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ promptStore.prompts.length }}</div>
              <div class="text-xs text-gray-500">Prompts</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ folderStore.folders.length }}</div>
              <div class="text-xs text-gray-500">Folders</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ syncStore.pendingCount }}</div>
              <div class="text-xs text-gray-500">Unsynced</div>
            </div>
          </div>
        </section>

        <!-- Sync -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Sync & Data</h3>
          <div class="flex flex-wrap gap-2">
            <button class="btn-primary text-xs" @click="handleSync">Sync Now</button>
            <button class="btn-secondary text-xs" @click="exportJson">Export JSON</button>
            <button class="btn-secondary text-xs" @click="exportMarkdown">Export Markdown</button>
            <button class="btn-secondary text-xs" @click="showImport = true">Import JSON</button>
            <button class="btn-secondary text-xs" @click="forcePull">Force Pull</button>
            <button class="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30" @click="confirmClear">Clear Local Data</button>
          </div>

          <div v-if="syncStore.conflictCount > 0" class="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 dark:border-red-900/30 dark:bg-red-900/10">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-red-700 dark:text-red-300">{{ syncStore.conflictCount }} conflict(s) detected</span>
              <button class="text-xs underline text-red-600 dark:text-red-400" @click="loadConflicts">View</button>
            </div>
          </div>

          <div v-if="showConflicts && conflicts.length" class="mt-2 space-y-1.5">
            <div v-for="c in conflicts" :key="c.id" class="rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-medium">{{ c.type === 'prompt' ? (c.local as any).title : (c.local as any).name }}</div>
                </div>
                <div class="flex gap-1.5">
                  <button class="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600" @click="resolve(c, 'local')">Local</button>
                  <button class="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600" @click="resolve(c, 'remote')">Remote</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- About -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">About</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">PromptNest v0.1.0</p>
              <p class="text-xs text-gray-400">PWA: {{ pwaStatus }}</p>
            </div>
            <button v-if="canInstall" class="btn-primary text-xs" @click="installPwa">Install App</button>
          </div>
        </section>
      </div>
    </div>

    <BaseModal v-model="showImport" title="Import JSON">
      <div class="space-y-3">
        <textarea v-model="importJson" class="textarea h-32 font-mono text-xs" placeholder="Paste JSON here..." />
        <div class="flex items-center gap-2">
          <span class="text-xs">On duplicate:</span>
          <select v-model="importMode" class="input w-32 text-xs">
            <option value="skip">Skip</option>
            <option value="overwrite">Overwrite</option>
            <option value="copy">Copy</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary text-xs" @click="showImport = false">Cancel</button>
          <button class="btn-primary text-xs" @click="doImport">Import</button>
        </div>
      </div>
    </BaseModal>

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
import { ref, onMounted, watch } from 'vue'
import { usePromptStore } from '@/stores/prompt'
import { useFolderStore } from '@/stores/folder'
import { useSyncStore } from '@/stores/sync'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { db } from '@/lib/db/schema'
import { syncAll, getSyncSummary, resolveConflict, forcePullRemote } from '@/lib/sync/syncService'
import { exportAllToMarkdown } from '@/lib/export/markdownExport'
import type { ConflictItem } from '@/lib/sync/syncService'
import { generateId } from '@/lib/utils/id'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseConfirm from '@/components/ui/BaseConfirm.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const promptStore = usePromptStore()
const folderStore = useFolderStore()
const syncStore = useSyncStore()
const settings = useSettingsStore()
const { success, error } = useToast()
const { state: confirmState, confirm: showConfirm, close: confirmClose } = useConfirm()

const pwaStatus = ref('Unknown')
const canInstall = ref(false)
let deferredPrompt: any = null
const showImport = ref(false)
const importJson = ref('')
const importMode = ref<'skip' | 'overwrite' | 'copy'>('skip')
const conflicts = ref<ConflictItem[]>([])
const showConflicts = ref(false)

const themeOptions = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

onMounted(async () => {
  await settings.load()
  pwaStatus.value = 'serviceWorker' in navigator ? 'Supported' : 'Not supported'
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })
})

async function handleSync() {
  syncStore.setSyncing(true)
  try {
    await syncAll()
    await promptStore.load()
    await folderStore.load()
    const summary = await getSyncSummary()
    syncStore.setPending(summary.localPending)
    syncStore.setConflicts(summary.conflicts)
    success('Synced')
  } catch {
    error('Sync failed')
  } finally {
    syncStore.setSyncing(false)
  }
}

function exportJson() {
  const data = {
    appVersion: '0.1.0',
    exportTime: new Date().toISOString(),
    prompts: promptStore.prompts,
    folders: folderStore.folders,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptnest-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  success('Exported')
}

function exportMarkdown() {
  const md = exportAllToMarkdown(promptStore.prompts, folderStore.folders)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptnest-${new Date().toISOString().slice(0, 10)}.md`
  a.click()
  URL.revokeObjectURL(url)
  success('Exported as Markdown')
}

async function doImport() {
  try {
    const data = JSON.parse(importJson.value)
    if (data.prompts) {
      for (const p of data.prompts) {
        const existing = await db.prompts.get(p.id)
        if (existing && importMode.value === 'skip') continue
        const id = existing && importMode.value === 'copy' ? generateId() : p.id
        await db.prompts.put({ ...p, id, syncStatus: 'local_pending', updatedAt: new Date().toISOString() })
      }
    }
    if (data.folders) {
      for (const f of data.folders) {
        const existing = await db.folders.get(f.id)
        if (existing && importMode.value === 'skip') continue
        const id = existing && importMode.value === 'copy' ? generateId() : f.id
        await db.folders.put({ ...f, id, syncStatus: 'local_pending', updatedAt: new Date().toISOString() })
      }
    }
    await promptStore.load()
    await folderStore.load()
    success('Imported')
    showImport.value = false
    importJson.value = ''
  } catch {
    error('Invalid JSON')
  }
}

async function forcePull() {
  const ok = await showConfirm({
    title: 'Force Pull',
    message: 'This will overwrite all local data with remote data. Continue?',
    confirmText: 'Pull',
    variant: 'danger',
  })
  if (!ok) return
  syncStore.setSyncing(true)
  try {
    await forcePullRemote()
    await promptStore.load()
    await folderStore.load()
    syncStore.setPending(0)
    syncStore.setConflicts(0)
    success('Pulled from remote')
  } catch {
    error('Pull failed')
  } finally {
    syncStore.setSyncing(false)
  }
}

async function confirmClear() {
  const ok = await showConfirm({
    title: 'Clear Local Data',
    message: 'This will delete ALL local data. Are you sure?',
    confirmText: 'Clear',
    variant: 'danger',
  })
  if (!ok) return
  await db.prompts.clear()
  await db.folders.clear()
  await db.versions.clear()
  await promptStore.load()
  await folderStore.load()
  success('Local data cleared')
}

async function loadConflicts() {
  const allPrompts = await db.prompts.where('syncStatus').equals('conflict').toArray()
  conflicts.value = allPrompts.map((p) => ({ id: p.id, type: 'prompt' as const, local: p, remote: p }))
  showConflicts.value = true
}

async function resolve(c: ConflictItem, choice: 'local' | 'remote') {
  await resolveConflict(c.id, c.type, choice)
  await loadConflicts()
  await promptStore.load()
  await folderStore.load()
  const summary = await getSyncSummary()
  syncStore.setConflicts(summary.conflicts)
  success(`Resolved: using ${choice}`)
}

async function installPwa() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    success('App installed')
    canInstall.value = false
  }
  deferredPrompt = null
}

watch(() => props.modelValue, (open) => {
  if (open) {
    showConflicts.value = false
    conflicts.value = []
  }
})
</script>
