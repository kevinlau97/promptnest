<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        ref="modalRef"
        class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close" />
        <!-- 移动端：全屏；桌面端：居中弹窗 -->
        <div
          class="relative z-10 flex flex-col bg-white shadow-xl dark:bg-gray-800"
          :class="[
            size === 'full'
              ? 'h-[100dvh] w-full md:h-auto md:max-h-[85vh] md:rounded-2xl md:max-w-5xl'
              : 'h-[100dvh] w-full md:h-auto md:max-h-[80vh] md:rounded-2xl md:max-w-4xl'
          ]"
        >
          <!-- header 固定 -->
          <div v-if="title" class="flex items-center justify-between p-4 pb-3 border-b border-gray-200 md:p-6 md:pb-4 dark:border-gray-700">
            <h3 class="text-base font-semibold md:text-lg">{{ title }}</h3>
            <button class="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close" @click="close">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <!-- 内容区域：可滚动 -->
          <div class="flex-1 overflow-y-auto p-4 md:p-6">
            <slot />
          </div>
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

const props = defineProps<{
  modelValue: boolean
  title?: string
  size?: 'default' | 'full'
}>()

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
