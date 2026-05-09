export type SyncStatus = 'synced' | 'local_pending' | 'remote_pending' | 'conflict'

export interface SyncSummary {
  localPending: number
  remotePending: number
  conflicts: number
  lastSyncAt?: string
  isOnline: boolean
  isSyncing: boolean
}

export interface SyncChangeSet {
  prompts: {
    upserts: import('./prompt').PromptItem[]
    deletes: string[]
  }
  folders: {
    upserts: PromptFolder[]
    deletes: string[]
  }
  syncAt: string
}

import type { PromptFolder } from './folder'
