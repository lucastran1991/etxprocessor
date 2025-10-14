'use client'

import { Container, Heading, Text, VStack, Card, CardBody, useColorModeValue } from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'

export default function AboutPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  return (
    <Layout>
      <Container maxW="7xl" py={10}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl">About</Heading>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <Text>
                  ETX Processor is a modern file management and processing system designed to help teams
                  securely upload, organize, and process datasets with a streamlined UI.
                </Text>
                <Text>
                  Features include nested folders, CSV previews, processing actions, and configurable user settings.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


