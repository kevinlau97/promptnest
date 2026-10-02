import type { Bindings } from '../env.js'

export async function uploadToR2(env: Bindings, key: string, body: ArrayBuffer, contentType: string): Promise<string> {
  await env.IMAGES.put(key, body, { httpMetadata: { contentType } })
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
}
