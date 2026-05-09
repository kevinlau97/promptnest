import { db } from './schema'
import type { UserSettings } from '@/types/settings'

const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  viewMode: 'card',
  sortBy: 'updatedAt',
  sortDesc: true,
  theme: 'system',
}

export async function getSettings(): Promise<UserSettings> {
  const s = await db.settings.get('default')
  return s || DEFAULT_SETTINGS
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  await db.settings.put({ ...DEFAULT_SETTINGS, ...settings, id: 'default' })
}
