import type {
  PhotoUpload,
  UploadResponse,
  UploadProgress
} from './types'
import { MomentDropError, ErrorCodes } from './types'
import { APP_CONFIG, ERROR_MESSAGES } from './config'
import { formatFileSize } from './utils'

export class UploadManager {
  private apiUrl: string
  private maxFileSize: number
  private allowedTypes: string[]

  constructor(apiUrl: string = '/.netlify/functions') {
    this.apiUrl = apiUrl
    this.maxFileSize = APP_CONFIG.MAX_FILE_SIZE
    this.allowedTypes = APP_CONFIG.ALLOWED_FILE_TYPES
  }

  validateFile(file: File): void {
    if (file.size > this.maxFileSize) {
      throw new MomentDropError(
        `${ERROR_MESSAGES.FILE_TOO_LARGE} ${formatFileSize(this.maxFileSize)}`,
        ErrorCodes.FILE_TOO_LARGE,
        400
      )
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new MomentDropError(
        ERROR_MESSAGES.INVALID_FILE_TYPE,
        ErrorCodes.INVALID_FILE_TYPE,
        400
      )
    }
  }

  async uploadPhoto(
    photoUpload: PhotoUpload,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    this.validateFile(photoUpload.file)

    const formData = new FormData()
    formData.append('photo', photoUpload.file)
    formData.append('label', photoUpload.label || '')
    formData.append('timestamp', photoUpload.timestamp.toISOString())

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response: UploadResponse = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(
              new MomentDropError(
                errorResponse.error || ERROR_MESSAGES.UPLOAD_FAILED,
                ErrorCodes.UPLOAD_FAILED,
                xhr.status
              )
            )
          }
        } catch (error) {
          reject(
            new MomentDropError(
              ERROR_MESSAGES.INVALID_SERVER_RESPONSE,
              ErrorCodes.UPLOAD_FAILED,
              xhr.status
            )
          )
        }
      }

      xhr.onerror = () => {
        reject(
          new MomentDropError(
            ERROR_MESSAGES.NETWORK_ERROR,
            ErrorCodes.NETWORK_ERROR,
            0
          )
        )
      }

      xhr.ontimeout = () => {
        reject(
          new MomentDropError(
            ERROR_MESSAGES.UPLOAD_TIMEOUT,
            ErrorCodes.NETWORK_ERROR,
            408
          )
        )
      }

      xhr.open('POST', `${this.apiUrl}/upload`)
      xhr.timeout = APP_CONFIG.UPLOAD_TIMEOUT
      xhr.send(formData)
    })
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Note: formatFileSize and generateFilename have been moved to utils.ts
// This export is kept for backward compatibility
export { formatFileSize, generateFilename } from './utils'
