<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
    <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight">PromptNest</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Personal prompt management</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" required class="input" placeholder="admin@example.com" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Password</label>
          <input v-model="password" type="password" required class="input" placeholder="••••••••" />
        </div>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  const ok = await auth.login(email.value, password.value)
  loading.value = false
  if (ok) {
    router.push('/')
  } else {
    error.value = 'Invalid email or password'
  }
}
</script>
