import { APP_CONFIG, ENV_CONFIG } from './config'

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate a safe filename with timestamp
 */
export function generateFilename(label?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const prefix = label
    ? label.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')
    : 'photo'
  return `${prefix}_${timestamp}.jpg`
}

/**
 * Sanitize label for use in filenames
 */
export function sanitizeLabel(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, APP_CONFIG.LABEL_MAX_LENGTH)
}

/**
 * Get photo URL for display (handles development vs production)
 */
export function getPhotoDisplayUrl(photoUrl: string): string {
  if (photoUrl.startsWith('/uploads')) {
    // Use environment-aware server URL
    return `${ENV_CONFIG.getServerUrl()}${photoUrl}`
  }
  return photoUrl
}

/**
 * Create download filename from photo label and original filename
 */
export function createDownloadFilename(
  label: string,
  originalFilename: string
): string {
  const extension = originalFilename.split('.').pop() || 'jpg'
  return label ? `${sanitizeLabel(label)}.${extension}` : originalFilename
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

/**
 * Download file programmatically
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * Get element by ID with type safety
 */
export function getElementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T
  if (!element) {
    throw new Error(`Element with id '${id}' not found`)
  }
  return element
}

/**
 * Get multiple elements by ID
 */
export function getElementsByIds(ids: string[]): {
  [key: string]: HTMLElement
} {
  const elements: { [key: string]: HTMLElement } = {}
  ids.forEach((id) => {
    elements[id] = getElementById(id)
  })
  return elements
}
