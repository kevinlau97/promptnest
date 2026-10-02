<template>
  <div v-if="needRefresh" class="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-white dark:text-gray-900">
    <div class="flex items-center gap-3">
      <span>有新版本可用</span>
      <button class="rounded bg-primary-600 px-3 py-1 text-xs font-medium hover:bg-primary-700" @click="updateServiceWorker">
        刷新
      </button>
      <button class="text-xs text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-900" @click="needRefresh = false">
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const needRefresh = ref(false)
let updateSW: (() => Promise<void>) | undefined

onMounted(async () => {
  try {
    const { useRegisterSW } = await import('virtual:pwa-register/vue')
    const { needRefresh: nr, updateServiceWorker: usw } = useRegisterSW()
    needRefresh.value = nr.value
    updateSW = usw
  } catch {
    // PWA not supported or dev mode
  }
})

async function updateServiceWorker() {
  if (updateSW) await updateSW()
  window.location.reload()
}
</script>
