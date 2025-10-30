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
      'html, body': { 
        bg: mode(
          'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)'
        )(props),
        bgAttachment: 'fixed',
        color: mode('gray.800', 'gray.100')(props),
        position: 'relative',
        _before: {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: mode(
            'radial-gradient(circle at 20% 50%, rgba(79,134,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(79,134,255,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(79,134,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(79,134,255,0.12) 0%, transparent 50%)'
          )(props),
          pointerEvents: 'none',
          zIndex: 0,
        },
      },
      '*': {
        position: 'relative',
        zIndex: 1,
      },
    }),
  },
  components: {
    Button: {
      baseStyle: { 
        borderRadius: 'full', 
        fontWeight: 'semibold',
        transition: 'all 0.3s ease',
        _focus: {
          boxShadow: '0 0 0 3px rgba(79,134,255,0.4)',
          outline: 'none',
        },
        _focusVisible: {
          boxShadow: '0 0 0 3px rgba(79,134,255,0.4)',
          outline: '2px solid',
          outlineColor: 'brand.500',
          outlineOffset: '2px',
        },
      },
      variants: {
        solid: {
          bgGradient: 'linear(to-r, brand.500, brand.600)',
          color: 'white',
          _hover: { 
            bgGradient: 'linear(to-r, brand.600, brand.700)', 
            boxShadow: 'lg',
            transform: 'translateY(-1px)',
            willChange: 'transform',
          },
          _active: { 
            bg: 'brand.700',
            transform: 'scale(0.98)',
          },
          _disabled: {
            opacity: 0.5,
            cursor: 'not-allowed',
            _hover: {
              transform: 'none',
            },
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.600',
          _hover: { 
            bg: 'brand.50',
            boxShadow: 'md',
            transform: 'translateY(-1px)',
            willChange: 'transform',
          },
          _active: {
            transform: 'scale(0.98)',
          },
        },
        ghost: {
          color: 'brand.600',
          _hover: { 
            bg: 'brand.50',
            transform: 'translateY(-1px)',
            willChange: 'transform',
          },
          _active: {
            transform: 'scale(0.98)',
          },
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
      baseStyle: { 
        field: { 
          borderRadius: 'full',
          transition: 'all 0.3s ease',
        },
      },
      variants: { 
        outline: { 
          field: { 
            _focusVisible: { 
              borderColor: 'brand.500', 
              boxShadow: '0 0 0 3px rgba(79,134,255,0.3)',
            },
            _hover: {
              borderColor: 'brand.400',
            },
          },
        },
      },
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
      baseStyle: { 
        track: { 
          borderRadius: 'full',
          transition: 'all 0.3s ease',
        }, 
        filledTrack: { 
          borderRadius: 'full',
          transition: 'width 0.6s ease',
          willChange: 'width',
        },
      },
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
    Badge: { 
      baseStyle: { 
        borderRadius: 'full', 
        px: 2,
        boxShadow: 'sm',
      }, 
      variants: { 
        solid: { 
          bg: 'brand.500', 
          color: 'white',
          boxShadow: 'md',
        }, 
        subtle: { 
          bg: 'brand.50', 
          color: 'brand.700',
        },
        pulse: {
          bg: 'brand.500',
          color: 'white',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          boxShadow: 'md',
        },
      } 
    },
    Tag: { baseStyle: { borderRadius: 'full' }, variants: { solid: { container: { bg: 'brand.500', color: 'white' } } } },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          borderRadius: 'xl',
          borderWidth: '1px',
          borderColor: mode('gray.200', 'gray.700')(props),
          boxShadow: 'sm',
          bg: mode('white', 'gray.800')(props),
          transition: 'all 0.3s ease',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow: mode('xl', '2xl')(props),
            borderColor: mode('brand.300', 'brand.500')(props),
            willChange: 'transform',
          },
          _active: {
            transform: 'translateY(-2px) scale(0.99)',
          },
          _focus: {
            boxShadow: '0 0 0 3px rgba(79,134,255,0.2)',
            outline: 'none',
          },
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
