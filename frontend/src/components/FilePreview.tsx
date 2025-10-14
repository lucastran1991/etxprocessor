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
  useColorModeValue
} from '@chakra-ui/react'
import { getImageUrl } from '@/utils/imageUrl'

interface FileNodeLike {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mime_type?: string | null
  path: string
  uploaded_at: string
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

export default function FilePreview({ file }: { file: FileNodeLike | null }) {
  const [csvRows, setCsvRows] = useState<string[][] | null>(null)
  const [jsonText, setJsonText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewBg = useColorModeValue('gray.50', 'gray.900')

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
          <Text color="gray.500">Select a file from the File Explorer to preview.</Text>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card maxW="100%" maxH="calc(100vh - 100px)" overflowY="auto">
      <CardHeader>
        <VStack align="start" spacing={1}>
          <Heading size="md">Preview</Heading>
          <HStack spacing={2}>
            <Text fontWeight="semibold">{file.name}</Text>
            {file.mime_type && <Badge>{file.mime_type}</Badge>}
            {file.size ? <Badge colorScheme="brand">{formatBytes(file.size)}</Badge> : null}
          </HStack>
        </VStack>
      </CardHeader>
      <Divider />
      <CardBody overflowX="auto">
        {isImage(file.mime_type, file.name) && url && (
          <Box bg={previewBg} p={2} borderRadius="md">
            <Image src={url} alt={file.name} maxH="480px" objectFit="contain" mx="auto" />
          </Box>
        )}

        {isPdf(file.mime_type, file.name) && url && (
          <Box bg={previewBg} p={2} borderRadius="md">
            <Box as="iframe" src={url} width="100%" height="600px" border={0} />
          </Box>
        )}

        {isCsv(file.mime_type, file.name) && (
          <Box>
            {loading && (
              <HStack>
                <Spinner size="sm" />
                <Text>Loading CSV preview…</Text>
              </HStack>
            )}
            {error && <Text color="red.500">{error}</Text>}
            {!loading && csvRows && csvRows.length > 0 && (
              <Box overflowX="auto" maxW="100%">
                <Table size="sm" variant="striped" sx={{ tableLayout: 'fixed' }}>
                  <Thead>
                    <Tr>
                      {csvRows[0].map((h, i) => (
                        <Th key={i}>{h}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {csvRows.slice(1, 51).map((row, r) => (
                      <Tr key={r}>
                        {row.map((c, i) => (
                          <Td key={i} maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">{c}</Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {csvRows.length > 50 && (
                  <Text mt={2} fontSize="xs" color="gray.500">Showing first 50 rows…</Text>
                )}
              </Box>
            )}
          </Box>
        )}

        {isJson(file.mime_type, file.name) && (
          <Box>
            {loading && (
              <HStack>
                <Spinner size="sm" />
                <Text>Loading JSON preview…</Text>
              </HStack>
            )}
            {error && <Text color="red.500">{error}</Text>}
            {!loading && jsonText && (
              <Box bg={previewBg} p={3} borderRadius="md" overflowX="auto">
                <Box as="pre" fontSize="sm" whiteSpace="pre" fontFamily="mono" maxW="100%">
                  {jsonText}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {!isImage(file.mime_type, file.name) && !isPdf(file.mime_type, file.name) && !isCsv(file.mime_type, file.name) && !isJson(file.mime_type, file.name) && (
          <Text color="gray.500">No preview available for this file type.</Text>
        )}
      </CardBody>
    </Card>
  )
}


