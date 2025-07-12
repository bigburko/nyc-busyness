import { extendTheme, theme as baseTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  ...baseTheme,
  config,
  styles: {
    global: {
      body: {
        bg: '#FFDED8',
        color: 'gray.800',
      },
    },
  },
  colors: {
    ...baseTheme.colors, // explicitly provide base colors
  },
  semanticTokens: {
    colors: {
      text: {
        default: 'gray.800',
        _dark: 'whiteAlpha.900',
      },
      background: {
        default: '#FFDED8',
        _dark: 'gray.800',
      },
    },
  },
});

export default theme;
