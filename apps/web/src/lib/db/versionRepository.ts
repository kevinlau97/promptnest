import { db } from './schema'
import type { PromptItem, PromptVersion } from '@/types/prompt'
import { generateId } from '@/lib/utils/id'

export async function createVersionSnapshot(
  prompt: PromptItem,
  reason: PromptVersion['reason'] = 'manual_save'
): Promise<void> {
  const snapshot: PromptVersion = {
    id: generateId(),
    promptId: prompt.id,
    title: prompt.title,
    content: prompt.content,
    snapshot: { ...prompt },
    createdAt: new Date().toISOString(),
    reason,
  }
  await db.versions.add(snapshot)
}

export async function getVersionsByPromptId(promptId: string): Promise<PromptVersion[]> {
  return db.versions.where('promptId').equals(promptId).reverse().sortBy('createdAt')
}
