import React, { useRef, useState } from 'react'

// MomentDrop Wedding Photo Sharing - React Component
const MomentDrop: React.FC = () => {
  const [currentPhoto, setCurrentPhoto] = useState<any>(null)
  const [galleryVisible, setGalleryVisible] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: string } | null>(
    null
  )
  const [photos, setPhotos] = useState<any[]>([])
  const [folderInfo, setFolderInfo] = useState<any>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoLabelRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Camera functionality
  const startCamera = async (facingMode: 'user' | 'environment' = currentFacingMode) => {
    try {
      console.log('Starting camera with facing mode:', facingMode)
      
      // Stop existing stream if any
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } }
      })
      setCurrentStream(stream)
      setCurrentFacingMode(facingMode)
      console.log('Got camera stream:', stream)

      if (videoRef.current) {
        console.log('Setting video source...')
        videoRef.current.srcObject = stream
        setCameraActive(true)

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log(
            'Video metadata loaded, dimensions:',
            videoRef.current?.videoWidth,
            'x',
            videoRef.current?.videoHeight
          )
          console.log('Starting video play...')
          setVideoReady(true)
          videoRef.current
            ?.play()
            .then(() => {
              console.log('Video playing successfully')
            })
            .catch((playError) => {
              console.error('Video play error:', playError)
              showMessage('Failed to start video', 'error')
            })
        }

        // Also handle the playing event
        videoRef.current.onplaying = () => {
          console.log('Video is now playing')
        }
      } else {
        console.error('Video ref is null')
        showMessage('Video element not found', 'error')
      }
    } catch (error) {
      console.error('Camera error:', error)
      showMessage(`Camera access denied or unavailable: `, 'error')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      showMessage('Camera not ready', 'error')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      showMessage('Video not ready, please wait', 'error')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'moment-drop-photo.jpg', {
            type: 'image/jpeg'
          })
          const dataUrl = canvas.toDataURL('image/jpeg')
          setCurrentPhoto({ file, dataUrl })
        } else {
          showMessage('Failed to capture photo', 'error')
        }
      },
      'image/jpeg',
      0.8
    )
  }

  const flipCamera = async () => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment'
    try {
      await startCamera(newFacingMode)
    } catch (error) {
      console.error('Failed to flip camera:', error)
      showMessage('Failed to switch camera', 'error')
    }
  }

  const uploadPhoto = async () => {
    if (!currentPhoto) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('photo', currentPhoto.file)
      formData.append('label', photoLabelRef.current?.value || '')
      formData.append('timestamp', new Date().toISOString())

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/.netlify/functions/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload result:', result)

      showMessage('Photo uploaded successfully! 🎉', 'success')
      resetForm()

      // Refresh gallery if visible
      if (galleryVisible) {
        loadGallery()
      }
    } catch (error) {
      console.error('Upload error:', error)
      showMessage(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      )
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const loadGallery = async () => {
    try {
      // Load folder info
      const folderResponse = await fetch('/.netlify/functions/folder-info')
      if (folderResponse.ok) {
        const folderResult = await folderResponse.json()
        if (folderResult.success) {
          setFolderInfo(folderResult.data)
        }
      }

      // Load recent photos
      const photosResponse = await fetch(
        '/.netlify/functions/recent-photos?limit=20'
      )
      if (photosResponse.ok) {
        const photosResult = await photosResponse.json()
        if (photosResult.success) {
          setPhotos(photosResult.data || [])
        }
      }
    } catch (error) {
      console.error('Gallery load error:', error)
      showMessage('Failed to load gallery', 'error')
    }
  }

  const toggleGallery = async () => {
    if (galleryVisible) {
      setGalleryVisible(false)
    } else {
      setGalleryVisible(true)
      await loadGallery()
    }
  }

  const resetForm = () => {
    setCurrentPhoto(null)
    setCameraActive(false)
    setVideoReady(false)
    if (photoLabelRef.current) {
      photoLabelRef.current.value = ''
    }
    // Stop camera stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const downloadPhoto = async (photo: any) => {
    try {
      let response: Response
      let blob: Blob
      
      try {
        // Try direct fetch first
        response = await fetch(photo.url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        blob = await response.blob()
      } catch (directFetchError) {
        // Direct fetch failed (likely CORS), try proxy
        const proxyUrl = `/.netlify/functions/download-photo?url=${encodeURIComponent(photo.url)}`
        response = await fetch(proxyUrl)
        if (!response.ok) {
          throw new Error(`Proxy fetch failed: HTTP ${response.status}`)
        }
        blob = await response.blob()
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Create filename
      const timestamp = photo.timestamp ? new Date(photo.timestamp).toLocaleDateString().replace(/\//g, '-') : 'unknown'
      const label = photo.label ? photo.label.replace(/[^a-zA-Z0-9]/g, '-') : 'photo'
      const filename = `${timestamp}-${label}.jpg`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showMessage('Photo downloaded! 📥', 'success')
    } catch (error) {
      console.error('Download error:', error)
      showMessage('Failed to download photo', 'error')
    }
  }

  const downloadAllPhotos = async () => {
    try {
      showMessage('Loading all photos... This may take a moment', 'success')
      
      // First, load ALL photos (not just the 20 displayed)
      const allPhotosResponse = await fetch('/.netlify/functions/recent-photos?limit=1000')
      if (!allPhotosResponse.ok) {
        throw new Error('Failed to load all photos')
      }
      
      const allPhotosResult = await allPhotosResponse.json()
      if (!allPhotosResult.success || !allPhotosResult.data || allPhotosResult.data.length === 0) {
        showMessage('No photos to download', 'error')
        return
      }
      
      const allPhotos = allPhotosResult.data
      showMessage(`Found ${allPhotos.length} photos. Preparing download...`, 'success')
      
      // Check if we're on mobile/iOS
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile || allPhotos.length > 5) {
        // For mobile or many photos, create a zip file
        const JSZip = (window as any).JSZip
        if (!JSZip) {
          // Fallback: download photos one by one with delay
          showMessage('Downloading photos one by one...', 'success')
          for (let i = 0; i < allPhotos.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
            await downloadPhoto(allPhotos[i])
          }
          return
        }

        const zip = new JSZip()
        const folder = zip.folder('wedding-photos')
        
        // Add each photo to the zip
        for (let i = 0; i < allPhotos.length; i++) {
          const photo = allPhotos[i]
          try {
            let response: Response
            let blob: Blob
            
            try {
              // Try direct fetch first (may fail due to CORS in dev)
              response = await fetch(photo.url)
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
              }
              blob = await response.blob()
            } catch (directFetchError) {
              // Direct fetch failed (likely CORS), silently try proxy
              const proxyUrl = `/.netlify/functions/download-photo?url=${encodeURIComponent(photo.url)}`
              
              try {
                response = await fetch(proxyUrl)
                if (!response.ok) {
                  throw new Error(`Proxy fetch failed: HTTP ${response.status}`)
                }
                blob = await response.blob()
              } catch (proxyError) {
                console.error(`Both direct and proxy fetch failed for photo ${i + 1}:`, proxyError)
                continue
              }
            }
            
            // Create filename
            const timestamp = photo.timestamp ? new Date(photo.timestamp).toLocaleDateString().replace(/\//g, '-') : 'unknown'
            const label = photo.label ? photo.label.replace(/[^a-zA-Z0-9]/g, '-') : 'photo'
            const filename = `${i + 1}-${timestamp}-${label}.jpg`
            
            folder?.file(filename, blob)
          } catch (error) {
            console.error(`Failed to add photo ${i + 1} to zip:`, error)
          }
        }
        
        // Generate and download zip
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = window.URL.createObjectURL(zipBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `wedding-photos-${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        showMessage(`All ${allPhotos.length} photos downloaded as zip file! 📦`, 'success')
      } else {
        // For desktop with few photos, download individually with small delays
        for (let i = 0; i < allPhotos.length; i++) {
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between downloads
          }
          await downloadPhoto(allPhotos[i])
        }
        showMessage(`All ${allPhotos.length} photos downloaded! 📥`, 'success')
      }
    } catch (error) {
      console.error('Download all error:', error)
      showMessage('Failed to download all photos', 'error')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setCurrentPhoto({ file, dataUrl })
      }
      reader.readAsDataURL(file)
    } else {
      showMessage('Please select a valid image file', 'error')
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  return (
    <div
      style={{
        fontFamily: 'Georgia, serif',
        background: 'linear-gradient(135deg, #f5e6d3 0%, #ffffff 100%)',
        minHeight: '100vh',
        color: '#34495e',
        lineHeight: '1.6'
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <header
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '2rem 0'
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              color: '#2c3e50',
              marginBottom: '0.5rem',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            📸 MomentDrop
          </h1>
          <p style={{ fontSize: '1.2rem', fontStyle: 'italic', opacity: 0.8 }}>
            Share your wedding moments instantly
          </p>
        </header>

        {/* Upload Section */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            border: '2px solid #f5e6d3',
            marginBottom: '2rem'
          }}
        >
          {!currentPhoto ? (
            <div>
              {/* Camera Container */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0 auto 2rem',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  minHeight: '300px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa'
                }}
              >
                {/* Placeholder - shown when camera is not active */}
                <div
                  style={{
                    textAlign: 'center',
                    color: '#34495e',
                    display: !cameraActive ? 'block' : 'none'
                  }}
                >
                  <div
                    style={{
                      fontSize: '4rem',
                      marginBottom: '1rem',
                      opacity: 0.7
                    }}
                  >
                    📷
                  </div>
                  <h2
                    style={{
                      fontSize: '2rem',
                      marginBottom: '0.5rem',
                      color: '#2c3e50',
                      fontWeight: 'bold'
                    }}
                  >
                    MomentDrop
                  </h2>
                  <p style={{ fontSize: '1rem', opacity: 0.8, margin: 0 }}>
                    Capture & share wedding memories
                  </p>
                </div>

                {/* Video - always present but conditionally visible */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: cameraActive ? 'block' : 'none',
                    position: cameraActive ? 'relative' : 'absolute',
                    top: 0,
                    left: 0
                  }}
                  onError={(e) => {
                    console.error('Video error:', e)
                    showMessage('Video error occurred', 'error')
                  }}
                />
              </div>

              {/* Camera Controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  alignItems: 'center'
                }}
              >
                {!cameraActive ? (
                  <>
                  <button
                    onClick={() => startCamera()}
                    style={{
                      padding: '18px 36px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background:
                        'linear-gradient(135deg, #f8bbd9 0%, #e91e63 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                  >
                    📷 Start Camera
                  </button>
                  <button
                    onClick={triggerFileSelect}
                    style={{
                      padding: '16px 32px',
                      border: '2px solid #e3f2fd',
                      borderRadius: '12px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: '#ffffff',
                      color: '#1976d2',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      width: '100%',
                      maxWidth: '300px',
                      marginTop: '0.5rem'
                    }}
                  >
                    📁 Choose from Device
                  </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={capturePhoto}
                      disabled={!videoReady}
                      style={{
                        padding: '18px 36px',
                        border: '2px solid #f5e6d3',
                        borderRadius: '12px',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        cursor: videoReady ? 'pointer' : 'not-allowed',
                        background: '#ffffff',
                        color: '#34495e',
                        width: '100%',
                        maxWidth: '300px',
                        opacity: videoReady ? 1 : 0.6
                      }}
                    >
                      {videoReady ? '📸 Take Photo' : '⏳ Loading camera...'}
                    </button>
                    {cameraActive && (
                      <button
                        onClick={flipCamera}
                        disabled={!videoReady}
                        style={{
                          padding: '12px 20px',
                          border: '2px solid #e3f2fd',
                          borderRadius: '12px',
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          cursor: videoReady ? 'pointer' : 'not-allowed',
                          background: '#ffffff',
                          color: '#1976d2',
                          marginTop: '1rem',
                          width: '100%',
                          maxWidth: '300px',
                          opacity: videoReady ? 1 : 0.6
                        }}
                        title={`Switch to ${currentFacingMode === 'environment' ? 'front' : 'back'} camera`}
                      >
                        🔄 Flip Camera
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Photo Preview */
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <img
                src={currentPhoto.dataUrl}
                alt="Captured photo preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  marginBottom: '1rem'
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <input
                  ref={photoLabelRef}
                  type="text"
                  placeholder="Add a label (optional)"
                  maxLength={30}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #f5e6d3',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#ffffff',
                    color: '#34495e'
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center'
                  }}
                >
                  <button
                    onClick={resetForm}
                    style={{
                      padding: '14px 28px',
                      border: '2px solid #f5e6d3',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: '#ffffff',
                      color: '#34495e'
                    }}
                  >
                    📷 Retake
                  </button>
                  <button
                    onClick={uploadPhoto}
                    disabled={isUploading}
                    style={{
                      padding: '14px 28px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      background:
                        'linear-gradient(135deg, #f8bbd9 0%, #e91e63 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    📤 Upload Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #f8bbd9, #e91e63)',
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div
                style={{ fontSize: '0.9rem', color: '#34495e', opacity: 0.8 }}
              >
                Uploading... {uploadProgress}%
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                fontWeight: 'bold',
                marginTop: '1rem',
                background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                color: message.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
              }}
            >
              {message.text}
            </div>
          )}
        </section>

        {/* Gallery Section */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            border: '2px solid #f5e6d3'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2
              style={{
                color: '#2c3e50',
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}
            >
              📖 Photo Gallery
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Recent wedding photos from all guests
            </p>
            <button
              onClick={toggleGallery}
              style={{
                padding: '14px 28px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #f8bbd9 0%, #e91e63 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {galleryVisible ? '📖 Hide Gallery' : '📖 View Gallery'}
            </button>
            {galleryVisible && photos.length > 0 && (
              <button
                onClick={downloadAllPhotos}
                style={{
                  padding: '14px 28px',
                  border: '2px solid #e3f2fd',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: '#ffffff',
                  color: '#1976d2',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  marginTop: '1rem'
                }}
              >
                📥 Download All Photos ({photos.length})
              </button>
            )}
          </div>

          {galleryVisible && (
            <div>
              {folderInfo && (
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '12px'
                  }}
                >
                  <h3>{folderInfo.name}</h3>
                  <p>📷 {folderInfo.photoCount} photos shared</p>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '2rem'
                }}
              >
                {photos.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      gridColumn: '1 / -1',
                      color: '#34495e',
                      opacity: 0.7
                    }}
                  >
                    No photos yet. Be the first to share a moment! 📸
                  </p>
                ) : (
                  photos.map((photo, index) => (
                    <div
                      key={index}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.label || 'Wedding photo'}
                        loading="lazy"
                        crossOrigin="anonymous"
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onContextMenu={(e) => {
                          // Allow native context menu for mobile save functionality
                          e.stopPropagation()
                        }}
                        title="Press and hold to save on mobile, or use download button"
                      />
                      <div style={{ padding: '1rem' }}>
                        {photo.label && (
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: '#2c3e50',
                              marginBottom: '0.5rem'
                            }}
                          >
                            {photo.label}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#34495e',
                            opacity: 0.7
                          }}
                        >
                          {formatTimestamp(photo.timestamp)}
                        </div>
                        <button
                          onClick={() => downloadPhoto(photo)}
                          style={{
                            padding: '8px 16px',
                            border: '2px solid #e3f2fd',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            background: '#ffffff',
                            color: '#1976d2',
                            width: '100%',
                            marginTop: '0.5rem',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e3f2fd'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff'
                          }}
                        >
                          📥 Download
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            padding: '2rem 0',
            fontStyle: 'italic',
            opacity: 0.7,
            fontSize: '0.9rem'
          }}
        >
          <p>Made with ❤️ for your special day</p>
        </footer>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default MomentDrop
