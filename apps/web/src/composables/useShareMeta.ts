import { watch, type Ref } from 'vue'

export function useShareMeta(prompt: Ref<{ title: string; description?: string; content?: string } | undefined | null>) {
  function update() {
    const p = prompt.value
    if (!p) return
    document.title = p.title ? `${p.title} | Memos` : 'Memos'
    const desc = p.description || p.content?.slice(0, 160) || '来自 NoteNest 的分享'
    updateMeta('description', desc)
    updateMeta('og:title', p.title)
    updateMeta('og:description', desc)
  }

  function updateMeta(name: string, content: string) {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      if (name.startsWith('og:')) el.setAttribute('property', name)
      else el.setAttribute('name', name)
      document.head.appendChild(el)
    }
    el.content = content
  }

  function reset() {
    document.title = 'Memos'
  }

  watch(prompt, update, { immediate: true })

  return { reset }
}
