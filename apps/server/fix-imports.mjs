import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'

function fixDir(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      fixDir(path)
    } else if (path.endsWith('.js')) {
      let content = readFileSync(path, 'utf-8')
      // Add .js to relative imports without extension
      content = content.replace(/from\s+(['"])(\.\.?\/[^'"]+?)\1/g, (match, quote, importPath) => {
        if (importPath.endsWith('.js')) return match
        return `from ${quote}${importPath}.js${quote}`
      })
      writeFileSync(path, content)
    }
  }
}

fixDir('./dist')
console.log('Fixed imports')
