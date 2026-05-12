<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        ref="paletteRef"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
          <div class="flex items-center border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <svg class="mr-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              ref="inputRef"
              v-model="query"
              class="w-full bg-transparent text-sm outline-none placeholder-gray-400 dark:text-gray-100"
              placeholder="Search prompts or commands..."
              @keydown.down.prevent="selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1)"
              @keydown.up.prevent="selectedIndex = Math.max(selectedIndex - 1, 0)"
              @keydown.enter.prevent="selectCurrent"
              @keydown.esc="close"
            />
          </div>
          <div class="max-h-[50vh] overflow-y-auto py-2">
            <div
              v-for="(item, i) in filteredItems"
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm"
              :class="i === selectedIndex ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'"
              @click="item.action(); close()"
              @mouseenter="selectedIndex = i"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ item.title }}</div>
                <div v-if="item.subtitle" class="text-xs text-gray-500">{{ item.subtitle }}</div>
              </div>
            </div>
            <div v-if="filteredItems.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">
              No results found
            </div>
          </div>
          <div class="flex items-center gap-3 border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
            <span><kbd class="rounded border border-gray-300 px-1 dark:border-gray-600">↑</kbd> <kbd class="rounded border border-gray-300 px-1 dark:border-gray-600">↓</kbd> Navigate</span>
            <span><kbd class="rounded border border-gray-300 px-1 dark:border-gray-600">↵</kbd> Select</span>
            <span><kbd class="rounded border border-gray-300 px-1 dark:border-gray-600">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { onKeyStroke } from '@vueuse/core'
import type { PaletteItem } from '@/composables/useCommandPalette'
import { useModalStack, isAnyModalOpen } from '@/composables/useModalStack'

const props = defineProps<{
  modelValue: boolean
  items: PaletteItem[]
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const paletteRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLInputElement>()
const query = ref('')
const selectedIndex = ref(0)
const { register, unregister, isTop } = useModalStack()
const isLocked = useScrollLock(document.body)

const filteredItems = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return props.items
  return props.items.filter((i) => i.title.toLowerCase().includes(q) || (i.subtitle || '').toLowerCase().includes(q))
})

watch(() => props.modelValue, (open) => {
  if (open) {
    register()
    isLocked.value = true
    query.value = ''
    selectedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  } else {
    unregister()
    if (!isAnyModalOpen()) {
      isLocked.value = false
    }
  }
})

watch(filteredItems, () => {
  selectedIndex.value = 0
})

onKeyStroke('Escape', (e) => {
  if (props.modelValue && isTop()) {
    e.preventDefault()
    close()
  }
})

function close() {
  emit('update:modelValue', false)
}

function selectCurrent() {
  const item = filteredItems.value[selectedIndex.value]
  if (item) {
    item.action()
    close()
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
