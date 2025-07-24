import type { CameraConstraints } from './types'
import { MomentDropError, ErrorCodes } from './types'
import { APP_CONFIG, ERROR_MESSAGES } from './config'

export class CameraManager {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private stream: MediaStream | null = null
  private isInitialized: boolean = false

  constructor() {
    // Create canvas element for photo capture
    this.canvas = document.createElement('canvas')
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement
    await this.initialize()
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new MomentDropError(
        ERROR_MESSAGES.CAMERA_NOT_SUPPORTED,
        ErrorCodes.CAMERA_NOT_SUPPORTED,
        400
      )
    }

    const constraints: CameraConstraints = {
      video: {
        width: { ideal: APP_CONFIG.CAMERA.IDEAL_WIDTH },
        height: { ideal: APP_CONFIG.CAMERA.IDEAL_HEIGHT },
        facingMode: { ideal: APP_CONFIG.CAMERA.FACING_MODE as any }
      },
      audio: false
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (this.video) {
        this.video.srcObject = this.stream

        return new Promise((resolve, reject) => {
          if (this.video) {
            this.video.onloadedmetadata = () => {
              this.isInitialized = true
              resolve()
            }

            this.video.onerror = () => {
              reject(
                new MomentDropError(
                  ERROR_MESSAGES.CAMERA_LOAD_FAILED,
                  ErrorCodes.CAMERA_NOT_SUPPORTED,
                  400
                )
              )
            }
          } else {
            reject(
              new MomentDropError(
                ERROR_MESSAGES.CAMERA_NOT_INITIALIZED,
                ErrorCodes.CAMERA_NOT_SUPPORTED,
                400
              )
            )
          }
        })
      }
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new MomentDropError(
            ERROR_MESSAGES.CAMERA_PERMISSION_DENIED,
            ErrorCodes.CAMERA_PERMISSION_DENIED,
            403
          )
        }
      }

      throw new MomentDropError(
        ERROR_MESSAGES.CAMERA_ACCESS_FAILED,
        ErrorCodes.CAMERA_NOT_SUPPORTED,
        400
      )
    }
  }

  async capturePhoto(): Promise<{ dataUrl: string; file: File }> {
    if (!this.isInitialized || !this.stream || !this.video || !this.canvas) {
      throw new MomentDropError(
        ERROR_MESSAGES.CAMERA_NOT_INITIALIZED,
        ErrorCodes.CAMERA_NOT_SUPPORTED,
        400
      )
    }

    const context = this.canvas.getContext('2d')
    if (!context) {
      throw new MomentDropError(
        ERROR_MESSAGES.CANVAS_NOT_SUPPORTED,
        ErrorCodes.CAMERA_NOT_SUPPORTED,
        400
      )
    }

    this.canvas.width = this.video.videoWidth
    this.canvas.height = this.video.videoHeight

    context.drawImage(this.video, 0, 0)

    const dataUrl = this.canvas.toDataURL(
      'image/jpeg',
      APP_CONFIG.COMPRESSION.DEFAULT_QUALITY
    )
    const file = await this.dataURLToFile(dataUrl)

    return { dataUrl, file }
  }

  async dataURLToFile(
    dataURL: string,
    filename: string = 'photo.jpg'
  ): Promise<File> {
    const response = await fetch(dataURL)
    const blob = await response.blob()
    return new File([blob], filename, { type: 'image/jpeg' })
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    if (this.video) {
      this.video.srcObject = null
    }
    this.isInitialized = false
  }

  isActive(): boolean {
    return this.isInitialized && this.stream !== null
  }
}

export function compressImage(
  file: File,
  maxSizeMB: number = APP_CONFIG.COMPRESSION.MAX_SIZE_MB
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(
        new MomentDropError(
          ERROR_MESSAGES.CANVAS_NOT_SUPPORTED,
          ErrorCodes.CAMERA_NOT_SUPPORTED,
          400
        )
      )
      return
    }

    img.onload = () => {
      const maxWidth = APP_CONFIG.COMPRESSION.MAX_WIDTH
      const maxHeight = APP_CONFIG.COMPRESSION.MAX_HEIGHT

      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      let quality = APP_CONFIG.COMPRESSION.DEFAULT_QUALITY
      const targetSize = maxSizeMB * 1024 * 1024

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new MomentDropError(
                  ERROR_MESSAGES.COMPRESSION_FAILED,
                  ErrorCodes.UPLOAD_FAILED,
                  500
                )
              )
              return
            }

            if (
              blob.size <= targetSize ||
              quality <= APP_CONFIG.COMPRESSION.MIN_QUALITY
            ) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              quality -= APP_CONFIG.COMPRESSION.QUALITY_STEP
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => {
      reject(
        new MomentDropError(
          ERROR_MESSAGES.IMAGE_LOAD_FAILED,
          ErrorCodes.INVALID_FILE_TYPE,
          400
        )
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
