import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#ffeaea',
      100: '#ffcaca',
      200: '#ffabab',
      300: '#ff8c8c',
      400: '#ff6d6d',
      500: '#ff5252', // red-pink accent
      600: '#e64545',
      700: '#bf3838',
      800: '#992c2c',
      900: '#731f1f',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})

export default theme
