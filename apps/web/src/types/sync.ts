import type { Note } from './note'
import type { PromptFolder } from './folder'

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
  notes: {
    upserts: Note[]
    deletes: string[]
  }
  folders: {
    upserts: PromptFolder[]
    deletes: string[]
  }
  syncAt: string
}
