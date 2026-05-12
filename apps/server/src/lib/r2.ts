import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://ae483752ffee4c0079a2b55439dad5b8.r2.cloudflarestorage.com'
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '79bf65bbab41916e430863e568f330b6'
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '15792b832357029b1be57392d360a5acd0c5047a1bed75a6ff96cd24681fea19'
const R2_BUCKET = process.env.R2_BUCKET || 'promptnest'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://bild.quarker.cc'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)

  return `${R2_PUBLIC_URL}/${key}`
}
