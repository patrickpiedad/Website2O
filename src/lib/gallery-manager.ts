import type { Photo, FolderInfo } from './types'
import { MomentDropError, ErrorCodes } from './types'
import { ERROR_MESSAGES } from './config'

export class GalleryManager {
  private apiUrl: string

  constructor(apiUrl: string = '/.netlify/functions') {
    this.apiUrl = apiUrl
  }

  async getFolderInfo(): Promise<FolderInfo> {
    try {
      const response = await fetch(`${this.apiUrl}/folder-info`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load folder info')
      }

      return result.data
    } catch (error) {
      throw new MomentDropError(
        ERROR_MESSAGES.FOLDER_INFO_LOAD_FAILED,
        ErrorCodes.NETWORK_ERROR,
        500
      )
    }
  }

  async getRecentPhotos(limit: number = 20): Promise<Photo[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/recent-photos?limit=${limit}`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load photos')
      }

      return result.data
    } catch (error) {
      throw new MomentDropError(
        ERROR_MESSAGES.PHOTOS_LOAD_FAILED,
        ErrorCodes.NETWORK_ERROR,
        500
      )
    }
  }
}
