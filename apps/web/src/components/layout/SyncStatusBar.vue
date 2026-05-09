<template>
  <div
    v-if="showBar"
    class="flex items-center justify-between gap-2 border-b px-4 py-1.5 text-xs"
    :class="barClass"
  >
    <div class="flex items-center gap-2">
      <span v-if="!sync.isOnline" class="inline-block h-2 w-2 rounded-full bg-orange-400" />
      <span v-else-if="sync.pendingCount > 0" class="inline-block h-2 w-2 rounded-full bg-amber-400" />
      <span v-else class="inline-block h-2 w-2 rounded-full bg-green-400" />
      <span>{{ statusText }}</span>
    </div>
    <button v-if="sync.pendingCount > 0 && sync.isOnline && !sync.isSyncing" class="underline" @click="doSync">Sync now</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '@/stores/sync'
import { syncAll } from '@/lib/sync/syncService'
import { useToast } from '@/composables/useToast'

const sync = useSyncStore()
const { success, error } = useToast()

const showBar = computed(() => !sync.isOnline || sync.pendingCount > 0 || sync.conflictCount > 0)

const barClass = computed(() => {
  if (sync.conflictCount > 0) return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30'
  if (!sync.isOnline) return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900/30'
  if (sync.pendingCount > 0) return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30'
  return ''
})

const statusText = computed(() => {
  if (sync.conflictCount > 0) return `${sync.conflictCount} conflict(s) need resolution`
  if (!sync.isOnline) return 'Offline — changes saved locally'
  if (sync.pendingCount > 0) return `${sync.pendingCount} local change(s) pending`
  return 'All synced'
})

async function doSync() {
  sync.setSyncing(true)
  try {
    await syncAll()
    sync.setPending(0)
    success('Synced')
  } catch {
    error('Sync failed')
  } finally {
    sync.setSyncing(false)
  }
}
</script>
