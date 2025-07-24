import type { Handler, HandlerContext, HandlerEvent } from '@netlify/functions'

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
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get the photo URL from query parameters
    const photoUrl = event.queryStringParameters?.url
    if (!photoUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Photo URL is required' })
      }
    }

    // Validate that it's from our S3 bucket
    if (!photoUrl.includes('momentdrop-thepiedadwedding.s3.amazonaws.com')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid photo URL' })
      }
    }

    // Fetch the photo from S3
    const response = await fetch(photoUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status}`)
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000'
      },
      body: Buffer.from(imageBuffer).toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    console.error('Download photo error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to download photo',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}