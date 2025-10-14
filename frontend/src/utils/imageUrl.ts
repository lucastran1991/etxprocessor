/**
 * Format image URL to work with both local and S3 storage
 */
import { resolveUploadsUrl } from '@/utils/apiBase'

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
    return resolveUploadsUrl(url)
  }

  // For other relative paths, assume they're from the API
  return resolveUploadsUrl(url)
}

