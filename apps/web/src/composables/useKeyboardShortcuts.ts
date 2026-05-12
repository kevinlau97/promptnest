import { onMounted, onUnmounted } from 'vue'
import { isAnyModalOpen } from './useModalStack'

export function useKeyboardShortcuts(handlers: {
  onSave?: () => void
  onNew?: () => void
  onPalette?: () => void
}) {
  function onKeydown(e: KeyboardEvent) {
    // Don't trigger global shortcuts when any modal/drawer/palette is open
    if (isAnyModalOpen()) return

    const meta = e.metaKey || e.ctrlKey
    const target = e.target as HTMLElement
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    // Save: allow even when typing (Cmd+S inside textarea is expected to save)
    if (meta && e.key === 's' && handlers.onSave) {
      e.preventDefault()
      handlers.onSave()
      return
    }

    // New / Palette: skip if actively typing in an input
    if (isTyping) return

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
