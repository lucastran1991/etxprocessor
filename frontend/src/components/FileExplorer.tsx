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

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <Box>
      <HStack
        spacing={2}
        py={1}
        px={2}
        _hover={{ bg: 'gray.100', cursor: 'pointer' }}
        borderRadius="md"
        onClick={() => {
          if (node.type === 'folder') {
            onToggle()
          } else if (onSelect) {
            onSelect(node)
          }
        }}
      >
        {node.type === 'folder' && (
          <IconButton
            aria-label="Toggle folder"
            icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          />
        )}
        {node.type !== 'folder' && <Box w="24px" />}
        
        <Icon
          as={node.type === 'folder' ? (isOpen ? FaFolderOpen : FaFolder) : FaFile}
          color={node.type === 'folder' ? 'yellow.500' : 'blue.500'}
        />
        
        <Text flex={1} fontSize="sm" noOfLines={1}>
          {node.name}
        </Text>
        
        {node.type === 'file' && node.size && (
          <Text fontSize="xs" color="gray.500">
            {formatFileSize(node.size)}
          </Text>
        )}
        
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
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {node.type === 'folder' && hasChildren && (
        <Collapse in={isOpen}>
          <Box pl={level === 0 ? 4 : 6}>
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

