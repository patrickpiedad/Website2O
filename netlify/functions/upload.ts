import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions'
import { S3StorageManager } from '../../shared/s3-client'
import type { UploadResponse } from '../../shared/types'
import {
  createErrorResponse,
  getS3Config,
  handleApiError,
  parseMultipartForm,
  validateFileUpload
} from '../../shared/utils'

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify(createErrorResponse('Method not allowed'))
    }
  }

  try {
    // Parse multipart form data
    const { fields, files } = await parseMultipartForm(event)

    if (files.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(createErrorResponse('No photo file provided'))
      }
    }

    const file = files[0] // Get the first file
    const label = fields.label || ''
    const timestamp = fields.timestamp || new Date().toISOString()

    // Log file details before validation
    console.log('Upload function - file details:', {
      filename: file.originalname,
      mimetype: file.mimetype, 
      size: file.size,
      label
    })

    // Validate file
    const validation = validateFileUpload({
      type: file.mimetype,
      size: file.size
    })

    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(createErrorResponse(validation.error!))
      }
    }

    // Validate timestamp
    if (timestamp && isNaN(Date.parse(timestamp))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(createErrorResponse('Invalid timestamp format'))
      }
    }

    // Validate label length
    if (label && typeof label === 'string' && label.length > 30) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify(
          createErrorResponse('Label too long. Maximum 30 characters allowed.')
        )
      }
    }

    // Initialize S3 manager
    const s3Config = getS3Config()
    const s3Manager = new S3StorageManager(s3Config)

    // Upload file to S3
    console.log(
      `Uploading file: ${file.originalname}, Size: ${file.size} bytes, Label: "${label}"`
    )
    const fileId = await s3Manager.uploadFile(file, label, timestamp)

    const response: UploadResponse = {
      success: true,
      fileId,
      message: 'Photo uploaded successfully to S3'
    }

    console.log(`Upload successful: File ID ${fileId}`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    }
  } catch (error) {
    console.error('Upload function error:', error)
    const { statusCode, response } = handleApiError(error)

    return {
      statusCode,
      headers,
      body: JSON.stringify(response)
    }
  }
}
