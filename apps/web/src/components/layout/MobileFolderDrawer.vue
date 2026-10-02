<template>
  <Teleport to="body">
    <transition name="slide">
      <div
        v-if="modelValue"
        ref="drawerRef"
        class="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/40" @click="close" />
        <div class="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-800">
          <div class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <h3 class="text-base font-semibold">文件夹</h3>
            <button class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close" @click="close">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-2">
            <button
              v-for="entry in quickEntries"
              :key="entry.key"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
              :class="selectedQuick === entry.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
              @click="selectQuick(entry.key)"
            >
              {{ entry.label }}
              <span v-if="entry.count" class="ml-auto text-xs text-gray-500">{{ entry.count }}</span>
            </button>
            <div class="my-2 border-t border-gray-200 dark:border-gray-700" />
            <div v-for="node in folderStore.folderTree" :key="node.id">
              <button
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                :class="selectedFolderId === node.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                @click="selectFolder(node.id)"
              >
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                {{ node.name }}
              </button>
              <div v-for="child in node.children" :key="child.id" class="pl-4">
                <button
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  :class="selectedFolderId === child.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                  @click="selectFolder(child.id)"
                >
                  {{ child.name }}
                </button>
                <div v-for="g in child.children" :key="g.id" class="pl-4">
                  <button
                    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
                    :class="selectedFolderId === g.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                    @click="selectFolder(g.id)"
                  >
                    {{ g.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { onKeyStroke } from '@vueuse/core'
import { useFolderStore } from '@/stores/folder'
import { useNoteStore } from '@/stores/note'
import { useSyncStore } from '@/stores/sync'
import { useModalStack, isAnyModalOpen } from '@/composables/useModalStack'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'select-folder', id: string | null): void; (e: 'select-quick', key: string): void }>()

const folderStore = useFolderStore()
const noteStore = useNoteStore()
const syncStore = useSyncStore()

const drawerRef = ref<HTMLDivElement>()
const { register, unregister, isTop } = useModalStack()
const isLocked = useScrollLock(document.body)

const selectedFolderId = ref<string | null>(null)
const selectedQuick = ref('all')

const quickEntries = computed(() => [
  { key: 'all', label: '全部笔记', count: noteStore.activeNotes.length },
  { key: 'favorites', label: '收藏', count: noteStore.favoriteNotes.length },
  { key: 'recent', label: '最近使用', count: noteStore.recentlyUsed.length },
  { key: 'most', label: '最常使用', count: noteStore.mostUsed.length },
  { key: 'unsynced', label: '未同步', count: syncStore.pendingCount },
  { key: 'archived', label: '归档', count: noteStore.archivedNotes.length },
])

watch(() => props.modelValue, (open) => {
  if (open) {
    register()
    isLocked.value = true
    nextTick(() => {
      drawerRef.value?.focus()
    })
  } else {
    unregister()
    if (!isAnyModalOpen()) {
      isLocked.value = false
    }
  }
})

onKeyStroke('Escape', (e) => {
  if (props.modelValue && isTop()) {
    e.preventDefault()
    close()
  }
})

function close() { emit('update:modelValue', false) }
function selectFolder(id: string | null) { selectedFolderId.value = id; selectedQuick.value = ''; emit('select-folder', id); close() }
function selectQuick(key: string) { selectedQuick.value = key; selectedFolderId.value = null; emit('select-quick', key); close() }
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateY(100%); }
</style>
