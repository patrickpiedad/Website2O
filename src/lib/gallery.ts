import type { Photo, FolderInfo } from './types'
import {
  getPhotoDisplayUrl,
  createDownloadFilename,
  formatTimestamp,
  downloadFile,
  getElementsByIds
} from './utils'

// Types are now imported from ./types.ts

class GalleryApp {
  private elements: { [key: string]: HTMLElement }

  constructor() {
    this.elements = this.getElements()
    this.initializeEventListeners()
    this.loadGallery()
  }

  private getElements(): { [key: string]: HTMLElement } {
    const ids = [
      'loading',
      'error',
      'errorMessage',
      'emptyGallery',
      'photoGrid',
      'photoCount',
      'folderName',
      'galleryStats',
      'imageModal',
      'modalImage',
      'closeModal'
    ]

    return getElementsByIds(ids)
  }

  private initializeEventListeners(): void {
    // Modal functionality
    this.elements.closeModal.addEventListener('click', () => this.closeModal())
    this.elements.imageModal.addEventListener('click', () => this.closeModal())

    // Prevent modal close when clicking on image
    this.elements.modalImage.addEventListener('click', (e) =>
      e.stopPropagation()
    )
  }

  private async loadGallery(): Promise<void> {
    try {
      // Load folder info and photos in parallel
      const [folderInfo, photos] = await Promise.all([
        this.loadFolderInfo(),
        this.loadPhotos()
      ])

      this.updateStats(folderInfo)
      this.displayPhotos(photos)
    } catch (error) {
      this.showError(
        'Failed to load gallery. Please check your connection and try again.'
      )
      console.error('Gallery load error:', error)
    } finally {
      this.elements.loading.style.display = 'none'
    }
  }

  private async loadFolderInfo(): Promise<FolderInfo> {
    const response = await fetch('/api/folder-info')
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load folder info')
    }

    return result.data
  }

  private async loadPhotos(): Promise<Photo[]> {
    const response = await fetch('/api/recent-photos?limit=100')
    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to load photos')
    }

    return result.data
  }

  private updateStats(folderInfo: FolderInfo): void {
    this.elements.folderName.textContent = folderInfo.name
    this.elements.photoCount.textContent = folderInfo.photoCount.toString()
  }

  private displayPhotos(photos: Photo[]): void {
    if (photos.length === 0) {
      this.elements.emptyGallery.style.display = 'block'
      return
    }

    const grid = this.elements.photoGrid
    grid.innerHTML = ''

    photos.forEach((photo) => {
      const photoCard = this.createPhotoCard(photo)
      grid.appendChild(photoCard)
    })
  }

  private createPhotoCard(photo: Photo): HTMLElement {
    const card = document.createElement('div')
    card.className = 'photo-card'

    const formattedTime = formatTimestamp(photo.timestamp)

    // Use thumbnail URL for display if available, otherwise use main URL
    const displayUrl = photo.thumbnailUrl || this.getPhotoUrl(photo)

    card.innerHTML = `
            <img src="${displayUrl}" alt="${photo.label || 'Wedding photo'}" loading="lazy">
            <div class="photo-info">
                <div class="photo-label">${photo.label || 'Untitled'}</div>
                <div class="photo-timestamp">${formattedTime}</div>
                <div class="photo-actions">
                    <button class="download-btn" data-photo-id="${photo.id}" title="Download photo">
                        📥 Download
                    </button>
                    ${
                      photo.webViewLink
                        ? `<button class="view-btn" data-photo-url="${photo.webViewLink}" title="View photo">
                        👁️ View
                    </button>`
                        : ''
                    }
                </div>
            </div>
        `

    // Add click handler for modal
    const img = card.querySelector('img') as HTMLImageElement
    img.addEventListener('click', () => this.openModal(photo))

    // Add click handler for download button
    const downloadBtn = card.querySelector('.download-btn') as HTMLButtonElement
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.downloadPhoto(photo)
    })

    // Add click handler for view button
    const viewBtn = card.querySelector('.view-btn') as HTMLButtonElement
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const url = viewBtn.dataset.photoUrl
        if (url) {
          window.open(url, '_blank')
        }
      })
    }

    return card
  }

  private getPhotoUrl(photo: Photo): string {
    // For S3 photos, use the direct URL
    if (photo.url) {
      return getPhotoDisplayUrl(photo.url)
    }
    // Fallback to webViewLink if available
    return photo.webViewLink || photo.url
  }

  private openModal(photo: Photo): void {
    const modalImg = this.elements.modalImage as HTMLImageElement
    // For modal, use the full-size image URL
    modalImg.src = this.getPhotoUrl(photo)
    modalImg.alt = photo.label || 'Wedding photo'
    this.elements.imageModal.style.display = 'block'
  }

  private closeModal(): void {
    this.elements.imageModal.style.display = 'none'
  }

  private async downloadPhoto(photo: Photo): Promise<void> {
    try {
      let downloadUrl: string

      if (photo.path) {
        // Local storage - use the existing URL
        downloadUrl = getPhotoDisplayUrl(photo.url)
      } else {
        // S3 storage - use the direct URL or download API endpoint
        downloadUrl = photo.url || `/api/download/${photo.id}`
      }

      const downloadName = createDownloadFilename(photo.label, photo.filename)
      downloadFile(downloadUrl, downloadName)
    } catch (error) {
      console.error('Download error:', error)
      this.showError('Failed to download photo. Please try again.')
    }
  }

  private showError(message: string): void {
    this.elements.errorMessage.textContent = message
    this.elements.error.style.display = 'block'
  }
}

// Initialize the gallery when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new GalleryApp()
  } catch (error) {
    console.error('Failed to initialize gallery:', error)
    document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #721c24;">
                <h1>Wedding Photo Gallery</h1>
                <p>Sorry, there was an error loading the gallery. Please refresh the page.</p>
                <a href="/">← Back to Camera</a>
            </div>
        `
  }
})
