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
  useToast,
  Switch,
  FormControl,
  FormLabel,
  Box,
  Center,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import FileExplorer from '@/components/FileExplorer'
import { apiClient } from '@/services/apiClient'
import { slideIn, fadeIn } from '@/utils/animations'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mime_type?: string
  path: string
  folder_path: string
  uploaded_at: string
  display_name: string
  children?: FileNode[]
}

export default function ProcessingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [action, setAction] = useState<string>('Import Organizations')
  const [isProcessing, setIsProcessing] = useState(false)
  const [deleteAfterProcess, setDeleteAfterProcess] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleProcessing = async () => {
    if (!selectedFile || !action) return;
    console.log('selectedFile: ', selectedFile, 'action: ', action)
    setIsProcessing(true)

    try {
      const formDataArray: FormData[] = [];
      
      const formData = new FormData();
      formData.append('data_file', selectedFile.id);

      formDataArray.push(formData);

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
        title: selectedFile.name + ' - Processing Completed',
        description: result.message || '',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Delete file after successful processing if toggle is active
      if (deleteAfterProcess && selectedFile) {
        try {
          await apiClient.delete(`/files/${selectedFile.id}`);
          console.log('File deleted: ', selectedFile.name)
          // toast({
          //   title: 'File Deleted',
          //   description: `File "${selectedFile.name}" has been deleted successfully.`,
          //   status: 'success',
          //   duration: 5000,
          //   isClosable: true,
          // });
          setSelectedFile(null);
          // Refresh FileExplorer to reflect the deletion
          setRefreshKey(prev => prev + 1);
        } catch (deleteError) {
          console.error('Delete error:', deleteError);
          // toast({
          //   title: 'Delete Failed',
          //   description: deleteError instanceof Error ? deleteError.message : 'Failed to delete file',
          //   status: 'error',
          //   duration: 5000,
          //   isClosable: true,
          // });
        }
      }

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
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="2%" position="relative">
        <AnimatePresence>
          {isProcessing && (
            <Box
              as={motion.div}
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              position="fixed"
              top={0}
              left={0}
              width="100vw"
              height="100vh"
              bg="rgba(0, 0, 0, 0.7)"
              backdropFilter="blur(8px)"
              zIndex={1000}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <VStack spacing={4}>
                <Spinner 
                  size="xl" 
                  color="brand.500" 
                  thickness="4px"
                  speed="0.8s"
                  sx={{
                    animation: 'spin 2s linear infinite, pulse 2s ease-in-out infinite',
                  }}
                />
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  Processing {selectedFile?.name}...
                </Text>
                <Text color="whiteAlpha.700" fontSize="sm">
                  Please wait while we process your file
                </Text>
              </VStack>
            </Box>
          )}
        </AnimatePresence>
        <VStack spacing={6} align="stretch" zIndex={0}>
          <Heading as="h1" size="xl">Processing</Heading>
          <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">File Explorer</Heading>
                </CardHeader>
                <Divider />
                <CardBody maxH="800px" overflowY="auto">
                  <FileExplorer 
                    key={refreshKey}
                    readOnly 
                    hideItemDelete 
                    onFileSelect={
                      (f: FileNode) => { 
                        if (f.type === 'file') {
                          setSelectedFile(f)
                          console.log('selectedFile', f)
                        }
                      }
                    } 
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card>
                <CardHeader>
                  <HStack justify="space-between" align="center">
                    <Heading size="md">Action</Heading>
                    <FormControl display="flex" alignItems="center" w="auto">
                      <FormLabel htmlFor="delete-after-process" mb={0} fontSize="sm" mr={2}>
                        Delete after processing
                      </FormLabel>
                      <Switch
                        id="delete-after-process"
                        isChecked={deleteAfterProcess}
                        onChange={(e) => setDeleteAfterProcess(e.target.checked)}
                        isDisabled={isProcessing}
                      />
                    </FormControl>
                  </HStack>
                </CardHeader>
                <Divider />
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack align="stretch" spacing={4}>
                      <Select 
                        value={action} 
                        onChange={(e) => setAction(e.target.value)} 
                        w="50%" 
                        isDisabled={isProcessing}
                        _focus={{
                          borderColor: 'brand.500',
                          boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
                        }}
                        transition="all 0.3s ease"
                      >
                        {['Import Organizations', 'Import Emission Sources', 'Load BAR Data', 'Generate Organization Scheme'].map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </Select>
                      <Button colorScheme="brand" onClick={handleProcessing} isDisabled={!selectedFile || isProcessing} w="50%">Execute</Button>
                    </HStack>
                    <AnimatePresence mode="wait">
                      {selectedFile ? (
                        <Box
                          as={motion.div}
                          variants={slideIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          key={selectedFile.id}
                        >
                          <VStack align="start" spacing={1} fontSize="sm" p={3} bg="brand.50" borderRadius="md" borderWidth="2px" borderColor="brand.200">
                            <HStack><Badge colorScheme="brand">Folder</Badge><Text fontWeight="semibold">{selectedFile.folder_path || '/'}</Text></HStack>
                            <HStack><Badge colorScheme="brand">File</Badge><Text fontWeight="semibold">{selectedFile.name}</Text></HStack>
                            {selectedFile.size !== undefined && <HStack><Badge colorScheme="blue">Size</Badge><Text>{selectedFile.size} bytes</Text></HStack>}
                            <HStack><Badge colorScheme="gray">Uploaded</Badge><Text>{new Date(selectedFile.uploaded_at).toLocaleString()}</Text></HStack>
                            {selectedFile.mime_type && <HStack><Badge colorScheme="purple">MIME</Badge><Text>{selectedFile.mime_type}</Text></HStack>}
                          </VStack>
                        </Box>
                      ) : (
                        <motion.div
                          variants={fadeIn}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Text color="gray.500">Select a file to enable Execute and see details.</Text>
                        </motion.div>
                      )}
                    </AnimatePresence>
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


