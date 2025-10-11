'use client'

import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import LoginForm from '@/components/LoginForm'
import UserProfile from '@/components/UserProfile'
import Layout from '@/components/layout/Layout'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="md" py={10}>
          <Text>Loading...</Text>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxW="md" py={10}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              ETX Processor
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Financial data processing system
            </Text>
          </Box>

          {user ? (
            <UserProfile user={user} />
          ) : (
            <LoginForm showRegisterLink={false} />
          )}
        </VStack>
      </Container>
    </Layout>
  )
}
