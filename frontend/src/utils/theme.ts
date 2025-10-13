import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  colors: {
    brand: {
      50: '#eef4ff',
      100: '#d9e5ff',
      200: '#b9cfff',
      300: '#92b6ff',
      400: '#6a9cff',
      500: '#4f86ff',
      600: '#3e6de0',
      700: '#3359b8',
      800: '#2a4791',
      900: '#21376f',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props: any) => ({
      'html, body': { bg: mode('gray.50', 'gray.900')(props), color: mode('gray.800', 'gray.100')(props) },
    }),
  },
  components: {
    Button: {
      baseStyle: { borderRadius: 'full', fontWeight: 'semibold' },
      variants: {
        solid: {
          bgGradient: 'linear(to-r, brand.500, brand.600)',
          color: 'white',
          _hover: { bgGradient: 'linear(to-r, brand.600, brand.700)', boxShadow: 'md' },
          _active: { bg: 'brand.700' },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.600',
          _hover: { bg: 'brand.50' },
        },
        ghost: {
          color: 'brand.600',
          _hover: { bg: 'brand.50' },
        },
      },
      defaultProps: { colorScheme: 'brand' },
    },
    Input: {
      baseStyle: { field: { borderRadius: 'full' } },
      variants: {
        outline: { field: { _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(79,134,255,0.3)' } } },
        filled: { field: { borderRadius: 'full', _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(79,134,255,0.3)' } } },
      },
    },
    Select: {
      baseStyle: { field: { borderRadius: 'full' } },
      variants: { outline: { field: { _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(79,134,255,0.3)' } } } },
    },
    Textarea: {
      baseStyle: { borderRadius: 'lg' },
      variants: { outline: { _focusVisible: { borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(79,134,255,0.3)' } } },
    },
    Tabs: {
      baseStyle: { tab: { borderRadius: 'full', fontWeight: 'semibold' } },
      variants: {
        softRounded: { tab: { _selected: { bg: 'brand.500', color: 'white' } } },
        line: { tab: { _selected: { color: 'brand.600', borderColor: 'brand.600' } } },
      },
      defaultProps: { variant: 'softRounded', colorScheme: 'brand' },
    },
    Progress: {
      baseStyle: { track: { borderRadius: 'full' }, filledTrack: { borderRadius: 'full' } },
      defaultProps: { colorScheme: 'brand' },
    },
    Slider: {
      baseStyle: (props: any) => ({
        track: { bg: mode('gray.200', 'gray.700')(props) },
        filledTrack: { bg: 'brand.500' },
        thumb: { bg: 'white', border: '2px solid', borderColor: 'brand.500' },
      }),
    },
    Checkbox: { baseStyle: { control: { _checked: { bg: 'brand.500', borderColor: 'brand.500' } } } },
    Radio: { baseStyle: { control: { _checked: { bg: 'brand.500', borderColor: 'brand.500' } } } },
    Switch: { baseStyle: { track: { _checked: { bg: 'brand.500' } } } },
    Badge: { baseStyle: { borderRadius: 'full', px: 2 }, variants: { solid: { bg: 'brand.500', color: 'white' }, subtle: { bg: 'brand.50', color: 'brand.700' } } },
    Tag: { baseStyle: { borderRadius: 'full' }, variants: { solid: { container: { bg: 'brand.500', color: 'white' } } } },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: mode('gray.200', 'gray.700')(props),
          boxShadow: 'sm',
          bg: mode('white', 'gray.800')(props),
        },
      }),
    },
    Menu: {
      baseStyle: (props: any) => ({
        item: { _hover: { bg: mode('brand.50', 'whiteAlpha.100')(props) } },
      }),
    },
  },
})

export default theme
