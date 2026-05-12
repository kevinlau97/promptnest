import { ref, computed } from 'vue'
import { useImageCompression } from './useImageCompression'
import { apiClient } from '@/lib/api/client'

export function useImageUpload() {
  const { compressing, compressToAvif } = useImageCompression()
  const uploading = ref(false)
  const error = ref<string | null>(null)

  async function uploadImage(file: File): Promise<string> {
    error.value = null
    uploading.value = true

    try {
      const compressed = await compressToAvif(file)

      const formData = new FormData()
      formData.append('file', compressed, file.name.replace(/\.[^.]+$/, '.avif'))

      const res = await apiClient.postForm<{ url: string }>('/api/upload', formData)

      if (!res.success) {
        throw new Error(res.error?.message || 'Upload failed')
      }

      return res.data!.url
    } catch (e: any) {
      error.value = e?.message || 'Image upload failed'
      throw e
    } finally {
      uploading.value = false
    }
  }

  const loading = computed(() => compressing.value || uploading.value)

  return { loading, error, uploadImage }
}
