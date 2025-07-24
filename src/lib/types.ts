// Core application types
export interface PhotoUpload {
  file: File
  label: string
  timestamp: Date
}

export interface UploadResponse {
  success: boolean
  fileId?: string
  error?: string
  message?: string
  data?: any
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface PhotoMetadata {
  filename: string
  label: string
  timestamp: string
  size: number
}

// Unified photo interface that works for both local and S3 storage
export interface Photo {
  id: string
  filename: string
  originalName: string
  label: string
  timestamp: string
  size: number
  url: string
  thumbnailUrl?: string
  webViewLink?: string
  // Local storage specific
  path?: string
  // S3 storage specific
  mimeType?: string
  createdTime?: string
}

// For backwards compatibility
export interface LocalPhoto extends Photo {
  path: string
}

export interface FolderInfo {
  name: string
  id: string
  photoCount: number
}

// Camera types
export interface CameraConstraints {
  video: MediaTrackConstraints
  audio: false
}

// Error handling
export class MomentDropError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'MomentDropError'
  }
}

// Error codes as string literal types for better tree-shaking
export type ErrorCode =
  | 'CAMERA_NOT_SUPPORTED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR'

export const ErrorCodes: Record<ErrorCode, ErrorCode> = {
  CAMERA_NOT_SUPPORTED: 'CAMERA_NOT_SUPPORTED',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const
