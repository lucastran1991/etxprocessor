'use client'

import { Box, Flex } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { pageTransition } from '@/utils/animations'
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
        <Box
          as={motion.div}
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </Box>
      </Box>
      <Footer />
    </Flex>
  )
}
