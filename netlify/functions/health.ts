import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions'
import { createApiResponse } from '../../shared/utils'

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
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  const healthData = {
    message: 'MomentDrop API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '2.0.0',
    storage: 'AWS S3'
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(createApiResponse(healthData))
  }
}
