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
  Text
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  terms: boolean
}

export default function RegisterForm() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const router = useRouter()
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>()
  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      await registerUser(data.username, data.email, data.password)
      router.push('/login')
    } catch (err) {
      setError('Registration failed. Please try again.')
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
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              {...register('username', { 
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' }
              })}
            />
            {errors.username && (
              <Text color="red.500" fontSize="sm">
                {errors.username.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <Text color="red.500" fontSize="sm">
                {errors.email.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />
            {errors.password && (
              <Text color="red.500" fontSize="sm">
                {errors.password.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && (
              <Text color="red.500" fontSize="sm">
                {errors.confirmPassword.message}
              </Text>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.terms}>
            <Checkbox {...register('terms', { required: 'You must accept the terms' })}>
              I agree to the terms and conditions
            </Checkbox>
            {errors.terms && (
              <Text color="red.500" fontSize="sm">
                {errors.terms.message}
              </Text>
            )}
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            w="full"
            isLoading={isLoading}
            loadingText="Creating account..."
          >
            Create Account
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
