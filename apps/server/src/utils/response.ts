export function json<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function success<T>(data?: T) {
  return json({ success: true, data })
}

export function error(code: string, message: string, status = 400) {
  return json({ success: false, error: { code, message } }, status)
}
