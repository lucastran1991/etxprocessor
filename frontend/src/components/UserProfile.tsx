'use client'

import { useState } from 'react'
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
import AvatarUpload from './AvatarUpload'
import { getImageUrl } from '@/utils/imageUrl'

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

export default function UserProfile({ user: initialUser }: UserProfileProps) {
  const { logout, updateUserAvatar } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialUser.avatar_url)

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

  const handleAvatarUpdate = (newUrl: string | null) => {
    setAvatarUrl(newUrl || undefined)
    updateUserAvatar(newUrl || undefined)
  }

  return (
    <Card w="full" maxW="md">
      <CardBody>
        <VStack spacing={6}>
          <VStack spacing={4}>
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              username={initialUser.username}
              onAvatarUpdate={handleAvatarUpdate}
            />
            <VStack spacing={2}>
              <Heading size="lg">{initialUser.username}</Heading>
              <Text color="gray.600">{initialUser.email}</Text>
              <Badge colorScheme={getRoleColor(initialUser.role)} size="lg">
                {initialUser.role.toUpperCase()}
              </Badge>
            </VStack>
          </VStack>

          <Divider />

          <VStack spacing={4} w="full">
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold">Level {initialUser.level}</Text>
              <Text color="gray.600">{initialUser.exp} EXP</Text>
            </HStack>
            
            <Progress
              value={getExpProgress(initialUser.exp, initialUser.level)}
              colorScheme="blue"
              size="lg"
              w="full"
              borderRadius="md"
            />
            
            <Text fontSize="sm" color="gray.500">
              {initialUser.exp - ((initialUser.level - 1) * 100)} / {initialUser.level * 100} EXP to next level
            </Text>
          </VStack>

          <Divider />

          <VStack spacing={2} w="full">
            <HStack justify="space-between" w="full">
              <Text>Status:</Text>
              <Badge colorScheme={initialUser.is_active ? 'green' : 'red'}>
                {initialUser.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
            
            <HStack justify="space-between" w="full">
              <Text>Verified:</Text>
              <Badge colorScheme={initialUser.is_verified ? 'green' : 'gray'}>
                {initialUser.is_verified ? 'Yes' : 'No'}
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
