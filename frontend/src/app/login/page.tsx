'use client'

import { Box, Container, Heading, Text, VStack, Link } from '@chakra-ui/react'
import { Link as NextLink } from 'next/link'
import LoginForm from '@/components/LoginForm'
import Layout from '@/components/layout/Layout'

export default function LoginPage() {
  return (
    <Layout>
      <Container maxW="md" py={10}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Login
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Sign in to your account
            </Text>
          </Box>

          <LoginForm />

          <Text>
            Don't have an account?{' '}
            <Link as={NextLink} href="/register" color="blue.500">
              Register here
            </Link>
          </Text>
        </VStack>
      </Container>
    </Layout>
  )
}
