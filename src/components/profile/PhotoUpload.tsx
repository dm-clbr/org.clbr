import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, Crop } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { getInitials } from '../../lib/utils'
import { uploadProfilePhoto } from '../../lib/queries'
import { compressImage, formatFileSize } from '../../lib/imageCompression'
import { ImageCropDialog } from './ImageCropDialog'

interface PhotoUploadProps {
  currentPhotoUrl: string | null
  userName: string
  userId: string
  onPhotoUploaded: (url: string) => void
  size?: 'sm' | 'lg'
}

export function PhotoUpload({ currentPhotoUrl, userName, userId, onPhotoUploaded, size = 'lg' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [showEditMenu, setShowEditMenu] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    if (!showEditMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowEditMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEditMenu])

  const handleCameraClick = () => {
    if (currentPhotoUrl) {
      setShowEditMenu((v) => !v)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleUploadNew = () => {
    setShowEditMenu(false)
    fileInputRef.current?.click()
  }

  const handleRecrop = () => {
    setShowEditMenu(false)
    if (currentPhotoUrl) {
      // Append a cache-busting param so the browser fetches a fresh CORS-compliant
      // response instead of serving a cached non-CORS version (which taints the canvas)
      const sep = currentPhotoUrl.includes('?') ? '&' : '?'
      setImageToCrop(`${currentPhotoUrl}${sep}t=${Date.now()}`)
      setShowCropDialog(true)
    }
  }

  const prepareFileForCrop = (file: File | undefined | null) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const maxSizeBeforeCompression = 10 * 1024 * 1024
    if (file.size > maxSizeBeforeCompression) {
      setError(`Image must be less than ${formatFileSize(maxSizeBeforeCompression)}`)
      return
    }

    setError('')

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
      setShowCropDialog(true)
    }
    reader.onerror = () => {
      setError('Failed to read image file')
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    prepareFileForCrop(e.target.files?.[0])
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (uploading || compressing) return
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (uploading || compressing) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setShowEditMenu(false)
    prepareFileForCrop(e.dataTransfer.files?.[0])
  }

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropDialog(false)
    setImageToCrop(null)

    try {
      let fileToUpload = croppedFile

      if (croppedFile.size > 2.5 * 1024 * 1024) {
        setCompressing(true)
        fileToUpload = await compressImage(croppedFile, {
          maxSizeMB: 2.5,
          targetSizeMB: 2,
          maxWidthOrHeight: 2048,
        })
        setCompressing(false)
      }

      setUploading(true)
      const url = await uploadProfilePhoto(fileToUpload, userId)
      onPhotoUploaded(url)
    } catch (err) {
      setError('Failed to upload photo. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      setCompressing(false)
    }
  }

  const isSmall = size === 'sm'

  return (
    <div className={isSmall ? 'flex flex-col items-center gap-1' : 'flex flex-col items-center gap-4'}>
      <div
        className={`relative rounded-full transition-shadow ${
          isDragOver ? 'shadow-[0_0_0_3px_rgba(211,214,224,0.5)]' : ''
        }`}
        ref={menuRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Avatar className={isSmall ? 'h-[60px] w-[60px] bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]' : 'h-32 w-32 bg-gradient-to-b from-[#5C5C5C] to-[#1F1F1F]'}>
          {currentPhotoUrl && (
            <AvatarImage src={currentPhotoUrl} alt={userName} />
          )}
          <AvatarFallback className={isSmall ? 'bg-transparent text-[#F2F2F2] text-[11px] font-bold uppercase tracking-[0.3px]' : 'bg-transparent text-[#F2F2F2] text-2xl font-bold uppercase tracking-[0.3px]'}>
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <Button
          type="button"
          size="icon"
          className={isSmall
            ? 'absolute -bottom-1 -right-1 rounded-full h-5 w-5 bg-[#414141] text-[#F2F2F2] hover:bg-[#40424D]'
            : 'absolute bottom-0 right-0 rounded-full bg-[#414141] text-[#F2F2F2] hover:bg-[#40424D]'}
          onClick={handleCameraClick}
          disabled={uploading || compressing}
        >
          <Camera className={isSmall ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>

        {/* Edit menu — only shown when a photo exists */}
        {showEditMenu && (
          <div className="absolute top-full left-0 z-10 mt-2 min-w-[180px] overflow-hidden rounded-[2px] border border-[rgba(64,66,77,0.55)] bg-[rgba(30,30,36,0.98)] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#EDEFF7] transition-colors hover:bg-[rgba(64,66,77,0.3)] hover:text-[#F2F2F2]"
              onClick={handleUploadNew}
            >
              <Upload className="h-4 w-4 text-[#9DA2B3]" />
              Upload new photo
            </button>
            <div className="border-t border-[rgba(64,66,77,0.35)]" />
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#EDEFF7] transition-colors hover:bg-[rgba(64,66,77,0.3)] hover:text-[#F2F2F2]"
              onClick={handleRecrop}
            >
              <Crop className="h-4 w-4 text-[#9DA2B3]" />
              Recrop current photo
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading || compressing}
      />

      {compressing && (
        <p className={isSmall ? 'text-[10px] text-[#9DA2B3]' : 'text-sm text-[#9DA2B3]'}>
          Compressing image...
        </p>
      )}

      {uploading && (
        <p className={isSmall ? 'text-[10px] text-[#9DA2B3]' : 'text-sm text-[#9DA2B3]'}>
          Uploading...
        </p>
      )}

      {!uploading && !compressing && (
        <p className={isSmall ? 'max-w-[96px] text-center text-[10px] text-[#9DA2B3]' : 'text-xs text-[#9DA2B3]'}>
          Drag and drop an image here, or click the camera icon.
        </p>
      )}

      {error && (
        <p className="text-sm text-[#D3D6E0]">{error}</p>
      )}

      {imageToCrop && (
        <ImageCropDialog
          open={showCropDialog}
          onOpenChange={(open) => {
            setShowCropDialog(open)
            if (!open) setImageToCrop(null)
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}
