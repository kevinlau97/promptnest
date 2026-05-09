<template>
  <div class="flex h-screen flex-col">
    <SyncStatusBar />
    <div class="flex flex-1 overflow-hidden">
      <slot name="sidebar" />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SyncStatusBar from './SyncStatusBar.vue'
</script>
