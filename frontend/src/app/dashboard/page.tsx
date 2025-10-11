'use client'

import { Box, Container, Heading, Text, VStack, Grid, GridItem, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="7xl" py={10}>
          <Text>Loading...</Text>
        </Container>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout>
      <Container maxW="7xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Welcome back, {user.username}!
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Here's your dashboard overview
            </Text>
          </Box>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Level</StatLabel>
                    <StatNumber>{user.level}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      {user.exp} XP
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Experience</StatLabel>
                    <StatNumber>{user.exp}</StatNumber>
                    <StatHelpText>
                      Next level: {user.level * 100 - user.exp} XP
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <StatNumber color={user.is_active ? 'green.500' : 'red.500'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </StatNumber>
                    <StatHelpText>
                      Account status
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>

            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Role</StatLabel>
                    <StatNumber textTransform="capitalize">
                      {user.role}
                    </StatNumber>
                    <StatHelpText>
                      User permissions
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Recent Activity
            </Heading>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Text color="gray.600">
                  No recent activity to display. Start using the system to see your activity here.
                </Text>
              </CardBody>
            </Card>
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
