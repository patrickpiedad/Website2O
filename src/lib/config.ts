// Frontend Configuration Constants
export const APP_CONFIG = {
  // API Configuration
  API_URL: '/.netlify/functions',
  DEFAULT_SERVER_PORT: 8888, // Netlify dev server port

  // File Upload Limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ] as string[],

  // Camera Settings
  CAMERA: {
    IDEAL_WIDTH: 1280,
    IDEAL_HEIGHT: 720,
    FACING_MODE: 'environment'
  },

  // Image Compression
  COMPRESSION: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    DEFAULT_QUALITY: 0.8,
    MAX_SIZE_MB: 2,
    MIN_QUALITY: 0.1,
    QUALITY_STEP: 0.1
  },

  // UI Settings
  UPLOAD_TIMEOUT: 60000, // 60 seconds
  PHOTO_GALLERY_LIMIT: 100,
  LABEL_MAX_LENGTH: 30,

  // Application Info
  APP_NAME: 'MomentDrop',
  VERSION: '1.0.0'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  CAMERA_NOT_SUPPORTED: 'Camera not supported in this browser',
  CAMERA_PERMISSION_DENIED:
    'Camera permission denied. Please allow camera access and refresh the page.',
  CAMERA_LOAD_FAILED: 'Failed to load camera',
  CAMERA_ACCESS_FAILED: 'Failed to access camera',
  CAMERA_NOT_INITIALIZED: 'Camera not initialized',
  CANVAS_NOT_SUPPORTED: 'Canvas not supported',
  FILE_TOO_LARGE: 'File too large. Maximum size is',
  INVALID_FILE_TYPE:
    'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
  UPLOAD_FAILED: 'Upload failed',
  NETWORK_ERROR: 'Network error during upload',
  UPLOAD_TIMEOUT: 'Upload timeout',
  INVALID_SERVER_RESPONSE: 'Invalid server response',
  COMPRESSION_FAILED: 'Failed to compress image',
  IMAGE_LOAD_FAILED: 'Failed to load image for compression',
  NO_PHOTO_SELECTED: 'No photo selected',
  SERVER_CONNECTION_UNAVAILABLE:
    'Server connection unavailable. Please try again later.',
  GALLERY_LOAD_FAILED:
    'Failed to load gallery. Please check your connection and try again.',
  FOLDER_INFO_LOAD_FAILED: 'Failed to load folder info',
  PHOTOS_LOAD_FAILED: 'Failed to load photos',
  DOWNLOAD_FAILED: 'Failed to download photo. Please try again.',
  APP_INITIALIZATION_FAILED: 'Failed to initialize application'
} as const

// Development/Environment Settings
export const ENV_CONFIG = {
  isDevelopment: () => {
    // Use import.meta.env for Vite environments, fallback to 'development' check
    try {
      return (
        typeof import.meta !== 'undefined' &&
        typeof (import.meta as any).env !== 'undefined' &&
        (import.meta as any).env.DEV === true
      )
    } catch {
      return true // Default to development if unable to determine
    }
  },
  getServerUrl: () => {
    if (typeof window !== 'undefined') {
      // For Netlify, always use the same origin (functions are served from /.netlify/functions/)
      return `${window.location.protocol}//${window.location.host}`
    }
    return `http://localhost:${APP_CONFIG.DEFAULT_SERVER_PORT}`
  }
} as const
