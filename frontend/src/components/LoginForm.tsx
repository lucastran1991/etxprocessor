'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
  Checkbox,
  Link,
  Text
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { slideIn, fadeIn } from '@/utils/animations'

interface LoginFormData {
  username: string
  password: string
  remember: boolean
}

interface LoginFormProps {
  showRegisterLink?: boolean
}

export default function LoginForm({ showRegisterLink = true }: LoginFormProps) {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      await login(data.username, data.password, data.remember)
      router.push('/')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4}>
          <AnimatePresence>
            {error && (
              <motion.div
                variants={slideIn}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ width: '100%' }}
              >
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <FormControl isInvalid={!!errors.username}>
            <FormLabel>Username or Email</FormLabel>
            <Input
              type="text"
              {...register('username', { required: 'Username is required' })}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
              }}
              transition="all 0.3s ease"
            />
            <AnimatePresence>
              {errors.username && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.username.message}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', { required: 'Password is required' })}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
              }}
              transition="all 0.3s ease"
            />
            <AnimatePresence>
              {errors.password && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.password.message}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </FormControl>

          <FormControl>
            <Checkbox {...register('remember')}>
              Remember me
            </Checkbox>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            w="full"
            isLoading={isLoading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>

          {showRegisterLink && (
            <Text>
              Don't have an account?{' '}
              <Link href="/register" color="blue.500">
                Register here
              </Link>
            </Text>
          )}
        </VStack>
      </form>
    </Box>
  )
}
