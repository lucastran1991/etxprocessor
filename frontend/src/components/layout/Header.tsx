'use client'

import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Link as ChakraLink
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, SunIcon, MoonIcon } from '@chakra-ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getImageUrl } from '@/utils/imageUrl'
import { useColorMode } from '@chakra-ui/react'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const { colorMode, toggleColorMode } = useColorMode()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const pathname = usePathname()
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
    const hoverBg = useColorModeValue('gray.200', 'gray.700')
    const activeBg = useColorModeValue('brand.50', 'whiteAlpha.200')
    const activeColor = useColorModeValue('brand.700', 'brand.200')
    return (
      <ChakraLink
        as={Link}
        href={href}
        px={4}
        py={2}
        rounded="lg"
        color={isActive ? activeColor : undefined}
        bg={isActive ? activeBg : 'transparent'}
        fontWeight={isActive ? 'semibold' : 'normal'}
        _hover={{ textDecoration: 'none', bg: hoverBg, rounded: 'lg' }}
      >
        {children}
      </ChakraLink>
    )
  }

  const MobileNav = () => (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Menu</DrawerHeader>
        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {/* Home hidden */}
            {user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/config">Config</NavLink>
                <NavLink href="/files">Files</NavLink>
                <NavLink href="/processing">Processing</NavLink>
                <NavLink href="/profile">Profile</NavLink>
                <Button onClick={toggleColorMode} variant="outline">
                  {colorMode === 'light' ? 'Dark mode' : 'Light mode'}
                </Button>
                <Button onClick={handleLogout} colorScheme="red" variant="outline">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink href="/login">Login</NavLink>
                <NavLink href="/register">Register</NavLink>
                <Button onClick={toggleColorMode} variant="outline">
                  {colorMode === 'light' ? 'Dark mode' : 'Light mode'}
                </Button>
              </>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )

  return (
    <Box
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex
        h={16}
        alignItems="center"
        justifyContent="space-between"
        px={4}
        maxW="7xl"
        mx="auto"
      >
        {/* Logo */}
        <Flex alignItems="center">
          <ChakraLink as={Link} href="/" _hover={{ textDecoration: 'none' }}>
            <Heading as="h1" size="md" color="brand.500">
              ETX Processor
            </Heading>
          </ChakraLink>
        </Flex>

        {/* Desktop Navigation */}
        <Flex alignItems="center" display={{ base: 'none', md: 'flex' }}>
          <HStack spacing={8}>
            {/* Home hidden */}
            {user ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/config">Config</NavLink>
                <NavLink href="/files">Files</NavLink>
                <NavLink href="/processing">Processing</NavLink>
                <NavLink href="/profile">Profile</NavLink>
                <IconButton
                  aria-label="Toggle color mode"
                  onClick={toggleColorMode}
                  variant="ghost"
                  icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                />
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded="full"
                    variant="link"
                    cursor="pointer"
                    minW={0}
                  >
                    <Avatar size="sm" name={user.username} src={getImageUrl(user.avatar_url)} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Text fontWeight="bold">{user.username}</Text>
                    </MenuItem>
                    <MenuDivider />
                    {/* <MenuItem onClick={() => router.push('/profile')}>
                      Profile
                    </MenuItem> */}
                    <MenuItem onClick={handleLogout} color="red.500">
                      <Text fontWeight="bold">Logout</Text>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <NavLink href="/login">Login</NavLink>
                <NavLink href="/register">Register</NavLink>
                <IconButton
                  aria-label="Toggle color mode"
                  onClick={toggleColorMode}
                  variant="ghost"
                  icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                />
              </>
            )}
          </HStack>
        </Flex>

        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="Open menu"
          icon={<HamburgerIcon />}
        />
      </Flex>

      <MobileNav />
    </Box>
  )
}
