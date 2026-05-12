export type PromptType =
  | 'chat'
  | 'image'
  | 'video'
  | 'code'
  | 'marketing'
  | 'research'
  | 'customer_support'
  | 'product'
  | 'seo'
  | 'other'

export const PROMPT_TYPES: { value: PromptType; label: string }[] = [
  { value: 'chat', label: 'AI Chat' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'code', label: 'Code' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Research' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'product', label: 'Product' },
  { value: 'seo', label: 'SEO' },
  { value: 'other', label: 'Other' },
]

export interface PromptLink {
  id: string
  title?: string
  url: string
}

export interface PromptVariable {
  id: string
  name: string
  defaultValue?: string
  description?: string
}

export interface PromptItem {
  id: string
  title: string
  content: string
  description?: string

  type: PromptType
  folderId?: string | null
  tags: string[]

  links: PromptLink[]
  variables?: PromptVariable[]
  images: string[]

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
}

export interface PromptVersion {
  id: string
  promptId: string
  title: string
  content: string
  snapshot: PromptItem
  createdAt: string
  reason?: 'manual_save' | 'before_sync' | 'before_import' | 'conflict'
}
