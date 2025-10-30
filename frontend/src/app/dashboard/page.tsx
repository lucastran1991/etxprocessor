'use client'

import { Box, Container, Heading, Text, VStack, Grid, GridItem, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue, HStack, Badge, Table, Thead, Tr, Th, Tbody, Td, Avatar, Button, SimpleGrid, Center, Icon } from '@chakra-ui/react'
import { FaHistory, FaUsers } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/services/apiClient'
import { getImageUrl } from '@/utils/imageUrl'
import AnimatedStat from '@/components/AnimatedStat'
import SkeletonLoader from '@/components/SkeletonLoader'
import { staggerContainer, staggerItem, scaleIn, fadeIn } from '@/utils/animations'

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
        <Container maxW="90%" pt="5%" pb="2%" pl="5%" pr="5%">
          <VStack spacing={8} align="left">
            <SkeletonLoader type="card" count={1} height="100px" />
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
              <GridItem><SkeletonLoader type="stat" count={1} /></GridItem>
              <GridItem><SkeletonLoader type="stat" count={1} /></GridItem>
              <GridItem><SkeletonLoader type="stat" count={1} /></GridItem>
              <GridItem><SkeletonLoader type="stat" count={1} /></GridItem>
            </Grid>
          </VStack>
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

          <Box
            as={motion.div}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
              <GridItem
                as={motion.div}
                variants={staggerItem}
              >
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardBody>
                    <Stat>
                      <StatLabel>Level</StatLabel>
                      <AnimatedStat value={user.level} />
                      <StatHelpText>
                        <StatArrow type="increase" />
                        {user.exp} XP
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem
                as={motion.div}
                variants={staggerItem}
              >
                <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                  <CardBody>
                    <Stat>
                      <StatLabel>Experience</StatLabel>
                      <AnimatedStat value={user.exp} />
                      <StatHelpText>
                        Next level: {user.level * 100 - user.exp} XP
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem
                as={motion.div}
                variants={staggerItem}
              >
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

              <GridItem
                as={motion.div}
                variants={staggerItem}
              >
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
          </Box>

          {/* File Storage Stats */}
          <Box
            as={motion.div}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
              {storage && (
                <>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Files</StatLabel>
                          <AnimatedStat value={storage?.file_count ?? 0} />
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Size</StatLabel>
                          <StatNumber>{storage ? (storage.total_size / (1024 * 1024)).toFixed(2) + ' MB' : '-'}</StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>Images</StatLabel>
                          <AnimatedStat value={storage?.by_type?.images ?? 0} />
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>PDF</StatLabel>
                          <AnimatedStat value={storage?.by_type?.pdf ?? 0} />
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>CSV</StatLabel>
                          <AnimatedStat value={storage?.by_type?.csv ?? 0} />
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                  <GridItem
                    as={motion.div}
                    variants={staggerItem}
                  >
                    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                      <CardBody>
                        <Stat>
                          <StatLabel>Others</StatLabel>
                          <AnimatedStat value={storage?.by_type?.others ?? 0} />
                        </Stat>
                      </CardBody>
                    </Card>
                  </GridItem>
                </>
              )}
            </Grid>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              Recent Activity
            </Heading>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <VStack
                  as={motion.div}
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  spacing={3}
                  py={6}
                  textAlign="center"
                >
                  <Icon
                    as={require('react-icons/fa').FaHistory}
                    boxSize={8}
                    color="gray.400"
                    opacity={0.6}
                  />
                  <VStack spacing={1}>
                    <Text color="gray.600" fontSize="md" fontWeight="medium">
                      No recent activity to display
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Start using the system to see your activity here
                    </Text>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4}>
              System Users
            </Heading>
            {usersList.length === 0 ? (
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <VStack
                    as={motion.div}
                    variants={fadeIn}
                    initial="initial"
                    animate="animate"
                    spacing={3}
                    py={8}
                    textAlign="center"
                  >
                    <Icon
                      as={FaUsers}
                      boxSize={10}
                      color="gray.400"
                      opacity={0.6}
                    />
                    <VStack spacing={1}>
                      <Text color="gray.600" fontSize="md" fontWeight="medium">
                        No users to display
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Users will appear here once registered
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <Box
                as={motion.div}
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                borderRadius="md"
              >
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                  {usersList.map((u, index) => (
                    <motion.div
                      key={u.id}
                      variants={staggerItem}
                      initial="initial"
                      animate="animate"
                    >
                      <Card 
                        borderColor={borderColor} 
                        borderWidth="1px"
                        transition="all 0.3s"
                        _hover={{
                          transform: 'translateY(-4px) scale(1.02)',
                          borderColor: 'brand.400',
                          boxShadow: 'xl',
                        }}
                        boxShadow="md"
                      >
                        <CardBody>
                          <HStack spacing={4} align="center">
                            <Avatar 
                              size="lg" 
                              name={u.username} 
                              src={getImageUrl(u.avatar_url)}
                              boxShadow="md"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" isTruncated={false} wordBreak="break-all" noOfLines={1} w="100%">
                                {u.username}
                              </Text>
                              <Text fontSize="sm" color="gray.500" isTruncated={false} wordBreak="break-all" w="100%">
                                {u.email}
                              </Text>
                              <Badge mt={1} maxW="100%" whiteSpace="normal" textOverflow="ellipsis" overflowWrap="break-word">
                                {typeof u.role === 'string' ? u.role : (u.role?.value || '')}
                              </Badge>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    </motion.div>
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
