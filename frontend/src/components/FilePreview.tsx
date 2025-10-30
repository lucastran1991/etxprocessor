'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Image,
  useColorModeValue,
  Icon,
  Center
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/utils/imageUrl'
import { fadeIn, slideIn, scaleIn } from '@/utils/animations'
import { FaFile, FaFileImage, FaFilePdf, FaFileCsv, FaFileAlt } from 'react-icons/fa'
import SkeletonLoader from './SkeletonLoader'

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

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

function isImage(mime?: string | null, name?: string) {
  if (!mime && name) return /(\.(png|jpe?g|gif|webp))$/i.test(name)
  return !!mime && mime.startsWith('image/')
}

function isPdf(mime?: string | null, name?: string) {
  if (!mime && name) return /\.pdf$/i.test(name)
  return mime === 'application/pdf'
}

function isCsv(mime?: string | null, name?: string) {
  if (!mime && name) return /\.csv$/i.test(name)
  return mime === 'text/csv' || mime === 'application/vnd.ms-excel'
}

function isJson(mime?: string | null, name?: string) {
  if (!mime && name) return /\.json$/i.test(name)
  return mime === 'application/json'
}

export default function FilePreview({ file }: { file: FileNode | null }) {
  const [csvRows, setCsvRows] = useState<string[][] | null>(null)
  const [jsonText, setJsonText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewBg = useColorModeValue('gray.50', 'gray.900')
  const headerBg = useColorModeValue('gray.100', 'gray.700')

  const url = useMemo(() => {
    if (!file) return undefined
    // File tree provides relative storage path; reuse image util to build absolute URL
    return getImageUrl(file.path)
  }, [file])

  // CSV loader
  useEffect(() => {
    setCsvRows(null)
    setJsonText(null)
    setError(null)
    if (!file || !url) return
    if (!isCsv(file.mime_type, file.name)) return

    const controller = new AbortController()
    const fetchCsv = async () => {
      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        const rows = lines.slice(0, 50).map((line) => {
          // naive CSV split; adequate for basic previews
          return line.split(',').map((cell) => cell.replace(/^"|"$/g, ''))
        })
        setCsvRows(rows)
      } catch (e: any) {
        if (e.name !== 'AbortError') setError('Failed to load CSV preview')
      } finally {
        setLoading(false)
      }
    }
    fetchCsv()
    return () => controller.abort()
  }, [file, url])

  // JSON loader
  useEffect(() => {
    setJsonText(null)
    if (!file || !url) return
    if (!isJson(file.mime_type, file.name)) return

    const controller = new AbortController()
    const fetchJson = async () => {
      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        try {
          const parsed = JSON.parse(text)
          const pretty = JSON.stringify(parsed, null, 2)
          setJsonText(pretty.length > 100_000 ? pretty.slice(0, 100_000) + '\n... (truncated) ...' : pretty)
        } catch {
          setJsonText(text.length > 100_000 ? text.slice(0, 100_000) + '\n... (truncated) ...' : text)
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') setError('Failed to load JSON preview')
      } finally {
        setLoading(false)
      }
    }
    fetchJson()
    return () => controller.abort()
  }, [file, url])

  if (!file) {
    return (
      <Card>
        <CardHeader>
          <Heading size="md">Preview</Heading>
        </CardHeader>
        <Divider />
        <CardBody>
          <VStack
            as={motion.div}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            spacing={4}
            py={8}
            textAlign="center"
          >
            <Icon
              as={FaFile}
              boxSize={12}
              color="gray.400"
              opacity={0.6}
            />
            <VStack spacing={1}>
              <Text color="gray.600" fontSize="md" fontWeight="medium">
                No file selected
              </Text>
              <Text color="gray.400" fontSize="sm">
                Select a file from the File Explorer to preview
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      key={file.id}
    >
    <Card 
      maxW="100%" 
      maxH="calc(100vh - 100px)" 
      overflow="auto"
    >
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Preview</Heading>
          <HStack spacing={2} flexWrap="wrap">
            <Icon
              as={
                isImage(file.mime_type, file.name) ? FaFileImage :
                isPdf(file.mime_type, file.name) ? FaFilePdf :
                isCsv(file.mime_type, file.name) ? FaFileCsv :
                FaFileAlt
              }
              boxSize={4}
              color="brand.500"
            />
            <Text fontWeight="semibold">{file.name}</Text>
            {file.mime_type && <Badge>{file.mime_type}</Badge>}
            {file.size ? <Badge colorScheme="brand">{formatBytes(file.size)}</Badge> : null}
          </HStack>
        </VStack>
      </CardHeader>
      <Divider />
      <CardBody overflow="auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Center py={8}>
                <VStack spacing={3}>
                  <Spinner size="md" color="brand.500" thickness="3px" />
                  <Text fontSize="sm" color="gray.500">
                    Loading preview...
                  </Text>
                </VStack>
              </Center>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              variants={slideIn}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <VStack
                spacing={3}
                py={6}
                textAlign="center"
              >
                <Icon as={FaFileAlt} boxSize={10} color="red.400" opacity={0.6} />
                <Text color="red.500" fontWeight="medium">{error}</Text>
              </VStack>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {isImage(file.mime_type, file.name) && url && !loading && (
          <Box
            as={motion.div}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            bg={previewBg} 
            p={2} 
            borderRadius="md"
          >
            <Image 
              src={url} 
              alt={file.name} 
              maxH="480px" 
              objectFit="contain" 
              mx="auto"
              borderRadius="md"
              boxShadow="md"
              transition="all 0.3s ease"
              _hover={{
                boxShadow: 'lg',
                transform: 'scale(1.02)',
              }}
            />
          </Box>
        )}

        {isPdf(file.mime_type, file.name) && url && !loading && (
          <Box
            as={motion.div}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            bg={previewBg} 
            p={2} 
            borderRadius="md"
          >
            <Box as="iframe" src={url} width="100%" height="600px" border={0} borderRadius="md" />
          </Box>
        )}

        {isCsv(file.mime_type, file.name) && !loading && !error && csvRows && csvRows.length > 0 && (
          <Box
            as={motion.div}
            variants={slideIn}
            initial="initial"
            animate="animate"
            overflow="auto" 
            maxW="100%" 
            maxH="60vh" 
            borderRadius="md" 
            borderWidth="1px"
          >
            <Table size="sm" variant="striped">
              <Thead>
                <Tr>
                  {csvRows[0].map((h, i) => (
                    <Th key={i} position="sticky" top={0} zIndex={1} bg={headerBg}>{h}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {csvRows.slice(1, 51).map((row, r) => (
                  <Tr 
                    key={r}
                    transition="all 0.2s ease"
                    _hover={{
                      bg: 'brand.50',
                      transform: 'translateX(2px)',
                    }}
                  >
                    {row.map((c, i) => (
                      <Td key={i} whiteSpace="nowrap">{c}</Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {csvRows.length > 50 && (
              <Text mt={2} fontSize="xs" color="gray.500" px={2}>
                Showing first 50 rows…
              </Text>
            )}
          </Box>
        )}

        {isJson(file.mime_type, file.name) && !loading && !error && jsonText && (
          <Box
            as={motion.div}
            variants={slideIn}
            initial="initial"
            animate="animate"
            bg={previewBg} 
            p={3} 
            borderRadius="md" 
            overflowX="auto"
          >
            <Box as="pre" fontSize="sm" whiteSpace="pre" fontFamily="mono" maxW="100%">
              {jsonText}
            </Box>
          </Box>
        )}

        {!isImage(file.mime_type, file.name) && !isPdf(file.mime_type, file.name) && !isCsv(file.mime_type, file.name) && !isJson(file.mime_type, file.name) && !loading && !error && (
          <VStack
            as={motion.div}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            spacing={3}
            py={8}
            textAlign="center"
          >
            <Icon
              as={FaFileAlt}
              boxSize={10}
              color="gray.400"
              opacity={0.6}
            />
            <VStack spacing={1}>
              <Text color="gray.600" fontSize="md" fontWeight="medium">
                No preview available
              </Text>
              <Text color="gray.400" fontSize="sm">
                Preview is not supported for this file type
              </Text>
            </VStack>
          </VStack>
        )}
      </CardBody>
    </Card>
    </motion.div>
  )
}


