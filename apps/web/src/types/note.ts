export interface NoteImage {
  url: string
  filename?: string
  type?: string
}

export interface NoteLink {
  id: string
  title?: string
  url: string
}

export interface NoteVariable {
  id: string
  name: string
  defaultValue?: string
  description?: string
}

export const NOTE_TYPES = [
  { value: 'general', label: '通用', icon: '📝' },
  { value: 'creative', label: '创意', icon: '✨' },
  { value: 'code', label: '代码', icon: '💻' },
  { value: 'analysis', label: '分析', icon: '🔍' },
  { value: 'chat', label: '对话', icon: '💬' },
  { value: 'other', label: '其他', icon: '📋' },
]

export type NoteType = 'general' | 'creative' | 'code' | 'analysis' | 'chat' | 'other'

export interface Note {
  id: string
  title: string
  content: string
  description?: string

  folderId?: string | null
  tags: string[]

  links: NoteLink[]
  variables?: NoteVariable[]
  images: NoteImage[]

  isFavorite: boolean
  isArchived: boolean

  visibility: 'private' | 'shared'
  shareSlug?: string

  sourceUrl?: string
  sourceTitle?: string

  createdAt: string
  updatedAt: string
  deletedAt?: string

  lastUsedAt?: string
  useCount: number

  localUpdatedAt?: string
  remoteUpdatedAt?: string
  version: number

  syncStatus: 'synced' | 'local_pending' | 'remote_pending' | 'conflict'

  type?: NoteType
}

export interface NoteVersion {
  id: string
  noteId: string
  title: string
  content: string
  snapshot: Note
  createdAt: string
  reason?: 'manual_save' | 'before_sync' | 'before_import' | 'conflict'
}
