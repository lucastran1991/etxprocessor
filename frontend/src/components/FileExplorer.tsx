'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Collapse,
  useDisclosure,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  DeleteIcon,
} from '@chakra-ui/icons'
import { FaFolder, FaFolderOpen, FaFile } from 'react-icons/fa'
import { apiClient } from '@/services/apiClient'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mime_type?: string
  path: string
  uploaded_at: string
  children?: FileNode[]
}

interface FileExplorerProps {
  onFileSelect?: (file: FileNode) => void
  onRefresh?: () => void
  readOnly?: boolean
  hideItemDelete?: boolean
}

function FileTreeItem({
  node,
  level = 0,
  onDelete,
  onSelect,
  onCreateFolder,
  readOnly,
  hideItemDelete,
  expandSignal,
  collapseSignal,
  selectedPath,
}: {
  node: FileNode
  level?: number
  onDelete: (id: string) => void
  onSelect?: (file: FileNode) => void
  onCreateFolder: (parentPath: string) => void
  readOnly?: boolean
  hideItemDelete?: boolean
  expandSignal: number
  collapseSignal: number
  selectedPath?: string | null
}) {
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure({ defaultIsOpen: level === 0 })
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'
  const rowHoverBg = useColorModeValue(isFolder ? 'brand.50' : 'gray.100', isFolder ? 'whiteAlpha.100' : 'whiteAlpha.50')
  const chevronHoverBg = useColorModeValue('gray.200', 'whiteAlpha.200')
  const chevronColor = useColorModeValue('brand.600', 'brand.300')
  const folderIconColor = useColorModeValue('brand.600', 'brand.300')
  const fileIconColor = useColorModeValue('brand.400', 'brand.300')
  const nameColor = useColorModeValue(isFolder ? 'gray.800' : 'gray.700', 'gray.100')
  const metaColor = useColorModeValue('gray.500', 'gray.400')
  const isSelected = !isFolder && selectedPath === node.path
  const selectedBg = useColorModeValue('brand.50', 'whiteAlpha.100')
  const selectedBorder = useColorModeValue('brand.300', 'brand.400')

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const handleClick = () => {
    if (isFolder) {
      onToggle()
    } else if (onSelect) {
      onSelect(node)
    }
  }

  // Respond to global expand/collapse signals
  useEffect(() => {
    if (isFolder) onOpen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandSignal])

  useEffect(() => {
    if (isFolder) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseSignal])

  return (
    <Box>
      <HStack
        spacing={1}
        py={1.5}
        px={2}
        pl={level * 4 + 2}
        _hover={{ bg: rowHoverBg, cursor: 'pointer' }}
        bg={isSelected ? selectedBg : undefined}
        borderWidth={isSelected ? '1px' : undefined}
        borderColor={isSelected ? selectedBorder : undefined}
        borderRadius="md"
        transition="all 0.2s"
        onClick={handleClick}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          <Box
            as="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onToggle()
            }}
            p={1}
            borderRadius="sm"
            _hover={{ bg: chevronHoverBg }}
            transition="transform 0.2s"
            transform={isOpen ? 'rotate(0deg)' : 'rotate(0deg)'}
          >
            <Icon
              as={isOpen ? ChevronDownIcon : ChevronUpIcon}
              boxSize={4}
              color={chevronColor}
            />
          </Box>
        ) : (
          <Box w="24px" />
        )}
        
        {/* Folder/File Icon */}
        <Icon
          as={isFolder ? (isOpen ? FaFolderOpen : FaFolder) : FaFile}
          color={isFolder ? folderIconColor : fileIconColor}
          boxSize={4}
        />
        
        {/* File/Folder Name */}
        <Text 
          flex={1} 
          fontSize="sm" 
          noOfLines={1}
          fontWeight={isFolder ? 'semibold' : 'normal'}
          color={nameColor}
        >
          {node.name}
        </Text>
        
        {/* File Size */}
        {node.type === 'file' && node.size && (
          <Text fontSize="xs" color="gray.500" minW="60px" textAlign="right">
            {formatFileSize(node.size)}
          </Text>
        )}
        
        {/* Folder Item Count */}
        {isFolder && hasChildren && (
          <Text fontSize="xs" color={metaColor} minW="40px" textAlign="right">
            {node.children?.length} {node.children?.length === 1 ? 'item' : 'items'}
          </Text>
        )}
        
        {/* Actions Menu (hidden in readOnly) */}
        {!readOnly && (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<DeleteIcon />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            />
            <MenuList>
              {isFolder && (
                <MenuItem
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onCreateFolder(node.path)
                  }}
                >
                  New Subfolder
                </MenuItem>
              )}
              {!hideItemDelete && (
                <MenuItem
                  icon={<DeleteIcon />}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    onDelete(node.id)
                  }}
                  color="red.500"
                >
                  Delete {isFolder ? 'Folder' : 'File'}
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        )}
      </HStack>

      {/* Folder Children */}
      {isFolder && hasChildren && (
        <Collapse in={isOpen} animateOpacity>
          <Box>
            {node.children?.map((child) => (
              <FileTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                onDelete={onDelete}
                onSelect={onSelect}
                onCreateFolder={onCreateFolder}
                readOnly={readOnly}
                hideItemDelete={hideItemDelete}
                expandSignal={expandSignal}
                collapseSignal={collapseSignal}
                selectedPath={selectedPath}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

export default function FileExplorer({ onFileSelect, onRefresh, readOnly = false, hideItemDelete = false }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [expandSignal, setExpandSignal] = useState(0)
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const toast = useToast()

  const loadFileTree = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/files/tree')
      setFileTree(response.data)
    } catch (error: any) {
      console.error('Failed to load file tree:', error)
      toast({
        title: 'Error',
        description: 'Failed to load files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFileTree()
  }, [])

  const handleCreateFolder = async (parentPath: string) => {
    const name = window.prompt('New folder name:')
    if (!name) return
    try {
      await apiClient.post('/files/folder', { folder_name: name, parent_path: parentPath || '/' })
      toast({
        title: 'Folder created',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      await loadFileTree()
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Failed to create folder:', error)
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to create folder',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDeleteAll = async () => {
    if (fileTree.length === 0) return

    const confirmed = window.confirm('This will permanently delete ALL your files and folders. Continue?')
    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      // Delete all top-level nodes; folders delete recursively on backend
      const ids = fileTree.map((n) => n.id)
      const results = await Promise.allSettled(ids.map((id) => apiClient.delete(`/files/${id}`)))
      const rejected = results.filter((r) => r.status === 'rejected')

      if (rejected.length > 0) {
        toast({
          title: 'Partial delete',
          description: `Some items could not be deleted (${rejected.length}).`,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'All files deleted',
          description: 'Your files and folders were removed successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }

      await loadFileTree()
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Failed to delete all files:', error)
      toast({
        title: 'Error',
        description: error?.response?.data?.detail || 'Failed to delete all files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await apiClient.delete(`/files/${fileId}`)
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      loadFileTree()
      if (onRefresh) onRefresh()
    } catch (error: any) {
      console.error('Failed to delete file:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner />
      </Box>
    )
  }

  if (fileTree.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500" fontSize="sm">
          No files uploaded yet
        </Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" spacing={2}>
      {!readOnly && (
        <HStack justify="space-between" px={2} py={2}>
          <IconButton
            aria-label="New folder"
            icon={<Icon as={FaFolder} />}
            colorScheme="brand"
            variant="outline"
            size="sm"
            onClick={() => handleCreateFolder('/')}
            isDisabled={isLoading}
          />
          <HStack>
            <IconButton
              aria-label="Expand all"
              icon={<ChevronDownIcon />}
              variant="outline"
              size="sm"
              onClick={() => setExpandSignal((v) => v + 1)}
              isDisabled={isLoading || fileTree.length === 0}
            />
            <IconButton
              aria-label="Collapse all"
              icon={<ChevronUpIcon />}
              variant="outline"
              size="sm"
              onClick={() => setCollapseSignal((v) => v + 1)}
              isDisabled={isLoading || fileTree.length === 0}
            />
          </HStack>
          <IconButton
            aria-label="Delete all"
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            isDisabled={isLoading || isBulkDeleting || fileTree.length === 0}
          />
        </HStack>
      )}
      {fileTree.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          onDelete={handleDelete}
          onSelect={(file) => {
            setSelectedPath(file.path)
            if (onFileSelect) onFileSelect(file)
          }}
          onCreateFolder={handleCreateFolder}
          readOnly={readOnly}
          hideItemDelete={hideItemDelete}
          expandSignal={expandSignal}
          collapseSignal={collapseSignal}
          selectedPath={selectedPath}
        />
      ))}
    </VStack>
  )
}

