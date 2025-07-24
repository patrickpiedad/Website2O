import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { S3Config, Photo, FolderInfo, MulterFile } from './types'

export class S3StorageManager {
  private s3Client: S3Client
  private bucketName: string

  constructor(config: S3Config) {
    this.bucketName = config.bucketName
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    })
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: MulterFile,
    label: string = '',
    timestamp: string
  ): Promise<string> {
    try {
      // Generate filename with timestamp and label
      const dateStr = new Date(timestamp).toISOString().split('T')[0]
      const timeStr = new Date(timestamp)
        .toISOString()
        .split('T')[1]
        .split('.')[0]
        .replace(/:/g, '-')
      const fileExtension = file.originalname.split('.').pop() || 'jpg'
      const baseFilename = `MomentDrop_${dateStr}_${timeStr}.${fileExtension}`
      const filename = label
        ? this.sanitizeFilename(label, baseFilename)
        : baseFilename

      // Create S3 upload parameters
      const uploadParams = {
        Bucket: this.bucketName,
        Key: `photos/${filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'original-name': file.originalname,
          label: label || '',
          timestamp: timestamp,
          'upload-date': new Date().toISOString()
        }
        // Note: Removed ACL parameter - bucket should be configured for public access
      }

      // Upload to S3
      const command = new PutObjectCommand(uploadParams)
      await this.s3Client.send(command)

      // Return the S3 key as file ID
      return `photos/${filename}`
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * List recent photos from S3
   */
  async listRecentFiles(limit: number = 20): Promise<Photo[]> {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'photos/',
        MaxKeys: limit
      }

      const command = new ListObjectsV2Command(listParams)
      const result = await this.s3Client.send(command)

      if (!result.Contents) {
        return []
      }

      // Sort by last modified (most recent first)
      const sortedObjects = result.Contents.filter(
        (obj) => obj.Key && obj.Size && obj.Size > 0
      ).sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0
        return dateB - dateA
      })

      // Convert to Photo objects
      const photos: Photo[] = []
      for (const obj of sortedObjects.slice(0, limit)) {
        try {
          const photo = await this.convertS3ObjectToPhoto(obj)
          photos.push(photo)
        } catch (error) {
          console.warn(
            `Failed to convert S3 object to photo: ${obj.Key}`,
            error
          )
        }
      }

      return photos
    } catch (error) {
      console.error('Error listing S3 files:', error)
      throw new Error(
        `Failed to list files from S3: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get folder info (bucket stats)
   */
  async getFolderInfo(): Promise<FolderInfo> {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'photos/'
      }

      const command = new ListObjectsV2Command(listParams)
      const result = await this.s3Client.send(command)

      const photoCount = result.KeyCount || 0

      return {
        name: 'MomentDrop Wedding Photos',
        id: this.bucketName,
        photoCount: photoCount,
        webViewLink: `https://${this.bucketName}.s3.amazonaws.com/`
      }
    } catch (error) {
      console.error('Error getting folder info:', error)
      throw new Error(
        `Failed to get folder info: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(fileKey: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${fileKey}`
  }

  /**
   * Get presigned download URL (for private files)
   */
  async getDownloadUrl(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }) // 1 hour
    } catch (error) {
      console.error('Error generating download URL:', error)
      throw new Error(
        `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Test S3 connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const listParams = {
        Bucket: this.bucketName,
        MaxKeys: 1
      }

      const command = new ListObjectsV2Command(listParams)
      await this.s3Client.send(command)

      return {
        success: true,
        message: `Successfully connected to S3 bucket: ${this.bucketName}`
      }
    } catch (error) {
      return {
        success: false,
        message: `S3 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Convert S3 object to Photo interface
   */
  private async convertS3ObjectToPhoto(obj: any): Promise<Photo> {
    const key = obj.Key
    const filename = key.split('/').pop() || key
    const timestamp = obj.LastModified
      ? obj.LastModified.toISOString()
      : new Date().toISOString()

    // Extract label from filename if present
    const label = filename.includes('_')
      ? filename
          .split('_')
          .slice(2)
          .join('_')
          .replace(/\.[^/.]+$/, '')
      : ''

    return {
      id: key,
      filename: filename,
      originalName: filename,
      label: label,
      timestamp: timestamp,
      size: obj.Size || 0,
      url: this.getPublicUrl(key),
      mimeType: this.getMimeTypeFromExtension(filename),
      createdTime: timestamp
    }
  }

  /**
   * Sanitize filename for S3
   */
  private sanitizeFilename(label: string, baseFilename: string): string {
    // Remove invalid characters and limit length
    const sanitized = label
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)

    const extension = baseFilename.split('.').pop()
    const base = baseFilename.replace(/\.[^/.]+$/, '')

    return sanitized ? `${base}_${sanitized}.${extension}` : baseFilename
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml'
    }
    return mimeTypes[extension || ''] || 'image/jpeg'
  }
}
