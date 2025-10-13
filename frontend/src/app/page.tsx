'use client'

import { Container, Text } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/login')
    }
  }, [user, isLoading, router])

  return (
    <Container maxW="md" py={10}>
      <Text>Redirecting…</Text>
    </Container>
  )
}
