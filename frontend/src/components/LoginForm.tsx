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
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

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
      await login(data.username, data.password)
      router.push('/')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="full" maxW="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4}>
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl isInvalid={!!errors.username}>
            <FormLabel>Username or Email</FormLabel>
            <Input
              type="text"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && (
              <Text color="red.500" fontSize="sm">
                {errors.username.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <Text color="red.500" fontSize="sm">
                {errors.password.message}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <Checkbox {...register('remember')}>
              Remember me
            </Checkbox>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
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
