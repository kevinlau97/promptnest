import { ref, nextTick, type Ref } from 'vue'

export function useAutoResize(textareaRef: Ref<HTMLTextAreaElement | undefined>, minRows = 3, maxRows = 20) {
  const lineHeight = ref(20)

  function resize() {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, maxRows * lineHeight.value)
    const minHeight = minRows * lineHeight.value
    el.style.height = Math.max(newHeight, minHeight) + 'px'
  }

  function init() {
    nextTick(() => {
      const el = textareaRef.value
      if (el) {
        const style = getComputedStyle(el)
        lineHeight.value = parseInt(style.lineHeight) || 20
        resize()
      }
    })
  }

  return { resize, init }
}
