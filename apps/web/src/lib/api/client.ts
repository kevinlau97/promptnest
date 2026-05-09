import type { ApiResponse } from '@/types/api'

class ApiClient {
  private baseUrl = ''

  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('pn_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    const res = await fetch(this.baseUrl + path, { headers: this.getHeaders() })
    return res.json()
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const res = await fetch(this.baseUrl + path, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return res.json()
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const res = await fetch(this.baseUrl + path, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return res.json()
  }
}

export const apiClient = new ApiClient()
