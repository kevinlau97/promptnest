export interface PromptFolder {
  id: string
  name: string
  parentId?: string | null
  level: 1 | 2 | 3
  icon?: string
  color?: string
  sortOrder: number

  createdAt: string
  updatedAt: string
  deletedAt?: string

  syncStatus: 'synced' | 'local_pending' | 'remote_pending' | 'conflict'
  version: number
}

export type FolderTreeNode = PromptFolder & { children: FolderTreeNode[] }
