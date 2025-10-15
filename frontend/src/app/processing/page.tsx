'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  VStack,
  Text,
  Select,
  Button,
  HStack,
  Badge,
  Spinner,
  useToast
} from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/FileExplorer'
import { apiClient } from '@/services/apiClient'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mime_type?: string
  path: string
  uploaded_at: string
}

export default function ProcessingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [action, setAction] = useState<string>('Import Organizations')
  const [isProcessing, setIsProcessing] = useState(false)
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleProcessing = async () => {
    if (!selectedFile || !action) return;

    console.log('selectedFile', selectedFile)
    console.log('action', action)

    setIsProcessing(true)
    try {
      const formData = new FormData();
      formData.append('data_file', selectedFile.id);

      let endpoint = '';
      switch (action) {
        case 'Import Organizations':
          endpoint = '/processing/createorg';
          break;
        case 'Import Emission Sources':
          endpoint = '/processing/ingestes';
          break;
        case 'Load BAR Data':
          endpoint = '/processing/ingestbar';
          break;
        case 'Generate Organization Scheme':
          endpoint = '/processing/generateschemeorg';
          break;
        default:
          return;
      }

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const result = response.data;
      toast({
        title: 'Processing Completed',
        description: result.message || '',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      setIsProcessing(false)
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false)
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8} position="relative">
        {isProcessing && (
          <VStack justifyContent="center" alignItems="center" position="absolute" top={0} left={0} width="100%" height="100%" bg="rgba(0, 0, 0, 0.5)" zIndex={1}>
            <Spinner size="xl" color="white" />
          </VStack>
        )}
        <VStack spacing={6} align="stretch" zIndex={0}>
          <Heading as="h1" size="xl">Processing</Heading>
          <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">File Explorer</Heading>
                </CardHeader>
                <Divider />
                <CardBody maxH="600px" overflowY="auto">
                  <FileExplorer readOnly hideItemDelete onFileSelect={(f: FileNode) => { if (f.type === 'file') setSelectedFile(f) }} />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">Action</Heading>
                </CardHeader>
                <Divider />
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack align="stretch" spacing={4}>
                      <Select value={action} onChange={(e) => setAction(e.target.value)} w="50%" isDisabled={isProcessing}>
                        {['Import Organizations', 'Import Emission Sources', 'Load BAR Data', 'Generate Organization Scheme'].map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </Select>
                      <Button colorScheme="brand" onClick={handleProcessing} isDisabled={!selectedFile || isProcessing} w="50%">Execute</Button>
                    </HStack>
                    {selectedFile ? (
                      <VStack align="start" spacing={1} fontSize="sm">
                        <HStack><Badge>File</Badge><Text>{selectedFile.name}</Text></HStack>
                        {selectedFile.size !== undefined && <HStack><Badge>Size</Badge><Text>{selectedFile.size} bytes</Text></HStack>}
                        <HStack><Badge>Uploaded</Badge><Text>{new Date(selectedFile.uploaded_at).toLocaleString()}</Text></HStack>
                        {selectedFile.mime_type && <HStack><Badge>MIME</Badge><Text>{selectedFile.mime_type}</Text></HStack>}
                      </VStack>
                    ) : (
                      <Text color="gray.500">Select a file to enable Execute and see details.</Text>
                    )}
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


