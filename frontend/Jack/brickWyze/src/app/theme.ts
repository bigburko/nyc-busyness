// src/lib/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',  // 👈 Force light mode
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: '#FFDED8',       // 👈 match your drawer's light pink background
        color: 'gray.800',   // 👈 ensure all text is dark and visible
      },
    },
  },
});

export default theme;
