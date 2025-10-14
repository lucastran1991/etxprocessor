/**
 * Format image URL to work with both local and S3 storage
 */
export function getImageUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined

  // Pass-through data/blobs (e.g., local previews from FileReader / ObjectURL)
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // For local paths starting with /uploads/, prepend the API URL
  if (url.startsWith('/uploads/')) {
    const apiUrl = (typeof window !== 'undefined')
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    return `${apiUrl}${url}`
  }

  // For other relative paths, assume they're from the API
  const apiUrl = (typeof window !== 'undefined')
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  return `${apiUrl}/uploads/${url}`
}

