export type ViewMode = 'card' | 'compact'
export type SortOption = 'updatedAt' | 'createdAt' | 'lastUsedAt' | 'useCount' | 'title'

export interface UserSettings {
  id: string
  viewMode: ViewMode
  sortBy: SortOption
  sortDesc: boolean
  theme: 'light' | 'dark' | 'system'
  defaultFolderId?: string | null
}
