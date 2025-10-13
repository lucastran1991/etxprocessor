'use client'

import { useEffect, useState } from 'react'
import { Container, Heading, VStack, Card, CardHeader, CardBody, Divider, SimpleGrid, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/services/apiClient'

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

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        <VStack align="stretch" spacing={6}>
          <Heading size="xl">Configuration</Heading>
          <Card>
            <CardHeader><Heading size="md">ETX Batch Settings</Heading></CardHeader>
            <Divider />
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {[
                  ['HTTPURI','HTTP URI'],['WSURI','WS URI'],['email','Email'],['password','Password'],
                  ['ServerFileFolder','Server File Folder'],['RowsPerFile','Rows Per File'],
                  ['ImportFilePerRequest','Import File Per Request'],['MaxRequests','Max Requests'],
                  ['API_KEY','API KEY'],['API_VERSION','API VERSION'],['GATE_WAY','Gateway']
                ].map(([key,label]) => (
                  <FormControl key={key as string}>
                    <FormLabel>{label}</FormLabel>
                    <Input
                      type={key?.toString()?.toLowerCase().includes('password') ? 'password' : 'text'}
                      value={(config as any)?.[key as keyof ConfigShape] ?? ''}
                      onChange={(e) => set(key as keyof ConfigShape, (key==='RowsPerFile' || key==='ImportFilePerRequest' || key==='MaxRequests') ? Number(e.target.value) : e.target.value)}
                    />
                  </FormControl>
                ))}
              </SimpleGrid>
              <Button mt={6} colorScheme="brand" onClick={onSave} isLoading={saving}>Save</Button>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


