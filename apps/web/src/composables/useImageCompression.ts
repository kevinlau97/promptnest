import { ref } from 'vue'

/**
 * Compress an image to WebP using the browser's Canvas API.
 * No wasm, no SharedArrayBuffer, no worker threads — fast and dependency-free.
 */
export function useImageCompression() {
  const compressing = ref(false)
  const error = ref<string | null>(null)

  async function compressToWebp(
    file: File,
    maxWidth = 1920,
    quality = 0.85,
  ): Promise<Blob> {
    compressing.value = true
    error.value = null

    try {
      // 1. Decode the image
      const bitmap = await createImageBitmap(file)

      // 2. Compute target size (preserve aspect ratio, only downscale)
      const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1
      const targetW = Math.round(bitmap.width * scale)
      const targetH = Math.round(bitmap.height * scale)

      // 3. Draw onto a canvas (OffscreenCanvas if available — slightly faster)
      let blob: Blob
      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(targetW, targetH)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, targetW, targetH)
        blob = await canvas.convertToBlob({ type: 'image/webp', quality })
      } else {
        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, targetW, targetH)
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
            'image/webp',
            quality,
          )
        })
      }

      bitmap.close?.()
      return blob
    } catch (e: any) {
      error.value = e?.message || 'Image compression failed'
      throw e
    } finally {
      compressing.value = false
    }
  }

  // Keep the old name as an alias so callers don't need updating.
  const compressToAvif = compressToWebp

  return { compressing, error, compressToWebp, compressToAvif }
}
