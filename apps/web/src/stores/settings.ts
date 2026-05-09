import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getSettings, saveSettings } from '@/lib/db/settingsRepository'
import type { UserSettings, ViewMode, SortOption } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const viewMode = ref<ViewMode>('card')
  const sortBy = ref<SortOption>('updatedAt')
  const sortDesc = ref(true)

  async function load() {
    const s = await getSettings()
    theme.value = s.theme
    viewMode.value = s.viewMode
    sortBy.value = s.sortBy
    sortDesc.value = s.sortDesc
  }

  async function save(partial: Partial<UserSettings>) {
    if (partial.theme !== undefined) theme.value = partial.theme
    if (partial.viewMode !== undefined) viewMode.value = partial.viewMode
    if (partial.sortBy !== undefined) sortBy.value = partial.sortBy
    if (partial.sortDesc !== undefined) sortDesc.value = partial.sortDesc
    await saveSettings({
      theme: theme.value,
      viewMode: viewMode.value,
      sortBy: sortBy.value,
      sortDesc: sortDesc.value,
    })
  }

  watch([theme, viewMode, sortBy, sortDesc], async () => {
    await saveSettings({
      theme: theme.value,
      viewMode: viewMode.value,
      sortBy: sortBy.value,
      sortDesc: sortDesc.value,
    })
  })

  return { theme, viewMode, sortBy, sortDesc, load, save }
})
