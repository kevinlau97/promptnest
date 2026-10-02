import type { Note } from '@/types/note'
import { getFolderPath } from '@/lib/db/folderRepository'
import type { PromptFolder } from '@/types/folder'
import { NOTE_TYPES } from '@/types/note'

export function exportNoteToMarkdown(note: Note, folders: PromptFolder[]): string {
  const typeLabel = NOTE_TYPES.find((t) => t.value === note.type)?.label || note.type
  const folderPath = getFolderPath(folders, note.folderId)

  let md = `# ${note.title}\n\n`

  if (note.description) {
    md += `## Description\n\n${note.description}\n\n`
  }

  md += `**Type:** ${typeLabel}\n\n`
  md += `**Path:** ${folderPath}\n\n`

  if (note.tags.length) {
    md += `**Tags:** ${note.tags.map((t) => `#${t}`).join(' ')}\n\n`
  }

  md += `## Prompt\n\n${note.content}\n\n`

  if (note.variables?.length) {
    md += `## Variables\n\n`
    for (const v of note.variables) {
      md += `- **${v.name}**${v.description ? `: ${v.description}` : ''}${v.defaultValue ? ` (default: ${v.defaultValue})` : ''}\n`
    }
    md += '\n'
  }

  if (note.links.length) {
    md += `## Links\n\n`
    for (const link of note.links) {
      md += `- [${link.title || link.url}](${link.url})\n`
    }
    md += '\n'
  }

  if (note.sourceUrl) {
    md += `**Source:** [${note.sourceTitle || note.sourceUrl}](${note.sourceUrl})\n\n`
  }

  md += `---\n\n*Exported from Memos*\n`

  return md
}

export function exportAllToMarkdown(notes: Note[], folders: PromptFolder[]): string {
  const parts: string[] = []
  for (const p of notes) {
    if (!p.deletedAt) {
      parts.push(exportNoteToMarkdown(p, folders))
    }
  }
  return parts.join('\n---\n\n')
}
