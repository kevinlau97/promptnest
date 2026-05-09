import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/lib/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ email: string } | null>(null)
  const token = ref<string>(localStorage.getItem('pn_token') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await apiClient.post<{ token: string }>('/api/auth/login', { email, password })
      if (res.success && res.data?.token) {
        token.value = res.data.token
        localStorage.setItem('pn_token', res.data.token)
        user.value = { email }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function logout() {
    try {
      await apiClient.post('/api/auth/logout', {})
    } catch {
      // ignore
    }
    token.value = ''
    user.value = null
    localStorage.removeItem('pn_token')
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await apiClient.get<{ email: string }>('/api/auth/me')
      if (res.success && res.data?.email) {
        user.value = { email: res.data.email }
      } else {
        token.value = ''
        localStorage.removeItem('pn_token')
      }
    } catch {
      token.value = ''
      localStorage.removeItem('pn_token')
    }
  }

  return { user, token, isLoggedIn, login, logout, fetchMe }
})
