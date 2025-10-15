'use client'

import { Container, Heading, Text, VStack, Card, CardBody, useColorModeValue } from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'

export default function TermsPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  return (
    <Layout>
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="2%">
        <VStack spacing={6} align="start">
          <Heading as="h1" size="xl">Terms of Service</Heading>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <Text>
                  By using ETX Processor, you agree to use the system responsibly and in accordance with
                  applicable laws. The software is provided as-is without warranties of any kind.
                </Text>
                <Text>
                  We reserve the right to update these terms. Continued use of the service constitutes acceptance
                  of any changes.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


