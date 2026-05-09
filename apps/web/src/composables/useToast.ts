import { reactive } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}

const toasts = reactive<Toast[]>([])

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
    const id = `${Date.now()}_${Math.random()}`
    const toast: Toast = { id, message, type, duration }
    toasts.push(toast)
    setTimeout(() => {
      const idx = toasts.findIndex((t) => t.id === id)
      if (idx > -1) toasts.splice(idx, 1)
    }, duration)
  }

  function success(message: string, duration?: number) {
    show(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    show(message, 'error', duration)
  }

  return { toasts, show, success, error }
}
