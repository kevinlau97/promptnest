<template>
  <div>
    <button
      class="flex w-full items-center gap-1.5 rounded-lg pr-3 py-1.5 text-sm transition-colors"
      :class="selectedId === node.id ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
      :style="{ paddingLeft: `${(level || 0) * 12 + 16}px` }"
      @click="$emit('select', node.id)"
    >
      <button
        v-if="node.children.length"
        class="mr-0.5 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
        @click.stop="expanded = !expanded"
      >
        <svg class="h-3.5 w-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
      <span v-else class="mr-0.5 inline-block w-5" />
      <svg class="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      <span class="truncate">{{ node.name }}</span>
    </button>
    <div v-if="expanded">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :level="(level || 0) + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FolderTreeNode } from '@/types/folder'

defineProps<{
  node: FolderTreeNode
  selectedId: string | null
  level?: number
}>()
defineEmits<{ (e: 'select', id: string): void }>()

const expanded = ref(true)
</script>
