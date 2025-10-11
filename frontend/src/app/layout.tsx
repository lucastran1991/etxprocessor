'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { AuthProvider } from '@/hooks/useAuth'
import theme from '@/utils/theme'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
