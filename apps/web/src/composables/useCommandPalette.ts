import { computed, ref, type Ref } from 'vue'
import type { Note } from '@/types/note'

export interface PaletteItem {
  id: string
  title: string
  subtitle?: string
  icon?: string
  action: () => void
}

export function useCommandPalette(
  prompts: Ref<Note[]>,
  onSelectPrompt: (id: string) => void,
  onNewPrompt: () => void,
  onGoSettings: () => void,
  onSync: () => void
) {
  const open = ref(false)
  const query = ref('')

  const items = computed<PaletteItem[]>(() => {
    const q = query.value.toLowerCase().trim()
    const list: PaletteItem[] = [
      { id: 'new', title: '新建笔记', subtitle: '创建一条新笔记', action: () => { onNewPrompt(); open.value = false } },
      { id: 'sync', title: '立即同步', subtitle: '将本地变更同步到服务器', action: () => { onSync(); open.value = false } },
      { id: 'settings', title: '设置', subtitle: '打开设置页面', action: () => { onGoSettings(); open.value = false } },
    ]

    for (const p of prompts.value.slice(0, 50)) {
      if (!q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) {
        list.push({
          id: p.id,
          title: p.title,
          subtitle: p.type,
          action: () => { onSelectPrompt(p.id); open.value = false },
        })
      }
    }

    return q ? list.filter((i) => i.title.toLowerCase().includes(q) || (i.subtitle || '').toLowerCase().includes(q)) : list
  })

  return { open, query, items }
}
