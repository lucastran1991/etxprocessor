'use client'

import { Container, Heading, Text, VStack, Card, CardBody, useColorModeValue } from '@chakra-ui/react'
import Layout from '@/components/layout/Layout'

export default function PrivacyPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  return (
    <Layout>
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="2%">
        <VStack spacing={6} align="start">
          <Heading as="h1" size="xl">Privacy Policy</Heading>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <Text>
                  We respect your privacy. Uploaded files and personal information are processed and stored
                  according to your configuration. We do not share your data with third parties.
                </Text>
                <Text>
                  You may contact us for questions or data removal requests using the contact details provided.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}


