'use client'

import { useRef, useState, useCallback } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Icon,
  useToast,
  List,
  ListItem,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react'
import { AttachmentIcon, CloseIcon } from '@chakra-ui/icons'
import { FaFile, FaFolder } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/services/apiClient'
import { fadeIn, staggerContainer, staggerItem } from '@/utils/animations'

interface FileUploadProps {
  onUploadComplete?: () => void
  currentFolder?: string
}

export default function FileUpload({ onUploadComplete, currentFolder = '' }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const toast = useToast()
  
  const dropZoneBg = useColorModeValue(
    isDragging ? 'brand.50' : 'transparent',
    isDragging ? 'whiteAlpha.100' : 'transparent'
  )
  const dropZoneBorderColor = useColorModeValue(
    isDragging ? 'brand.500' : 'gray.300',
    isDragging ? 'brand.400' : 'gray.600'
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const filtered = files.filter((f) => {
      const name = f.name || ''
      // Ignore dotfiles and known metadata
      if (name.startsWith('.')) return false
      if (name === '.DS_Store' || name === '.gitignore' || name === '.git') return false
      return true
    })
    setSelectedFiles((prev) => [...prev, ...filtered])
  }

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const filtered = files.filter((f: any) => {
      const name = f.name || ''
      const rp: string = f.webkitRelativePath || ''
      // Ignore any file within .git directories or hidden paths
      if (name.startsWith('.')) return false
      if (name === '.DS_Store' || name === '.gitignore' || name === '.git') return false
      if (rp.includes('/.git/') || rp.startsWith('.git/')) return false
      if (rp.split('/').some((seg) => seg.startsWith('.'))) return false
      return true
    })
    setSelectedFiles((prev) => [...prev, ...filtered])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearSelection = () => {
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      const relativePaths: string[] = []
      selectedFiles.forEach((file: File) => {
        const rp = file.webkitRelativePath || ''
        formData.append('files', file)
        relativePaths.push(rp)
      })
      
      // Normalize currentFolder: ensure it starts with / and defaults to / if empty
      const normalizedFolder = currentFolder && currentFolder.trim() 
        ? '/' + currentFolder.trim().replace(/^\/+|\/+$/g, '') 
        : '/'
      
      console.log('[handleUpload] currentFolder (original) => ', currentFolder)
      console.log('[handleUpload] normalizedFolder => ', normalizedFolder)
      formData.append('folder_path', normalizedFolder)
      try {
        formData.append('relative_paths', JSON.stringify(relativePaths))
      } catch {}

      // Get all key:value pairs from formData and console.log values as JSON if possible
      const obj: any = {};
      formData.forEach((value, key) => {
        // For files, don't try JSON.parse; keep as is (File object or string)
        if (key === 'files') {
          if (!obj[key]) obj[key] = [];
          obj[key].push(value);
        } else {
          try {
            obj[key] = JSON.parse(value as string);
          } catch {
            obj[key] = value;
          }
        }
      });
      console.log('[FileUpload] formData:', obj);

      await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        },
      })

      toast({
        title: 'Success',
        description: `${selectedFiles.length} file(s) uploaded successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (folderInputRef.current) folderInputRef.current.value = ''
      if (onUploadComplete) onUploadComplete()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'Failed to upload files',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files || [])
    const filtered = files.filter((f) => {
      const name = f.name || ''
      if (name.startsWith('.')) return false
      if (name === '.DS_Store' || name === '.gitignore' || name === '.git') return false
      return true
    })
    setSelectedFiles((prev) => [...prev, ...filtered])
  }, [])

  // Normalize currentFolder for display
  const displayFolder = currentFolder && currentFolder.trim() 
    ? '/' + currentFolder.trim().replace(/^\/+|\/+$/g, '') 
    : '/'

  return (
    <VStack spacing={4} align="stretch">
      {/* {currentFolder && currentFolder.trim() && (
        <Box 
          px={3} 
          py={2} 
          bg="blue.50" 
          borderRadius="md" 
          fontSize="xs" 
          color="blue.700"
          borderWidth="1px"
          borderColor="blue.200"
        >
          <Text fontWeight="semibold">Upload destination:</Text>
          <Text fontFamily="mono">{displayFolder}</Text>
        </Box>
      )} */}
      <HStack spacing={2}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          /* @ts-ignore */
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={handleFolderSelect}
        />
        
        <Button
          leftIcon={<AttachmentIcon />}
          colorScheme="brand"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          isDisabled={isUploading}
        >
          Select Files
        </Button>
        
        <Button
          leftIcon={<Icon as={FaFolder} />}
          colorScheme="brand"
          variant="outline"
          size="sm"
          onClick={() => folderInputRef.current?.click()}
          isDisabled={isUploading}
        >
          Select Folder
        </Button>
      </HStack>

      <Box
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        border="2px dashed"
        borderColor={dropZoneBorderColor}
        borderRadius="xl"
        p={8}
        bg={dropZoneBg}
        transition="all 0.3s ease"
        transform={isDragging ? 'scale(1.02)' : 'scale(1)'}
        textAlign="center"
        mb={selectedFiles.length > 0 ? 4 : 0}
        display={selectedFiles.length > 0 ? 'none' : 'block'}
      >
        <VStack spacing={2}>
          <Icon as={AttachmentIcon} boxSize={8} color={dropZoneBorderColor} />
          <Text fontSize="sm" color="gray.600">
            Drag and drop files here, or click buttons above
          </Text>
        </VStack>
      </Box>

      {selectedFiles.length > 0 && (
        <Box
          as={motion.div}
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Selected Files ({selectedFiles.length})
          </Text>
          <List spacing={1} maxH="200px" overflowY="auto" p={2} bg="gray.50" borderRadius="md">
            <AnimatePresence mode="popLayout">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <ListItem>
                    <HStack justify="space-between" fontSize="xs">
                      <HStack flex={1} overflow="hidden">
                        <Icon as={FaFile} color="blue.500" />
                        <Text noOfLines={1}>{file.name}</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Text color="gray.500">{formatFileSize(file.size)}</Text>
                        <IconButton
                          aria-label="Remove file"
                          icon={<CloseIcon />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeFile(index)}
                          isDisabled={isUploading}
                        />
                      </HStack>
                    </HStack>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>

          <HStack mt={2}>
            <Button
              colorScheme="green"
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
              loadingText="Uploading..."
              flex={1}
            >
              Upload {selectedFiles.length} File(s)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              isDisabled={isUploading}
            >
              Clear
            </Button>
          </HStack>

          {isUploading && (
            <Box mt={2}>
              <Progress 
                value={uploadProgress} 
                size="sm" 
                colorScheme="brand" 
                borderRadius="full"
                hasStripe
                isAnimated
                transition="width 0.3s ease"
                sx={{
                  '& > div:first-of-type': {
                    transition: 'width 0.3s ease'
                  }
                }}
              />
              <Text fontSize="xs" color="gray.500" textAlign="center" mt={1}>
                {uploadProgress}%
              </Text>
            </Box>
          )}
        </Box>
      )}
    </VStack>
  )
}

