'use client'

import { Icon, Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ReactElement } from 'react'

interface RotatingIconProps {
  icon: ReactElement | any
  isRotating?: boolean
  speed?: string
  boxSize?: string | number
  color?: string
}

export function RotatingIcon({ 
  icon, 
  isRotating = true, 
  speed = '2s',
  boxSize,
  color 
}: RotatingIconProps) {
  return (
    <Box
      as={motion.div}
      animate={isRotating ? { rotate: 360 } : { rotate: 0 }}
      transition={{
        duration: parseFloat(speed),
        repeat: isRotating ? Infinity : 0,
        ease: 'linear',
      }}
    >
      <Icon as={icon} boxSize={boxSize} color={color} />
    </Box>
  )
}

interface PulsingIconProps {
  icon: ReactElement | any
  isPulsing?: boolean
  boxSize?: string | number
  color?: string
}

export function PulsingIcon({ 
  icon, 
  isPulsing = true,
  boxSize,
  color 
}: PulsingIconProps) {
  return (
    <Box
      as={motion.div}
      animate={isPulsing ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: isPulsing ? Infinity : 0,
        ease: 'easeInOut',
      }}
    >
      <Icon as={icon} boxSize={boxSize} color={color} />
    </Box>
  )
}

interface HoverRotateIconProps {
  icon: ReactElement | any
  boxSize?: string | number
  color?: string
  rotation?: number
}

export function HoverRotateIcon({ 
  icon, 
  boxSize,
  color,
  rotation = 15
}: HoverRotateIconProps) {
  return (
    <Box
      as={motion.div}
      whileHover={{ rotate: rotation }}
      transition={{ duration: 0.2 }}
      display="inline-flex"
    >
      <Icon as={icon} boxSize={boxSize} color={color} />
    </Box>
  )
}

