// src/lib/chakra-provider.tsx
'use client';
import { ChakraProvider } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider>{children}</ChakraProvider>; // ✅ No "value" needed
}
