<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        ref="modalRef"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />
        <div class="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <div v-if="title" class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ title }}</h3>
            <button class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close" @click="close">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { onKeyStroke } from '@vueuse/core'
import { useModalStack, isAnyModalOpen } from '@/composables/useModalStack'

const props = defineProps<{ modelValue: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const modalRef = ref<HTMLDivElement>()
const { register, unregister, isTop } = useModalStack()
const isLocked = useScrollLock(document.body)

watch(() => props.modelValue, (open) => {
  if (open) {
    register()
    isLocked.value = true
    nextTick(() => {
      modalRef.value?.focus()
    })
  } else {
    unregister()
    if (!isAnyModalOpen()) {
      isLocked.value = false
    }
  }
})

// isAnyModalOpen imported from composable

onKeyStroke('Escape', (e) => {
  if (props.modelValue && isTop()) {
    e.preventDefault()
    close()
  }
})

function close() { emit('update:modelValue', false) }
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
