import type { PromptItem } from '@/types/prompt'
import { getFolderPath } from '@/lib/db/folderRepository'
import type { PromptFolder } from '@/types/folder'
import { PROMPT_TYPES } from '@/types/prompt'

export function exportPromptToMarkdown(prompt: PromptItem, folders: PromptFolder[]): string {
  const typeLabel = PROMPT_TYPES.find((t) => t.value === prompt.type)?.label || prompt.type
  const folderPath = getFolderPath(folders, prompt.folderId)

  let md = `# ${prompt.title}\n\n`

  if (prompt.description) {
    md += `## Description\n\n${prompt.description}\n\n`
  }

  md += `**Type:** ${typeLabel}\n\n`
  md += `**Path:** ${folderPath}\n\n`

  if (prompt.tags.length) {
    md += `**Tags:** ${prompt.tags.map((t) => `#${t}`).join(' ')}\n\n`
  }

  md += `## Prompt\n\n${prompt.content}\n\n`

  if (prompt.variables?.length) {
    md += `## Variables\n\n`
    for (const v of prompt.variables) {
      md += `- **${v.name}**${v.description ? `: ${v.description}` : ''}${v.defaultValue ? ` (default: ${v.defaultValue})` : ''}\n`
    }
    md += '\n'
  }

  if (prompt.links.length) {
    md += `## Links\n\n`
    for (const link of prompt.links) {
      md += `- [${link.title || link.url}](${link.url})\n`
    }
    md += '\n'
  }

  if (prompt.sourceUrl) {
    md += `**Source:** [${prompt.sourceTitle || prompt.sourceUrl}](${prompt.sourceUrl})\n\n`
  }

  md += `---\n\n*Exported from PromptNest*\n`

  return md
}

export function exportAllToMarkdown(prompts: PromptItem[], folders: PromptFolder[]): string {
  const parts: string[] = []
  for (const p of prompts) {
    if (!p.deletedAt) {
      parts.push(exportPromptToMarkdown(p, folders))
    }
  }
  return parts.join('\n---\n\n')
}
