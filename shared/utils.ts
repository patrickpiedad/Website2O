import type { ApiResponse } from './types'
import Busboy from 'busboy'
import { Readable } from 'stream'

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

  // Allow both image and video types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/heic', 'image/heif', 'image/tiff', 'image/avif']
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-matroska', 'video/3gpp', 'video/x-m4v']
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only images (JPEG, PNG, WebP, GIF, HEIC, etc.) and videos (MP4, MOV, WebM, etc.) are allowed.'
    }
  }

  // Different size limits for images vs videos
  const isVideo = file.type.startsWith('video/')
  const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024 // 100MB for videos, 10MB for images
  const fileTypeLabel = isVideo ? 'video' : 'image'
  const maxSizeLabel = isVideo ? '100MB' : '10MB'
  
  if (file.size > maxSize) {
    return { isValid: false, error: `${fileTypeLabel} file too large. Maximum size is ${maxSizeLabel}.` }
  }

  return { isValid: true }
}

/**
 * Parse multipart form data using streaming parser (for Netlify Functions)
 * This is more memory efficient for large file uploads
 */
export async function parseMultipartForm(
  event: any
): Promise<{ fields: any; files: any[] }> {
  const contentType =
    event.headers['content-type'] || event.headers['Content-Type']

  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data')
  }

  // Check body size early to prevent memory issues
  const bodySize = event.body ? Buffer.byteLength(event.body, event.isBase64Encoded ? 'base64' : 'utf8') : 0
  const maxBodySize = 10 * 1024 * 1024 // 10MB limit
  
  if (bodySize > maxBodySize) {
    throw new Error(`Request body too large: ${(bodySize / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 10MB`)
  }

  // Convert body to buffer
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body)

  return new Promise((resolve, reject) => {
    const fields: any = {}
    const files: any[] = []
    
    // Create a readable stream from the buffer
    const stream = new Readable()
    stream.push(body)
    stream.push(null)

    const busboy = Busboy({ 
      headers: { 'content-type': contentType },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 1, // Only allow 1 file at a time
        fields: 10 // Limit number of fields
      }
    })

    busboy.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: any) => {
      const { filename, mimeType } = info
      const chunks: any[] = []
      let size = 0

      file.on('data', (chunk: any) => {
        chunks.push(chunk)
        size += chunk.length
        
        // Early size check to prevent memory exhaustion
        if (size > 10 * 1024 * 1024) {
          (file as any).destroy()
          reject(new Error('File too large during upload'))
        }
      })

      file.on('end', () => {
        files.push({
          fieldname,
          originalname: filename,
          mimetype: mimeType,
          buffer: Buffer.concat(chunks),
          size
        })
      })

      file.on('error', (error: Error) => {
        reject(error)
      })
    })

    busboy.on('field', (fieldname: string, value: string) => {
      fields[fieldname] = value
    })

    busboy.on('finish', () => {
      resolve({ fields, files })
    })

    busboy.on('error', (error: Error) => {
      reject(error)
    })

    // Handle limits exceeded
    busboy.on('filesLimit', () => {
      reject(new Error('Too many files'))
    })
    
    busboy.on('fieldsLimit', () => {
      reject(new Error('Too many fields'))
    })

    // Pipe the stream to busboy
    stream.pipe(busboy)
  })
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
  // Use custom variable names to avoid Netlify's reserved AWS variables
  const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
  const region = process.env.S3_REGION || process.env.AWS_REGION
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY

  // Log environment variables for debugging (without sensitive data)
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    bucketName: bucketName ? 'SET' : 'MISSING',
    region: region ? 'SET' : 'MISSING',
    accessKeyId: accessKeyId ? 'SET' : 'MISSING',
    secretAccessKey: secretAccessKey ? 'SET' : 'MISSING'
  })

  if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
    const missing = []
    if (!bucketName) missing.push('S3_BUCKET_NAME')
    if (!region) missing.push('S3_REGION')
    if (!accessKeyId) missing.push('S3_ACCESS_KEY_ID')
    if (!secretAccessKey) missing.push('S3_SECRET_ACCESS_KEY')
    
    throw new Error(`Missing required S3 environment variables: ${missing.join(', ')}`)
  }

  return {
    bucketName,
    region,
    accessKeyId,
    secretAccessKey
  }
}
