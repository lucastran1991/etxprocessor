'use client'

import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Avatar,
  Text,
  Badge,
  Progress,
  Button,
  Divider,
  Heading
} from '@chakra-ui/react'
import { useAuth } from '@/hooks/useAuth'

interface User {
  id: string
  username: string
  email: string
  role: string
  avatar_url?: string
  level: number
  exp: number
  is_active: boolean
  is_verified: boolean
}

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  const { logout } = useAuth()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red'
      case 'moderator': return 'orange'
      default: return 'blue'
    }
  }

  const getExpProgress = (exp: number, level: number) => {
    // Simple progression: 100 exp per level
    const currentLevelExp = (level - 1) * 100
    const nextLevelExp = level * 100
    const progress = ((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  return (
    <Card w="full" maxW="md">
      <CardBody>
        <VStack spacing={6}>
          <VStack spacing={4}>
            <Avatar
              size="xl"
              src={user.avatar_url}
              name={user.username}
            />
            <VStack spacing={2}>
              <Heading size="lg">{user.username}</Heading>
              <Text color="gray.600">{user.email}</Text>
              <Badge colorScheme={getRoleColor(user.role)} size="lg">
                {user.role.toUpperCase()}
              </Badge>
            </VStack>
          </VStack>

          <Divider />

          <VStack spacing={4} w="full">
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold">Level {user.level}</Text>
              <Text color="gray.600">{user.exp} EXP</Text>
            </HStack>
            
            <Progress
              value={getExpProgress(user.exp, user.level)}
              colorScheme="blue"
              size="lg"
              w="full"
              borderRadius="md"
            />
            
            <Text fontSize="sm" color="gray.500">
              {user.exp - ((user.level - 1) * 100)} / {user.level * 100} EXP to next level
            </Text>
          </VStack>

          <Divider />

          <VStack spacing={2} w="full">
            <HStack justify="space-between" w="full">
              <Text>Status:</Text>
              <Badge colorScheme={user.is_active ? 'green' : 'red'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
            
            <HStack justify="space-between" w="full">
              <Text>Verified:</Text>
              <Badge colorScheme={user.is_verified ? 'green' : 'gray'}>
                {user.is_verified ? 'Yes' : 'No'}
              </Badge>
            </HStack>
          </VStack>

          <Button
            colorScheme="red"
            variant="outline"
            onClick={logout}
            w="full"
          >
            Logout
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}
