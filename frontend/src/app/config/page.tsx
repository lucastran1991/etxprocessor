'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Container, Heading, VStack, Card, CardHeader, CardBody, Divider, SimpleGrid, FormControl, FormLabel, Input, Button, useToast, HStack, Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiUpload } from 'react-icons/fi'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/services/apiClient'
import Layout from '@/components/layout/Layout'
import { staggerContainer, staggerItem } from '@/utils/animations'

interface ConfigShape {
  HTTPURI?: string
  WSURI?: string
  email?: string
  password?: string
  ServerFileFolder?: string
  RowsPerFile?: number
  ImportFilePerRequest?: number
  MaxRequests?: number
  API_KEY?: string
  API_VERSION?: string
  GATE_WAY?: string
}

export default function ConfigPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [config, setConfig] = useState<ConfigShape>({})
  const [saving, setSaving] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return
    apiClient.get('/users/me/config').then(res => setConfig(res.data || {})).catch(() => setConfig({}))
  }, [user])

  const set = (k: keyof ConfigShape, v: any) => setConfig((prev) => ({ ...prev, [k]: v }))

  const onSave = async () => {
    setSaving(true)
    try {
      await apiClient.put('/users/me/config', config)
      toast({ title: 'Saved', status: 'success', duration: 2000, isClosable: true })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.response?.data?.detail || 'Error', status: 'error', duration: 3000, isClosable: true })
    } finally {
      setSaving(false)
    }
  }

  const onUploadJson = async (file: File) => {
    try {
      const text = await file.text()
      setJsonText(text)
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('JSON must be an object')
      setConfig((prev) => ({ ...prev, ...(parsed as any) }))
      toast({ title: 'JSON loaded', status: 'success', duration: 2000, isClosable: true })
    } catch (e: any) {
      toast({ title: 'Invalid JSON', description: e?.message || 'Parse error', status: 'error', duration: 3000, isClosable: true })
    }
  }

  return (
    <Layout>
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="2%">
        <VStack align="stretch" spacing={6}>
          <Heading size="xl">Configuration</Heading>
          <Card>
            <CardHeader><Heading size="md">ETX Batch Settings</Heading></CardHeader>
            <Divider />
            <CardBody>
              <HStack spacing={4} mb={10} align="flex-start">
                <FormControl>
                  <FormLabel>Upload JSON</FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    display="none"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onUploadJson(f)
                      // reset value to allow re-uploading the same file
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  />
                  <Button
                    leftIcon={<FiUpload />}
                    variant="outline"
                    colorScheme="brand"
                    bg="white"
                    borderColor="brand.500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload JSON
                  </Button>
                </FormControl>
              </HStack>
              <Box
                as={motion.div}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {[
                    ['HTTPURI','HTTP URI'],['WSURI','WS URI'],['email','Email'],['password','Password'],
                    ['ServerFileFolder','Server File Folder'],['RowsPerFile','Rows Per File'],
                    ['ImportFilePerRequest','Import File Per Request'],['MaxRequests','Max Requests'],
                    ['API_KEY','API KEY'],['API_VERSION','API VERSION'],['GATE_WAY','Gateway']
                  ].map(([key,label]) => (
                    <motion.div
                      key={key as string}
                      variants={staggerItem}
                    >
                      <FormControl>
                        <FormLabel>{label}</FormLabel>
                        <Input
                          type='text'
                          value={(config as any)?.[key as keyof ConfigShape] ?? ''}
                          onChange={(e) => set(key as keyof ConfigShape, (key==='RowsPerFile' || key==='ImportFilePerRequest' || key==='MaxRequests') ? Number(e.target.value) : e.target.value)}
                          _focus={{
                            borderColor: 'brand.500',
                            boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
                          }}
                          transition="all 0.3s ease"
                        />
                      </FormControl>
                    </motion.div>
                  ))}
                </SimpleGrid>
              </Box>
              <Button mt={6} colorScheme="brand" onClick={onSave} isLoading={saving} w="full">Save</Button>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


