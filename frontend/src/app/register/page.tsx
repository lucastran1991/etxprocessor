'use client'

import { Box, Container, Heading, Text, VStack, Link } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import RegisterForm from '@/components/RegisterForm'
import Layout from '@/components/layout/Layout'
import { fadeIn, staggerContainer, staggerItem } from '@/utils/animations'

export default function RegisterPage() {
  return (
    <Layout>
      <Container maxW="md" py={10}>
        <VStack
          as={motion.div}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          spacing={8}
        >
          <Box
            as={motion.div}
            variants={staggerItem}
            textAlign="center"
          >
            <Heading as="h1" size="xl" mb={4}>
              Register
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Create a new account
            </Text>
          </Box>

          <Box
            as={motion.div}
            variants={staggerItem}
            width="100%"
          >
            <RegisterForm />
          </Box>

          <Box
            as={motion.div}
            variants={staggerItem}
          >
            <Text>
              Already have an account?{' '}
              <Link as={require('next/link').default} href="/login" color="blue.500">
                Login here
              </Link>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
