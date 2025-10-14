// Centralized API base URL resolution for local dev, LAN, and production

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function isPrivateIp(hostname: string): boolean {
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, localhost patterns
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

export function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL
  if (explicit && explicit.trim().length > 0) return explicit

  if (isBrowser()) {
    const protocol = window.location.protocol || 'http:'
    const hostname = window.location.hostname

    // Default FastAPI backend port across environments
    const backendPort = '8000'

    // For localhost or private LAN, talk to same host on port 8000
    if (isPrivateIp(hostname)) {
      return `${protocol}//${hostname}:${backendPort}`
    }

    // For production domains, prefer same host on port 8000 unless overridden
    return `${protocol}//${hostname}:${backendPort}`
  }

  // SSR/build-time fallback
  return 'http://localhost:8000'
}

export function resolveUploadsUrl(path: string): string {
  const base = resolveApiBaseUrl()
  if (path.startsWith('/uploads/')) {
    return `${base}${path}`
  }
  return `${base}/uploads/${path.replace(/^\/?/, '')}`
}


