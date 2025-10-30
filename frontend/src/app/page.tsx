'use client'

import { Container, Text, Box, VStack, Spinner, Center } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { fadeIn } from '@/utils/animations'

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/login')
    }
  }, [user, isLoading, router])

  return (
    <Layout>
      <Container maxW="90%" py={10} pl="5%" pr="5%">
        <Center minH="50vh">
          <VStack
            as={motion.div}
            variants={fadeIn}
            initial="initial"
            animate="animate"
            spacing={4}
          >
            <Spinner 
              size="xl" 
              color="brand.500" 
              thickness="4px"
              speed="0.8s"
            />
            <Text fontSize="lg" color="gray.600" fontWeight="medium">
              Redirecting...
            </Text>
          </VStack>
        </Center>
      </Container>
    </Layout>
  )
}
