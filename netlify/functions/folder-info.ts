import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions'
import { S3StorageManager } from '../../shared/s3-client'
import {
  createApiResponse,
  createErrorResponse,
  getS3Config,
  handleApiError
} from '../../shared/utils'

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
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
    // Initialize S3 manager
    const s3Config = getS3Config()
    const s3Manager = new S3StorageManager(s3Config)

    // Get folder info from S3
    const folderInfo = await s3Manager.getFolderInfo()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(createApiResponse(folderInfo))
    }
  } catch (error) {
    console.error('Folder info function error:', error)
    const { statusCode, response } = handleApiError(error)

    return {
      statusCode,
      headers,
      body: JSON.stringify(response)
    }
  }
}
