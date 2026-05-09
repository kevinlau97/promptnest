<template>
  <div id="app-root" :class="themeClass">
    <router-view />
    <PwaUpdatePrompt />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import PwaUpdatePrompt from '@/components/layout/PwaUpdatePrompt.vue'

const settings = useSettingsStore()

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : ''
}

const themeClass = computed(() => {
  if (settings.theme === 'dark') return 'dark'
  if (settings.theme === 'light') return ''
  return getSystemTheme()
})

function applyTheme() {
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (settings.theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}

let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  applyTheme()
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', applyTheme)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', applyTheme)
})

watch(() => settings.theme, applyTheme)
</script>
