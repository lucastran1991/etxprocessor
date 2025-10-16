'use client'

import {
  Box,
  VStack,
  IconButton,
  useColorModeValue,
  useDisclosure,
  Link as ChakraLink,
  useColorMode,
  Avatar,
  MenuList,
  MenuItem,
  Menu,
  MenuButton,
} from '@chakra-ui/react';
import { FaRegFileAlt, FaUserCircle } from 'react-icons/fa';
import { MdOutlineSpaceDashboard, MdLogin } from 'react-icons/md';
import { RiHome2Line } from 'react-icons/ri';
import { IoIosCog } from 'react-icons/io';
import { GrAction } from 'react-icons/gr';
import { CgProfile } from 'react-icons/cg';
import { SlNotebook } from 'react-icons/sl';

import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { useAuth } from '@/hooks/useAuth';
import { Image } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'
import { getImageUrl } from '@/utils/imageUrl';

interface NavItemProps {
  href: string;
  icon: typeof FaUserCircle;
  children: React.ReactNode;
  isOpen: boolean;
  boxSize: string;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, isOpen, boxSize }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <ChakraLink
      as={Link}
      href={href}
      display="flex"
      alignItems="center"
      p={4}
      w="full"
      _hover={{ textDecoration: 'none', bg: useColorModeValue('brand.400', 'gray.900') }}
      bg={isActive ? useColorModeValue('brand.600', 'whiteAlpha.200') : 'transparent'}
      color={isActive ? useColorModeValue('whiteAlpha.900', 'brand.200') : undefined}
      fontWeight={isActive ? 'bold' : 'normal'}
    >
      {icon && <Box as={icon} boxSize={boxSize} mr={isOpen ? 4 : 0} />}
      {isOpen && children}
    </ChakraLink>
  );
};

const Sidebar = () => {
  const { colorMode, toggleColorMode } = useColorMode();  // Make sure toggleColorMode is available
  const { user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      h="full"
      w={isOpen ? '250px' : '60px'}
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      zIndex="sticky"
      boxShadow="base"
      overflowY="auto"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      transition="width 0.2s ease"
    >
      <VStack spacing={4} py={4} alignItems="center">
        <Image src="/favicon.svg" alt="Logo" boxSize="32px" />
      </VStack>
      <VStack pt={4} spacing={0} justifyContent="center" alignItems="flex-start" flexGrow={1} w="full">
        {user ? <UserMenuItems isOpen={isOpen} /> : <GuestMenuItems isOpen={isOpen} />}
      </VStack>
      <VStack position="absolute" bottom="0" w="full" py={4}>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          variant="ghost"
        />
        {user && (
          <Box display="flex" alignItems="center" mb={4}>
            <Menu>
              <MenuButton
                as={Box}
                cursor="pointer"
                display="flex"
                alignItems="center"
              >
                <Avatar
                  size={isOpen ? 'lg' : 'sm'}
                  name={user.username}
                  src={getImageUrl(user.avatar_url)}                  
                />
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => logout()}>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

const UserMenuItems: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <>
    <NavItem href="/dashboard" icon={MdOutlineSpaceDashboard} isOpen={isOpen} boxSize="28px">Dashboard</NavItem>
    <NavItem href="/config" icon={IoIosCog} isOpen={isOpen} boxSize="28px">Configuration</NavItem>
    <NavItem href="/files" icon={FaRegFileAlt} isOpen={isOpen} boxSize="28px">My Files</NavItem>
    <NavItem href="/processing" icon={GrAction} isOpen={isOpen} boxSize="28px">Processing</NavItem>
    <NavItem href="/profile" icon={CgProfile} isOpen={isOpen} boxSize="28px">Profile</NavItem>
  </>
);

const GuestMenuItems: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <>
    <NavItem href="/login" icon={MdLogin} isOpen={isOpen} boxSize="28px">Login</NavItem>
    <NavItem href="/register" icon={SlNotebook} isOpen={isOpen} boxSize="28px">Register</NavItem>
  </>
);

export default Sidebar;
