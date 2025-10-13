'use client'

import { useState, useEffect } from 'react'
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
} from '@chakra-ui/react'
import {
  ChevronRightIcon,
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
}

function FileTreeItem({
  node,
  level = 0,
  onDelete,
  onSelect,
}: {
  node: FileNode
  level?: number
  onDelete: (id: string) => void
  onSelect?: (file: FileNode) => void
}) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: level === 0 })
  const hasChildren = node.children && node.children.length > 0
  const isFolder = node.type === 'folder'

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

  return (
    <Box>
      <HStack
        spacing={1}
        py={1.5}
        px={2}
        pl={level * 4 + 2}
        _hover={{ bg: isFolder ? 'blue.50' : 'gray.50', cursor: 'pointer' }}
        borderRadius="md"
        transition="all 0.2s"
        onClick={handleClick}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          <Box
            as="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            p={1}
            borderRadius="sm"
            _hover={{ bg: 'gray.200' }}
            transition="transform 0.2s"
            transform={isOpen ? 'rotate(0deg)' : 'rotate(0deg)'}
          >
            <Icon
              as={isOpen ? ChevronDownIcon : ChevronRightIcon}
              boxSize={4}
              color="gray.600"
            />
          </Box>
        ) : (
          <Box w="24px" />
        )}
        
        {/* Folder/File Icon */}
        <Icon
          as={isFolder ? (isOpen ? FaFolderOpen : FaFolder) : FaFile}
          color={isFolder ? 'yellow.600' : 'blue.500'}
          boxSize={4}
        />
        
        {/* File/Folder Name */}
        <Text 
          flex={1} 
          fontSize="sm" 
          noOfLines={1}
          fontWeight={isFolder ? 'semibold' : 'normal'}
          color={isFolder ? 'gray.800' : 'gray.700'}
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
          <Text fontSize="xs" color="gray.500" minW="40px" textAlign="right">
            {node.children?.length} {node.children?.length === 1 ? 'item' : 'items'}
          </Text>
        )}
        
        {/* Delete Menu */}
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<DeleteIcon />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList>
            <MenuItem
              icon={<DeleteIcon />}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              color="red.500"
            >
              Delete {isFolder ? 'Folder' : 'File'}
            </MenuItem>
          </MenuList>
        </Menu>
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
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}

export default function FileExplorer({ onFileSelect, onRefresh }: FileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    <VStack align="stretch" spacing={0}>
      {fileTree.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          onDelete={handleDelete}
          onSelect={onFileSelect}
        />
      ))}
    </VStack>
  )
}

