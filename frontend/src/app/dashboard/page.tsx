'use client'

import { Box, Container, Heading, Text, VStack, Grid, GridItem, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue, HStack, Badge, Table, Thead, Tr, Th, Tbody, Td, Avatar, Button, SimpleGrid } from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/services/apiClient'
import { getImageUrl } from '@/utils/imageUrl'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const listBg = useColorModeValue('gray.50', 'gray.700')
  const [storage, setStorage] = useState<any | null>(null)
  const [usersList, setUsersList] = useState<any[]>([])
  const [usersPage, setUsersPage] = useState(0)
  const usersPageSize = 12
  const [usersHasMore, setUsersHasMore] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      apiClient.get('/files/storage').then(res => setStorage(res.data)).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    // Public endpoint; fetch paginated
    const skip = usersPage * usersPageSize
    apiClient.get(`/users?skip=${skip}&limit=${usersPageSize}`).then(res => {
      const arr = res.data || []
      setUsersList(arr)
      setUsersHasMore(arr.length === usersPageSize)
    }).catch(() => {
      setUsersList([])
      setUsersHasMore(false)
    })
  }, [usersPage])

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
      <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="5%">
        <VStack spacing={8} align="left">
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

          {/* File Storage Stats */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Total Files</StatLabel>
                    <StatNumber>{storage?.file_count ?? '-'}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Total Size</StatLabel>
                    <StatNumber>{storage ? (storage.total_size / (1024 * 1024)).toFixed(2) + ' MB' : '-'}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Images</StatLabel>
                    <StatNumber>{storage?.by_type?.images ?? '-'}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>PDF</StatLabel>
                    <StatNumber>{storage?.by_type?.pdf ?? '-'}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>CSV</StatLabel>
                    <StatNumber>{storage?.by_type?.csv ?? '-'}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem>
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <Stat>
                    <StatLabel>Others</StatLabel>
                    <StatNumber>{storage?.by_type?.others ?? '-'}</StatNumber>
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

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              System Users
            </Heading>
            {usersList.length === 0 ? (
                  <Text color="gray.600">No users to display.</Text>
            ) : (
              <Box borderRadius="md">
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                  {usersList.map((u) => (
                    <Card key={u.id} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <HStack spacing={4} align="center">
                          <Avatar size="lg" name={u.username} src={getImageUrl(u.avatar_url)} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{u.username}</Text>
                            <Text fontSize="sm" color="gray.500">{u.email}</Text>
                            <Badge mt={1}>{typeof u.role === 'string' ? u.role : (u.role?.value || '')}</Badge>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}
            <HStack mt={4} justify="space-between">
              <Button size="sm" variant="outline" onClick={() => setUsersPage((p) => Math.max(0, p - 1))} isDisabled={usersPage === 0}>Previous</Button>
              <Text fontSize="sm">Page {usersPage + 1}</Text>
              <Button size="sm" variant="outline" onClick={() => setUsersPage((p) => p + 1)} isDisabled={!usersHasMore}>Next</Button>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  )
}
