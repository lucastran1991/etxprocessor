'use client'

import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
} from '@chakra-ui/react'

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'table' | 'stat'
  count?: number
  height?: string
}

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  height,
}: SkeletonLoaderProps) {
  if (type === 'stat') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} borderRadius="xl">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Skeleton height="16px" width="60%" />
                <Skeleton height="32px" width="40%" />
                <Skeleton height="12px" width="80%" />
              </VStack>
            </CardBody>
          </Card>
        ))}
      </>
    )
  }

  if (type === 'list') {
    return (
      <VStack align="stretch" spacing={2}>
        {Array.from({ length: count }).map((_, i) => (
          <HStack key={i} spacing={3}>
            <SkeletonCircle size="10" />
            <SkeletonText flex={1} noOfLines={1} spacing="2" />
          </HStack>
        ))}
      </VStack>
    )
  }

  if (type === 'table') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, i) => (
          <HStack key={i} spacing={4} py={2}>
            <Skeleton height="20px" flex={1} />
            <Skeleton height="20px" flex={1} />
            <Skeleton height="20px" flex={1} />
          </HStack>
        ))}
      </Box>
    )
  }

  // Default: card
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} borderRadius="xl" height={height}>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <Skeleton height="20px" width="80%" />
              <SkeletonText noOfLines={3} spacing="2" />
            </VStack>
          </CardBody>
        </Card>
      ))}
    </>
  )
}

