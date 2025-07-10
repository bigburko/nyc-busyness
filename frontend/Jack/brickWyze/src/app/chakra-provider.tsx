// src/lib/chakra-provider.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import { emotionCache } from './emotionCache';
import theme from './theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
