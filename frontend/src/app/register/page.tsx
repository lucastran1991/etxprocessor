'use client'

import { Box, Container, Heading, Text, VStack, Link } from '@chakra-ui/react'
import RegisterForm from '@/components/RegisterForm'
import Layout from '@/components/layout/Layout'

export default function RegisterPage() {
  return (
    <Layout>
      <Container maxW="md" py={10}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Register
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Create a new account
            </Text>
          </Box>

          <RegisterForm />

          <Text>
            Already have an account?{' '}
            <Link as={require('next/link').default} href="/login" color="blue.500">
              Login here
            </Link>
          </Text>
        </VStack>
      </Container>
    </Layout>
  )
}
