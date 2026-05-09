import { computed, reactive, ref, type Ref } from 'vue'
import type { PromptVariable } from '@/types/prompt'

export function usePromptVariables(content: Ref<string>) {
  const values = ref<Record<string, string>>({})

  const detected = computed<PromptVariable[]>(() => {
    const regex = /\{\{(\s*[a-zA-Z0-9_]+\s*)\}\}/g
    const matches = Array.from(content.value.matchAll(regex))
    const vars: PromptVariable[] = []
    const seen = new Set<string>()
    for (const m of matches) {
      const name = m[1].trim()
      if (seen.has(name)) continue
      seen.add(name)
      vars.push({
        id: `var_${name}`,
        name,
        defaultValue: '',
        description: '',
      })
    }
    return vars
  })

  const finalContent = computed(() => {
    let result = content.value
    for (const [name, val] of Object.entries(values.value)) {
      const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
      result = result.replace(regex, val || `{{${name}}}`)
    }
    return result
  })

  function setValue(name: string, val: string) {
    values.value[name] = val
  }

  return reactive({ detected, values, finalContent, setValue })
}
