import type { ApiResponse } from '@/types/api'

/**
 * 401 统一处理：会话失效时清除本地 token 并回到登录页。
 * - /login 页的 401（如密码错误）不跳转、不清 token，避免误伤仍有效的会话
 * - /share 是公开页，只清 token 不跳转
 */
function handleUnauthorized(): void {
  const { pathname } = window.location
  if (pathname === '/login' || pathname.startsWith('/share')) return
  localStorage.removeItem('pn_token')
  window.location.assign('/login')
}

class ApiClient {
  private baseUrl = ''

  private async request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('pn_token')
    const headers = new Headers(init.headers)
    // FormData 由浏览器自动设置 multipart boundary，不能手动指定 Content-Type
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(this.baseUrl + path, { ...init, headers })
    if (res.status === 401) handleUnauthorized()
    return res.json()
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path)
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }

  async postForm<T>(path: string, body: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body })
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
