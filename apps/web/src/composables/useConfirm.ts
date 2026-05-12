import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

const state = reactive<{
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: 'danger' | 'primary'
  resolve: ((value: boolean) => void) | null
}>({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'primary',
  resolve: null,
})

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      state.title = options.title
      state.message = options.message
      state.confirmText = options.confirmText || 'Confirm'
      state.cancelText = options.cancelText || 'Cancel'
      state.variant = options.variant || 'primary'
      state.resolve = resolve
      state.visible = true
    })
  }

  function close(result: boolean) {
    state.visible = false
    state.resolve?.(result)
    state.resolve = null
  }

  return { state, confirm, close }
}
