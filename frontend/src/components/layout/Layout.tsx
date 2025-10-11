'use client'

import { Box, Flex } from '@chakra-ui/react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box flex="1" as="main">
        {children}
      </Box>
      <Footer />
    </Flex>
  )
}
