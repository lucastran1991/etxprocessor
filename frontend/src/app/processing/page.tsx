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
  const [action, setAction] = useState<string[]>(['Syncing', 'Reload', 'Publish BAR Data'])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const onExecute = () => {
    if (!selectedFile) return
    // For now, just notify with file info. Real execution can call an API.
    alert(`Action: ${action}\nFile: ${selectedFile.name}\nSize: ${selectedFile.size ?? 0} bytes\nUploaded: ${new Date(selectedFile.uploaded_at).toLocaleString()}`)
  }

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
                    <Select value={action[0]} onChange={(e) => setAction([e.target.value])}>
                      {action.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </Select>
                    <Button colorScheme="blue" onClick={onExecute} isDisabled={!selectedFile}>Execute</Button>
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


