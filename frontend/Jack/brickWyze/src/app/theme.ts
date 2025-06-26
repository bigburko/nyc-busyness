// src/lib/theme.ts
import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',  // 👈 Force light mode
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

export default theme;
