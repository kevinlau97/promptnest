// 图片代理 - 绕过 CORS 限制
export function useImageProxy() {
  // 需要代理的域名列表
  const proxyDomains = ['bild.quarker.cc', 'img.imliuk.com']

  function getProxiedUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // 检查是否需要代理
      if (proxyDomains.some(d => parsed.hostname === d || parsed.hostname.endsWith(d))) {
        return `/api/proxy/image?url=${encodeURIComponent(url)}`
      }
      return url
    } catch {
      // 无效 URL，直接返回
      return url
    }
  }

  // 从图片对象或字符串中获取 URL
  function getImageUrl(img: string | { url?: string; filename?: string }): string {
    const url = typeof img === 'string' ? img : img?.url || ''
    return getProxiedUrl(url)
  }

  return {
    getProxiedUrl,
    getImageUrl,
  }
}
