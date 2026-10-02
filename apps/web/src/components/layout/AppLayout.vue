<template>
  <div class="flex h-screen flex-col">
    <SyncStatusBar />
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">Memos</span>
      </div>
      <div class="flex items-center gap-1">
        <ThemeToggle />
        <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" title="Settings" @click="showSettings = true">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </button>
      </div>
    </header>
    <div class="flex flex-1 overflow-hidden">
      <slot name="sidebar" />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
    <SettingsModal v-model="showSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SyncStatusBar from './SyncStatusBar.vue'
import ThemeToggle from './ThemeToggle.vue'
import SettingsModal from './SettingsModal.vue'

const showSettings = ref(false)
</script>
