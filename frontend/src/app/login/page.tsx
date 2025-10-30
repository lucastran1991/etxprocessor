'use client'

import { Box, Container, Heading, Text, VStack, Link, Card, CardBody, CardHeader, Divider, Icon } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaSignInAlt } from 'react-icons/fa'
import LoginForm from '@/components/LoginForm'
import Layout from '@/components/layout/Layout'
import { fadeIn, staggerContainer, staggerItem } from '@/utils/animations'

export default function LoginPage() {
  return (
    <Layout>
      <Container maxW="md" py={10}>
        <Box
          as={motion.div}
          variants={fadeIn}
          initial="initial"
          animate="animate"
          width="100%"
        >
          <Card
            boxShadow="xl"
            borderRadius="2xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="brand.200"
            _hover={{
              boxShadow: '2xl',
              transition: 'all 0.3s ease'
            }}
          >
            <CardHeader
              bgGradient="linear(to-r, brand.500, brand.600)"
              color="white"
              textAlign="center"
              py={8}
            >
              <VStack spacing={3}>
                <Icon
                  as={FaSignInAlt}
                  boxSize={10}
                  color="white"
                  opacity={0.9}
                />
                <Heading as="h1" size="xl" color="white">
                  Login
                </Heading>
                <Text fontSize="md" color="whiteAlpha.900">
                  Sign in to your account
                </Text>
              </VStack>
            </CardHeader>
            <Divider />
            <CardBody p={8}>
              <LoginForm />
            </CardBody>
          </Card>
        </Box>
      </Container>
    </Layout>
  )
}
