declare module 'virtual:pwa-register/vue' {
  import type { Ref } from 'vue'
  export function useRegisterSW(options?: {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }): {
    needRefresh: Ref<boolean>
    offlineReady: Ref<boolean>
    updateServiceWorker: () => Promise<void>
  }
}
