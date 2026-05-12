import { ref } from 'vue'

let vipsPromise: Promise<any> | null = null

async function getVips() {
  if (!vipsPromise) {
    const Vips = (await import('wasm-vips')).default
    vipsPromise = Vips({
      preRun: [(module: any) => {
        module.setAutoDeleteLater(true)
      }],
    })
  }
  return vipsPromise
}

export function useImageCompression() {
  const compressing = ref(false)
  const error = ref<string | null>(null)

  async function compressToAvif(file: File, maxWidth = 1920): Promise<Blob> {
    compressing.value = true
    error.value = null

    try {
      const vips = await getVips()
      const arrayBuffer = await file.arrayBuffer()

      const image = vips.Image.newFromBuffer(arrayBuffer)
      try {
        let processed = image

        if (image.width > maxWidth) {
          const scale = maxWidth / image.width
          processed = image.resize(scale)
        }

        const output = processed.heifsaveBuffer({
          Q: 80,
          compression: 'av1',
          effort: 4,
        })

        return new Blob([output], { type: 'image/avif' })
      } finally {
        image.delete()
        vips.Thread.terminate()
      }
    } catch (e: any) {
      error.value = e?.message || 'Image compression failed'
      throw e
    } finally {
      compressing.value = false
    }
  }

  return { compressing, error, compressToAvif }
}
