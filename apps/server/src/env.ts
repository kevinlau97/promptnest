export type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
  ASSETS: Fetcher
  ADMIN_EMAIL: string
  ADMIN_PASSWORD: string
  R2_PUBLIC_URL: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: { user: { email: string } }
}
