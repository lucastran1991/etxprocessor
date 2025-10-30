import { UseToastOptions } from '@chakra-ui/react'

export const createToast = (options: UseToastOptions): UseToastOptions => ({
  position: 'top-right',
  isClosable: true,
  duration: 3000,
  containerStyle: {
    borderRadius: 'xl',
    boxShadow: 'lg',
  },
  ...options,
})

export const successToast = (title: string, description?: string): UseToastOptions => 
  createToast({
    title,
    description,
    status: 'success',
  })

export const errorToast = (title: string, description?: string): UseToastOptions => 
  createToast({
    title,
    description,
    status: 'error',
    duration: 5000,
  })

export const warningToast = (title: string, description?: string): UseToastOptions => 
  createToast({
    title,
    description,
    status: 'warning',
  })

export const infoToast = (title: string, description?: string): UseToastOptions => 
  createToast({
    title,
    description,
    status: 'info',
  })

