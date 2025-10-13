/**
 * Format image URL to work with both local and S3 storage
 */
export function getImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined

  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // For local paths starting with /uploads/, prepend the API URL
  if (url.startsWith('/uploads/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return `${apiUrl}${url}`
  }

  // For other relative paths, assume they're from the API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${apiUrl}/uploads/${url}`
}

