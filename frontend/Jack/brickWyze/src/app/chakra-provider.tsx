// src/lib/chakra-provider.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import { emotionCache } from './emotionCache';
import theme from './theme'; // 👈 import theme

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider theme={theme}> {/* 👈 apply it here */}
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
