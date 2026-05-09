import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SyncSummary } from '@/types/sync'

export const useSyncStore = defineStore('sync', () => {
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const lastSyncAt = ref<string>()
  const pendingCount = ref(0)
  const conflictCount = ref(0)

  const summary = computed<SyncSummary>(() => ({
    localPending: pendingCount.value,
    remotePending: 0,
    conflicts: conflictCount.value,
    lastSyncAt: lastSyncAt.value,
    isOnline: isOnline.value,
    isSyncing: isSyncing.value,
  }))

  function setOnline(status: boolean) {
    isOnline.value = status
  }

  function setSyncing(status: boolean) {
    isSyncing.value = status
  }

  function setLastSync(at: string) {
    lastSyncAt.value = at
  }

  function setPending(count: number) {
    pendingCount.value = count
  }

  function setConflicts(count: number) {
    conflictCount.value = count
  }

  return {
    isOnline,
    isSyncing,
    lastSyncAt,
    pendingCount,
    conflictCount,
    summary,
    setOnline,
    setSyncing,
    setLastSync,
    setPending,
    setConflicts,
  }
})
