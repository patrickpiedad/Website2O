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
      // Generate filename with date first, then label
      const date = new Date(timestamp)
      const dateStr = date.toISOString().split('T')[0]
      const timeStr = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
      const fileExtension = file.originalname.split('.').pop() || 'jpg'
      
      // Format: YYYY-MM-DD_HH-MM-SS_label.ext or YYYY-MM-DD_HH-MM-SS.ext
      let filename: string
      if (label && label.trim()) {
        const sanitizedLabel = this.sanitizeLabel(label.trim())
        filename = `${dateStr}_${timeStr}_${sanitizedLabel}.${fileExtension}`
      } else {
        filename = `${dateStr}_${timeStr}.${fileExtension}`
      }

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
      console.error('Storage upload error:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  /**
   * List recent photos from S3
   */
  async listRecentFiles(limit: number = 20): Promise<Photo[]> {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'photos/'
        // Removed MaxKeys to allow fetching more items for pagination
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
      console.error('Error listing files:', error)
      throw new Error('Failed to list files from storage')
    }
  }

  /**
   * List photos grouped by date
   */
  async listPhotosGroupedByDate(): Promise<{ [dateKey: string]: Photo[] }> {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: 'photos/'
      }

      const command = new ListObjectsV2Command(listParams)
      const result = await this.s3Client.send(command)

      if (!result.Contents) {
        return {}
      }

      // Sort by last modified (most recent first)
      const sortedObjects = result.Contents.filter(
        (obj) => obj.Key && obj.Size && obj.Size > 0
      ).sort((a, b) => {
        const dateA = a.LastModified ? new Date(a.LastModified).getTime() : 0
        const dateB = b.LastModified ? new Date(b.LastModified).getTime() : 0
        return dateB - dateA
      })

      // Convert to Photo objects and group by date
      const photoGroups: { [dateKey: string]: Photo[] } = {}
      
      for (const obj of sortedObjects) {
        try {
          const photo = await this.convertS3ObjectToPhoto(obj)
          const dateKey = this.getDateGroupKey(new Date(photo.timestamp))
          
          if (!photoGroups[dateKey]) {
            photoGroups[dateKey] = []
          }
          photoGroups[dateKey].push(photo)
        } catch (error) {
          console.warn(
            `Failed to convert S3 object to photo: ${obj.Key}`,
            error
          )
        }
      }

      return photoGroups
    } catch (error) {
      console.error('Error listing files:', error)
      throw new Error('Failed to list files from storage')
    }
  }

  /**
   * Get date group key for organizing photos
   */
  private getDateGroupKey(date: Date): string {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const photoDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const diffTime = today.getTime() - photoDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))


    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return 'This Week'
    } else if (diffDays <= 30) {
      return 'This Month'
    } else if (diffDays <= 365) {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else {
      return date.getFullYear().toString()
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
        id: 'storage-bucket',
        photoCount: photoCount,
        webViewLink: '#'
      }
    } catch (error) {
      console.error('Error getting folder info:', error)
      throw new Error('Failed to get folder information')
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
      throw new Error('Failed to generate download URL')
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
        message: 'Successfully connected to storage'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Storage connection failed'
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
    // New format: YYYY-MM-DD_HH-MM-SS_label.ext
    // Old format: MomentDrop_YYYY-MM-DD_HH-MM-SS_label.ext
    let label = ''
    if (filename.includes('_')) {
      const parts = filename.replace(/\.[^/.]+$/, '').split('_')
      if (parts.length >= 3) {
        // Check if it's new format (starts with date) or old format (starts with MomentDrop)
        if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
          // New format: take everything after the second underscore
          label = parts.slice(2).join('_')
        } else if (parts[0] === 'MomentDrop' && parts.length >= 4) {
          // Old format: take everything after the third underscore
          label = parts.slice(3).join('_')
        }
      }
    }

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
   * Sanitize label for filename
   */
  private sanitizeLabel(label: string): string {
    // Remove invalid characters and limit length
    return label
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
  }

  /**
   * Sanitize filename for S3 (legacy method, kept for compatibility)
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
      // Image formats
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      heic: 'image/heic',
      heif: 'image/heif',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      avif: 'image/avif',
      // Video formats
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      wmv: 'video/x-ms-wmv',
      webm: 'video/webm',
      mkv: 'video/x-matroska',
      '3gp': 'video/3gpp',
      m4v: 'video/x-m4v'
    }
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}
