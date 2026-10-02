const encoder = new TextEncoder()

/** Compare platform secrets without saving a reusable password hash. */
export async function verifyCredentials(
  email: string,
  password: string,
  adminEmail: string,
  adminPassword: string,
): Promise<boolean> {
  if (!adminEmail || !adminPassword) return false

  // JSON preserves the boundary between the two credentials. Fixed-length,
  // transient digests let Workers compare both values without early returns.
  const [provided, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify([email, password]))),
    crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify([adminEmail, adminPassword]))),
  ])
  return crypto.subtle.timingSafeEqual(provided, expected)
}
