'use client'

import { Container, Heading, Text, VStack, Card, CardBody, useColorModeValue, Link as ChakraLink } from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'

export default function ContactPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  return (
    <Layout>
      <Container maxW="7xl" py={10}>
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl">Contact</Heading>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text><b>Name:</b> Lucas Tran</Text>
                <Text>
                  <b>Email:</b> <ChakraLink href="mailto:ltran@atomiton.com">ltran@atomiton.com</ChakraLink>
                </Text>
                <Text><b>Company:</b> Atomiton Company</Text>
                <Text><b>Phone:</b> 0367270213</Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


