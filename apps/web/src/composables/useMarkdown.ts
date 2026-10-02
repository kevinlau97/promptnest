import { marked } from 'marked'

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Custom extension to add target="_blank" to all links
const targetBlankExtension = {
  name: 'link',
  renderer(token: any) {
    const href = token.href
    const title = token.title ? ` title="${token.title}"` : ''
    const text = token.text || href
    return `<a href="${href}"${title} target="_blank" rel="noopener noreferrer">${text}</a>`
  }
}

marked.use({ extensions: [targetBlankExtension] })

export function renderMarkdown(content: string): string {
  return marked(content) as string
}

// Helper for v-html
export function useMarkdown() {
  return {
    renderMarkdown,
  }
}
