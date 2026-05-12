<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        ref="modalRef"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="onCancel" />
        <div class="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
          <div class="mt-6 flex justify-end gap-2">
            <button class="btn-secondary" @click="onCancel">{{ cancelText }}</button>
            <button
              ref="confirmBtn"
              class="btn"
              :class="variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary'"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
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
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'confirm'): void; (e: 'cancel'): void }>()

const modalRef = ref<HTMLDivElement>()
const confirmBtn = ref<HTMLButtonElement>()
const { register, unregister, isTop } = useModalStack()
const isLocked = useScrollLock(document.body)

watch(() => props.modelValue, (open) => {
  if (open) {
    register()
    isLocked.value = true
    nextTick(() => {
      confirmBtn.value?.focus()
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
    onCancel()
  }
})

onKeyStroke('Enter', (e) => {
  if (props.modelValue && isTop()) {
    // Don't confirm if the user is typing in a textarea/input inside the confirm dialog
    // (there shouldn't be any, but just in case)
    const target = e.target as HTMLElement
    if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text')) {
      return
    }
    e.preventDefault()
    onConfirm()
  }
})

function onConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
