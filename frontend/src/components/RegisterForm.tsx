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
  Text,
  Select
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { slideIn, fadeIn } from '@/utils/animations'

interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  terms: boolean
  role: string
  avatar?: string
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

    // Generate a random number between 1 and 8 (assuming there are 8 avatars)
    const randomAvatarNumber = Math.floor(Math.random() * 8) + 1
    data.avatar = `/avatars/avatar${randomAvatarNumber}.png`
    
    try {
      if (!data.terms) {
        setError('You must accept the terms and conditions')
        return
      }
      await registerUser(data.username, data.email, data.password, data.role, data.avatar)
      router.push('/login')
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box w="full" maxW="md">
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
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              {...register('username', { 
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' }
              })}
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
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
              }}
              transition="all 0.3s ease"
            />
            <AnimatePresence>
              {errors.email && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.email.message}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </FormControl>

          <FormControl>
            <FormLabel>Role</FormLabel>
            <Select 
              defaultValue="user" 
              {...register('role')}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
              }}
              transition="all 0.3s ease"
            >
              <option value="devops">Devops</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="qa">QA</option>
              {/* <option value="nguoi-qua-duong">Người qua đường</option>
              <option value="di-tre">Đi trễ</option>
              <option value="ve-som">Về sớm</option>
              <option value="bao-hai-team">Báo hại team</option>
              <option value="nguoi-yeu-meo">Người yêu mèo nhưng chỉ nuôi chó</option>
              <option value="nguoi-choc-cho">Người chọc chó</option>
              <option value="cho">Chó</option>
              <option value="dan-choi-exciter">Dân chơi Exciter</option>
              <option value="phong-lon-club">Phóng lợn club 1h sáng quảng trường 2/9</option>
              <option value="nguoi-an-kem">Người ăn kem nhưng mãi không trúng thưởng</option>
              <option value="mukbang">Dân chơi mukbang đồ Office</option> */}
              {/* <option value="admin">Admin</option> */}
            </Select>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
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

          <FormControl isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
              }}
              transition="all 0.3s ease"
            />
            <AnimatePresence>
              {errors.confirmPassword && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.confirmPassword.message}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </FormControl>

          <FormControl isInvalid={!!errors.terms}>
            <Checkbox {...register('terms', { required: 'You must accept the terms' })}>
              I agree to the terms and conditions
            </Checkbox>
            <AnimatePresence>
              {errors.terms && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.terms.message}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
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
