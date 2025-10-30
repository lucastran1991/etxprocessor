'use client'

import { useEffect, useRef, useState } from 'react'
import { StatNumber } from '@chakra-ui/react'
import { useInView } from 'framer-motion'

interface AnimatedStatProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
}

export default function AnimatedStat({ 
  value, 
  duration = 2000, 
  decimals = 0,
  suffix = '',
  prefix = ''
}: AnimatedStatProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const end = value
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value, isInView, duration])

  const displayValue = decimals > 0 
    ? count.toFixed(decimals)
    : Math.floor(count)

  return (
    <StatNumber ref={ref}>
      {prefix}{displayValue}{suffix}
    </StatNumber>
  )
}

