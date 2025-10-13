'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Avatar,
  VStack,
  Text,
  useToast,
  IconButton,
  Spinner,
  HStack,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { apiClient } from '@/services/apiClient'
import { getImageUrl } from '@/utils/imageUrl'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  username: string
  onAvatarUpdate: (newUrl: string | null) => void
}

export default function AvatarUpload({
  currentAvatarUrl,
  username,
  onAvatarUpdate,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // Sync previewUrl with currentAvatarUrl prop changes
  useEffect(() => {
    setPreviewUrl(currentAvatarUrl)
  }, [currentAvatarUrl])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, GIF, or WebP image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newAvatarUrl = response.data.avatar_url
      setPreviewUrl(newAvatarUrl)
      onAvatarUpdate(newAvatarUrl)

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      setPreviewUrl(currentAvatarUrl)
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'Failed to upload image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    setIsUploading(true)
    try {
      await apiClient.delete('/upload/avatar')
      setPreviewUrl(undefined)
      onAvatarUpdate(null)

      toast({
        title: 'Success',
        description: 'Profile picture removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: error.response?.data?.detail || 'Failed to delete image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <VStack spacing={4}>
      <Box position="relative">
        <Avatar size="2xl" name={username} src={getImageUrl(previewUrl)} />
        {isUploading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="blackAlpha.600"
            borderRadius="full"
          >
            <Spinner size="lg" color="white" />
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <HStack spacing={2}>
        <Button
          leftIcon={<EditIcon />}
          colorScheme="blue"
          size="sm"
          onClick={handleButtonClick}
          isDisabled={isUploading}
        >
          {previewUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>

        {previewUrl && (
          <IconButton
            aria-label="Delete photo"
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            isDisabled={isUploading}
          />
        )}
      </HStack>

      <Text fontSize="xs" color="gray.500" textAlign="center">
        Max size: 5MB • PNG, JPG, GIF, WebP
      </Text>
    </VStack>
  )
}

