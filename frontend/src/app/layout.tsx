'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '@/hooks/useAuth'
import theme from '@/utils/theme'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>ETX Processor - File Management System</title>
        <meta name="description" content="A modern file management and processing system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}
