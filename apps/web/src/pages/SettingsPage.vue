<template>
  <AppLayout>
    <div class="mx-auto max-w-2xl p-6">
      <h1 class="mb-6 text-2xl font-bold">设置</h1>

      <div class="space-y-6">
        <section class="card p-4">
          <h2 class="mb-3 text-base font-semibold">Local Data</h2>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-2xl font-bold">{{ noteStore.notes.length }}</div>
              <div class="text-xs text-gray-500">Prompts</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-2xl font-bold">{{ folderStore.folders.length }}</div>
              <div class="text-xs text-gray-500">Folders</div>
            </div>
            <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div class="text-2xl font-bold">{{ syncStore.pendingCount }}</div>
              <div class="text-xs text-gray-500">未同步</div>
            </div>
          </div>
        </section>

        <section class="card p-4">
          <h2 class="mb-3 text-base font-semibold">Preferences</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">Default View</span>
              <select v-model="settings.viewMode" class="input w-32" @change="settings.save({ viewMode: settings.viewMode })">
                <option value="card">卡片</option>
                <option value="compact">紧凑</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Default Sort</span>
              <select v-model="settings.sortBy" class="input w-40" @change="settings.save({ sortBy: settings.sortBy })">
                <option value="updatedAt">最近更新</option>
                <option value="createdAt">创建时间</option>
                <option value="lastUsedAt">最近使用</option>
                <option value="useCount">使用最多</option>
                <option value="title">标题</option>
              </select>
            </div>
          </div>
        </section>

        <section class="card p-4">
          <h2 class="mb-3 text-base font-semibold">同步 & Data</h2>
          <div class="flex flex-wrap gap-2">
            <button class="btn-primary" @click="handle同步">同步 Now</button>
            <button class="btn-secondary" @click="exportJson">Export JSON</button>
            <button class="btn-secondary" @click="exportMarkdown">Export Markdown</button>
            <button class="btn-secondary" @click="showImport = true">Import JSON</button>
            <button class="btn-secondary" @click="forcePull">Force Pull from Remote</button>
            <button class="btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" @click="confirmClear">Clear Local Data</button>
          </div>

          <div v-if="syncStore.conflictCount > 0" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-red-700 dark:text-red-300">{{ syncStore.conflictCount }} conflict(s) detected</span>
              <button class="text-xs underline text-red-600 dark:text-red-400" @click="loadConflicts">View</button>
            </div>
          </div>

          <div v-if="showConflicts && conflicts.length" class="mt-3 space-y-2">
            <div v-for="c in conflicts" :key="c.id" class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">{{ c.type === 'prompt' ? (c.local as any).title : (c.local as any).name }}</div>
                  <div class="text-xs text-gray-500">{{ c.type }} · {{ c.id.slice(0, 8) }}</div>
                </div>
                <div class="flex gap-2">
                  <button class="btn-secondary text-xs py-1 px-2" @click="resolve(c, 'local')">Use Local</button>
                  <button class="btn-secondary text-xs py-1 px-2" @click="resolve(c, 'remote')">Use Remote</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="card p-4">
          <h2 class="mb-3 text-base font-semibold">Account</h2>
          <div class="flex items-center justify-between">
            <span class="truncate text-sm text-gray-600 dark:text-gray-400">{{ auth.user?.email || '未登录' }}</span>
            <button class="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30" @click="handleLogout">登出</button>
          </div>
        </section>

        <section class="card p-4">
          <h2 class="mb-3 text-base font-semibold">关于</h2>
          <p class="text-sm text-gray-500">Memos v0.1.0</p>
          <p class="text-sm text-gray-500">PWA状态: {{ pwaStatus }}</p>
          <button v-if="canInstall" class="btn-primary mt-3" @click="installPwa">Install App</button>
        </section>
      </div>
    </div>

    <BaseModal v-model="showImport" title="Import JSON">
      <div class="space-y-3">
        <textarea v-model="importJson" class="textarea h-40 font-mono text-xs" placeholder="Paste JSON here..." />
        <div class="flex items-center gap-2">
          <span class="text-xs">重复项处理:</span>
          <select v-model="importMode" class="input w-32 text-xs">
            <option value="skip">跳过</option>
            <option value="overwrite">覆盖</option>
            <option value="copy">复制</option>
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="showImport = false">取消</button>
          <button class="btn-primary" @click="doImport">Import</button>
        </div>
      </div>
    </BaseModal>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { useFolderStore } from '@/stores/folder'
import { useSyncStore } from '@/stores/sync'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { db } from '@/lib/db/schema'
import { syncAll, getSyncSummary, resolveConflict, forcePullRemote } from '@/lib/sync/syncService'
import { exportAllToMarkdown } from '@/lib/export/markdownExport'
import type { ConflictItem } from '@/lib/sync/syncService'
import { useConfirm } from '@/composables/useConfirm'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseConfirm from '@/components/ui/BaseConfirm.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseToast from '@/components/ui/BaseToast.vue'
import { generateId } from '@/lib/utils/id'

const noteStore = useNoteStore()
const folderStore = useFolderStore()
const syncStore = useSyncStore()
const settings = useSettingsStore()
const auth = useAuthStore()
const router = useRouter()
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

onMounted(async () => {
  await settings.load()
  pwaStatus.value = 'serviceWorker' in navigator ? 'Supported' : 'Not supported'
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })
})

async function handle同步() {
  syncStore.setSyncing(true)
  try {
    await syncAll()
    await noteStore.load()
    await folderStore.load()
    const summary = await getSyncSummary()
    syncStore.setPending(summary.localPending)
    syncStore.setConflicts(summary.conflicts)
    success('同步ed')
  } catch {
    error('同步 failed')
  } finally {
    syncStore.setSyncing(false)
  }
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

async function loadConflicts() {
  const allPrompts = await db.notes.where('syncStatus').equals('conflict').toArray()
  const allFolders = await db.folders.where('syncStatus').equals('conflict').toArray()
  conflicts.value = [
    ...allPrompts.map((p) => ({ id: p.id, type: 'prompt' as const, local: p, remote: p })),
    ...allFolders.map((f) => ({ id: f.id, type: 'folder' as const, local: f, remote: f })),
  ]
  showConflicts.value = true
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
    await noteStore.load()
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

async function resolve(c: ConflictItem, choice: 'local' | 'remote') {
  await resolveConflict(c.id, c.type, choice)
  await loadConflicts()
  await noteStore.load()
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

function exportMarkdown() {
  const md = exportAllToMarkdown(noteStore.notes, folderStore.folders)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `memos-${new Date().toISOString().slice(0, 10)}.md`
  a.click()
  URL.revokeObjectURL(url)
  success('Exported as Markdown')
}

async function exportJson() {
  const prompts = await db.notes.toArray()
  const folders = await db.folders.toArray()
  const data = {
    app版本: '0.1.0',
    exportTime: new Date().toISOString(),
    prompts,
    folders,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `memos-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  success('Exported')
}

async function doImport() {
  try {
    const data = JSON.parse(importJson.value)
    if (data.prompts) {
      for (const p of data.prompts) {
        const existing = await db.notes.get(p.id)
        if (existing && importMode.value === 'skip') continue
        const id = existing && importMode.value === 'copy' ? generateId() : p.id
        await db.notes.put({ ...p, id, syncStatus: 'local_pending', updatedAt: new Date().toISOString() })
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
    await noteStore.load()
    await folderStore.load()
    success('Imported')
    showImport.value = false
    importJson.value = ''
  } catch {
    error('Invalid JSON')
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
  await db.notes.clear()
  await db.folders.clear()
  await db.versions.clear()
  await noteStore.load()
  await folderStore.load()
  success('Local data cleared')
}
</script>
