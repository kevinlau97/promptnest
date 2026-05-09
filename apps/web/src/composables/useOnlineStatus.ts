import { onMounted, onUnmounted } from 'vue'
import { useSyncStore } from '@/stores/sync'

export function useOnlineStatus() {
  const syncStore = useSyncStore()

  function update() {
    syncStore.setOnline(navigator.onLine)
  }

  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })

  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
}
