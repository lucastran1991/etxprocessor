'use client'

import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Badge, 
  Progress, 
  Button, 
  Divider,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  useToast
} from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import AvatarUpload from '@/components/AvatarUpload'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  })

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
    if (user) {
      setFormData({
        username: user.username,
        email: user.email
      })
      setAvatarUrl(user.avatar_url)
    }
  }, [user, isLoading, router])

  const handleAvatarUpdate = (newUrl: string | null) => {
    setAvatarUrl(newUrl || undefined)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      // Here you would typically call an API to update the user profile
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red'
      case 'moderator': return 'orange'
      default: return 'blue'
    }
  }

  const getExpProgress = (exp: number, level: number) => {
    const currentLevelExp = (level - 1) * 100
    const nextLevelExp = level * 100
    const progress = ((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="4xl" py={10}>
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
      <Container maxW="4xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Profile
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Manage your account information and preferences
            </Text>
          </Box>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={6} align="center">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  username={user.username}
                  onAvatarUpdate={handleAvatarUpdate}
                />
                <VStack spacing={2}>
                  <Heading as="h2" size="lg">{user.username}</Heading>
                  <Badge colorScheme={getRoleColor(user.role)} fontSize="md" px={3} py={1}>
                    {user.role.toUpperCase()}
                  </Badge>
                </VStack>

                <VStack spacing={4} width="100%" maxW="md">
                  <HStack justifyContent="space-between" width="100%">
                    <Text fontWeight="bold">Level:</Text>
                    <Text>{user.level}</Text>
                  </HStack>
                  <HStack justifyContent="space-between" width="100%">
                    <Text fontWeight="bold">Experience:</Text>
                    <Text>{user.exp} / {user.level * 100}</Text>
                  </HStack>
                  <Progress 
                    value={getExpProgress(user.exp, user.level)} 
                    size="lg" 
                    colorScheme="green" 
                    width="100%" 
                  />
                </VStack>

                <Divider />

                <VStack spacing={4} width="100%" maxW="md">
                  <FormControl>
                    <FormLabel>Username</FormLabel>
                    <Input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      isDisabled={!isEditing}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      isDisabled={!isEditing}
                    />
                  </FormControl>

                  <HStack spacing={4} width="100%">
                    {isEditing ? (
                      <>
                        <Button colorScheme="green" onClick={handleSave} flex="1">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} flex="1">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button colorScheme="blue" onClick={() => setIsEditing(true)} width="full">
                        Edit Profile
                      </Button>
                    )}
                  </HStack>
                </VStack>

                <Divider />

                <VStack spacing={2} align="flex-start" width="100%" maxW="md">
                  <Text><strong>Account Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</Text>
                  <Text><strong>Email Verified:</strong> {user.is_verified ? 'Yes' : 'No'}</Text>
                  <Text><strong>Member Since:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Layout>
  )
}
