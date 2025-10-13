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
  Badge
} from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/FileExplorer'

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
  const [action, setAction] = useState<string>('Select Action')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleProcessing = async () => {
    if (!selectedFile || !action) return;

    try {
      const formData = new FormData();
      formData.append('file_path', selectedFile.path);
      
      let endpoint = '';
      switch (action) {
        case 'Import Organizations':
          endpoint = '/api/processing/createorg';
          break;
        case 'Import Emission Sources':
          endpoint = '/api/processing/ingestes';
          break;
        case 'Load BAR Data':
          endpoint = '/api/processing/ingestbar';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      alert(`Processing completed successfully!\n${result.message || ''}`);

    } catch (error) {
      console.error('Processing error:', error);
      alert(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
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
                    <Select value={action} onChange={(e) => setAction(e.target.value)}>
                      {['Import Organizations', 'Import Emission Sources', 'Load BAR Data'].map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                    <Button colorScheme="brand" onClick={handleProcessing} isDisabled={!selectedFile}>Execute</Button>
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


