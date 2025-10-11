'use client'

import {
  Box,
  Container,
  Stack,
  Text,
  Link as ChakraLink,
  useColorModeValue,
  HStack,
  VStack,
  Divider
} from '@chakra-ui/react'
import Link from 'next/link'

export default function Footer() {
  const bg = useColorModeValue('gray.50', 'gray.900')
  const color = useColorModeValue('gray.700', 'gray.200')

  return (
    <Box bg={bg} color={color} mt="auto">
      <Container as={Stack} maxW="7xl" py={10}>
        <VStack spacing={8}>
          <HStack spacing={8} wrap="wrap" justify="center">
            <Link href="/" passHref>
              <ChakraLink _hover={{ textDecoration: 'underline' }}>
                Home
              </ChakraLink>
            </Link>
            <Link href="/about" passHref>
              <ChakraLink _hover={{ textDecoration: 'underline' }}>
                About
              </ChakraLink>
            </Link>
            <Link href="/contact" passHref>
              <ChakraLink _hover={{ textDecoration: 'underline' }}>
                Contact
              </ChakraLink>
            </Link>
            <Link href="/privacy" passHref>
              <ChakraLink _hover={{ textDecoration: 'underline' }}>
                Privacy Policy
              </ChakraLink>
            </Link>
            <Link href="/terms" passHref>
              <ChakraLink _hover={{ textDecoration: 'underline' }}>
                Terms of Service
              </ChakraLink>
            </Link>
          </HStack>
          
          <Divider />
          
          <VStack spacing={2}>
            <Text fontSize="sm" textAlign="center">
              © {new Date().getFullYear()} ETX Processor. All rights reserved.
            </Text>
            <Text fontSize="xs" textAlign="center" color="gray.500">
              Financial data processing system with user management and gamification features.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}
