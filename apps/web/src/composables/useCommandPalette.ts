import { computed, ref, type Ref } from 'vue'
import type { PromptItem } from '@/types/prompt'

export interface PaletteItem {
  id: string
  title: string
  subtitle?: string
  icon?: string
  action: () => void
}

export function useCommandPalette(
  prompts: Ref<PromptItem[]>,
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
      { id: 'new', title: 'New Prompt', subtitle: 'Create a new prompt', action: () => { onNewPrompt(); open.value = false } },
      { id: 'sync', title: 'Sync Now', subtitle: 'Push local changes to server', action: () => { onSync(); open.value = false } },
      { id: 'settings', title: 'Settings', subtitle: 'Open settings page', action: () => { onGoSettings(); open.value = false } },
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
