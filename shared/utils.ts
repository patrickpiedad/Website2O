import type { ApiResponse } from './types'

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data: T,
  success: boolean = true
): ApiResponse<T> {
  return {
    success,
    data,
    timestamp: new Date().toISOString()
  }
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string
): ApiResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): {
  statusCode: number
  response: ApiResponse
} {
  console.error('API Error:', error)

  if (error.statusCode) {
    return {
      statusCode: error.statusCode,
      response: createErrorResponse(error.message)
    }
  }

  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      response: createErrorResponse('Invalid request data')
    }
  }

  if (error.message?.includes('S3') || error.message?.includes('AWS')) {
    // Log the full error for debugging
    console.error('S3/AWS Error Details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    })
    
    return {
      statusCode: 500,
      response: createErrorResponse(`Storage service error: ${error.message}`)
    }
  }

  return {
    statusCode: 500,
    response: createErrorResponse('Internal server error')
  }
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: any): {
  isValid: boolean
  error?: string
} {
  if (!file) {
    return { isValid: false, error: 'No file provided' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
    }
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB.' }
  }

  return { isValid: true }
}

/**
 * Parse multipart form data (for Netlify Functions)
 * This is a robust parser for handling file uploads in serverless functions
 */
export async function parseMultipartForm(
  event: any
): Promise<{ fields: any; files: any[] }> {
  const contentType =
    event.headers['content-type'] || event.headers['Content-Type']

  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data')
  }

  // Get the body as a buffer
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body)

  // Extract boundary
  const boundaryMatch = contentType.match(/boundary=(.+)$/)
  if (!boundaryMatch) {
    throw new Error('No boundary found in Content-Type')
  }

  const boundary = '--' + boundaryMatch[1]
  const textDecoder = new TextDecoder()

  // Split body by boundary
  const parts = []
  let start = 0

  while (true) {
    const boundaryIndex = body.indexOf(boundary, start)
    if (boundaryIndex === -1) break

    if (start !== 0) {
      parts.push(body.slice(start, boundaryIndex))
    }

    start = boundaryIndex + boundary.length

    // Skip CRLF after boundary
    if (body[start] === 0x0d && body[start + 1] === 0x0a) {
      start += 2
    }
  }

  const fields: any = {}
  const files: any[] = []

  for (const part of parts) {
    if (part.length === 0) continue

    // Find the end of headers (double CRLF)
    const headerEndIndex = part.indexOf('\r\n\r\n')
    if (headerEndIndex === -1) continue

    const headerBuffer = part.slice(0, headerEndIndex)
    const contentBuffer = part.slice(headerEndIndex + 4)

    const headers = textDecoder.decode(headerBuffer)
    const dispositionMatch = headers.match(
      /Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/
    )

    if (!dispositionMatch) continue

    const fieldName = dispositionMatch[1]
    const fileName = dispositionMatch[2]

    if (fileName) {
      // This is a file
      const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/)
      const mimeType = contentTypeMatch
        ? contentTypeMatch[1]
        : 'application/octet-stream'

      files.push({
        fieldname: fieldName,
        originalname: fileName,
        mimetype: mimeType,
        buffer: contentBuffer,
        size: contentBuffer.length
      })
    } else {
      // This is a regular field
      fields[fieldName] = textDecoder.decode(contentBuffer).trim()
    }
  }

  return { fields, files }
}

/**
 * Get S3 configuration from environment variables
 */
export function getS3Config(): {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
} {
  const bucketName = process.env.AWS_S3_BUCKET_NAME
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required AWS S3 environment variables')
  }

  return {
    bucketName,
    region,
    accessKeyId,
    secretAccessKey
  }
}
