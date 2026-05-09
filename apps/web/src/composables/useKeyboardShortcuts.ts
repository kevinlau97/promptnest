import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts(handlers: {
  onSave?: () => void
  onNew?: () => void
  onPalette?: () => void
}) {
  function onKeydown(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey
    if (meta && e.key === 's' && handlers.onSave) {
      e.preventDefault()
      handlers.onSave()
    }
    if (meta && e.key === 'n' && handlers.onNew) {
      e.preventDefault()
      handlers.onNew()
    }
    if (meta && e.key === 'k' && handlers.onPalette) {
      e.preventDefault()
      handlers.onPalette()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
