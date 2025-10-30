'use client'

import { Box, Container, Heading, Text, VStack, Link } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import LoginForm from '@/components/LoginForm'
import Layout from '@/components/layout/Layout'
import { fadeIn, staggerContainer, staggerItem } from '@/utils/animations'

export default function LoginPage() {
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
              Login
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Sign in to your account
            </Text>
          </Box>
          <Box
            as={motion.div}
            variants={staggerItem}
            width="100%"
          >
            <LoginForm />
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
