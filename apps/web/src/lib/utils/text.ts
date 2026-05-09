export function autoTitle(content: string, maxLen = 30): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= maxLen) return trimmed
  return trimmed.slice(0, maxLen) + '...'
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)\]\>]+/gi
  return Array.from(new Set(text.match(urlRegex) || []))
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
