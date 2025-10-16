'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  GridItem,
  Box,
  Heading,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Text,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Spinner,
  Center,
} from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/FileExplorer'
import FilePreview from '@/components/FilePreview'
import FileUpload from '@/components/FileUpload'
import { apiClient } from '@/services/apiClient'

export default function FilesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [storageInfo, setStorageInfo] = useState<{
    total_size: number
    file_count: number
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [selectedFolder, setSelectedFolder] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadStorageInfo()
    }
  }, [user, refreshKey])

  const loadStorageInfo = async () => {
    try {
      const response = await apiClient.get('/files/storage')
      setStorageInfo(response.data)
    } catch (error) {
      console.error('Failed to load storage info:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1)
    // if files changed, clear preview if deleted; keep selection otherwise
  }

  // Determine current upload target folder based on selection
  const currentUploadFolder = selectedFile
    ? (selectedFile.type === 'folder' ? (selectedFile.path || '/') : (selectedFile.folder_path || '/'))
    : '/'

  if (isLoading || !user) {
    return (
      <Layout>
        <Container maxW="container.xl" py={10}>
          <Center>
            <Spinner size="xl" />
            <Text ml={4}>Loading...</Text>
          </Center>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="2%">
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              My Files
            </Heading>
            <Text color="gray.600">
              Upload and manage your files and folders
            </Text>
          </Box>

          {storageInfo && (
            <StatGroup>
              <Stat>
                <StatLabel>Total Storage Used</StatLabel>
                <StatNumber>{formatBytes(storageInfo.total_size)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Files</StatLabel>
                <StatNumber>{storageInfo.file_count}</StatNumber>
              </Stat>
            </StatGroup>
          )}

          <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
            {/* Left sidebar - File Explorer */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">File Explorer</Heading>
                </CardHeader>
                <Divider />
                <CardBody maxH="800px" overflowY="auto">
                  <FileExplorer
                    key={refreshKey}
                    onRefresh={handleUploadComplete}
                    onFileSelect={(f) => {
                      console.log('selectedFile => ', f)
                      setSelectedFile(f)
                      if (f.name) {
                        const temp_path = f.name.split('/').slice(0, -1).join('/')
                        console.log('temp_path => ', temp_path)
                        setSelectedFolder(temp_path || "")
                      } else {
                        setSelectedFolder("")
                      }
                    }}
                  />
                </CardBody>
              </Card>
            </GridItem>

            {/* Right side - Upload Area */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">Upload Files</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <FileUpload onUploadComplete={handleUploadComplete} currentFolder={selectedFolder} />
                </CardBody>
              </Card>

              <Box mt={6}>
                <FilePreview file={selectedFile} />
              </Box>

              <Card mt={6}>
                <CardHeader>
                  <Heading size="md">Instructions</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <VStack align="stretch" spacing={3} fontSize="sm">
                    <Text>
                      • <strong>Select Files:</strong> Click "Select Files" to choose one or
                      multiple files to upload
                    </Text>
                    <Text>
                      • <strong>Select Folder:</strong> Click "Select Folder" to upload an entire
                      folder with its contents
                    </Text>
                    <Text>
                      • <strong>Max File Size:</strong> 100MB per file
                    </Text>
                    <Text>
                      • <strong>File Explorer:</strong> Browse your uploaded files in the left
                      sidebar
                    </Text>
                    <Text>
                      • <strong>Delete Files:</strong> Click the delete icon next to any file or
                      folder to remove it
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </Layout>
  )
}

