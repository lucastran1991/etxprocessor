'use client'

import { Container, Text, Box, VStack, Button } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, isLoading, router]);

  return (
    <Layout>
      <Container maxW="90%" py={10} pl="5%" pr="5%"> {/* Aligned to project styles */} 
        <VStack spacing={6} align="center"> {/* Center aligned content for simplicity */} 
          <Text>Redirecting…</Text>
          {user && (
            <Box position="absolute" bottom="4" left="0" right="0" textAlign="center"> {/* Logout at bottom */} 
              <Button colorScheme="red" onClick={logout}>Logout</Button>
            </Box>
          )}
        </VStack>
      </Container>
    </Layout>
  );
}
