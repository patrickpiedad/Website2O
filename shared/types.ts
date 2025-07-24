// Shared types for Netlify Functions and Frontend

export interface S3Config {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface Photo {
  id: string
  filename: string
  originalName: string
  label: string
  timestamp: string
  size: number
  url: string
  thumbnailUrl?: string
  mimeType: string
  createdTime: string
}

export interface UploadResponse {
  success: boolean
  fileId?: string
  message: string
  error?: string
}

export interface FolderInfo {
  name: string
  id: string
  photoCount: number
  webViewLink?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp?: string
}

export interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  buffer: Buffer
  size: number
}

export interface ApiError extends Error {
  statusCode: number
  code?: string
}
