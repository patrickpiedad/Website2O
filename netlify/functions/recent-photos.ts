import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { S3StorageManager } from '../../shared/s3-client'
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  getS3Config
} from '../../shared/utils'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify(createErrorResponse('Method not allowed'))
    }
  }

  try {
    // Get limit from query parameters
    const queryParams = event.queryStringParameters || {}
    const requestedLimit = parseInt(queryParams.limit || '20', 10)
    const limit = Math.min(Math.max(requestedLimit, 1), 50) // Clamp between 1 and 50

    // Initialize S3 manager
    const s3Config = getS3Config()
    const s3Manager = new S3StorageManager(s3Config)

    // Get recent photos from S3
    const photos = await s3Manager.listRecentFiles(limit)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(createApiResponse(photos))
    }
  } catch (error) {
    console.error('Recent photos function error:', error)
    const { statusCode, response } = handleApiError(error)

    return {
      statusCode,
      headers,
      body: JSON.stringify(response)
    }
  }
}
