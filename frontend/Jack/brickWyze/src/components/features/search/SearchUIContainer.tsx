// src/components/features/search/SearchUIContainer.tsx
'use client';

import { Box, VStack } from '@chakra-ui/react';
import { useUiStore } from '@/stores/uiStore';
import TopSearchBar from './TopSearchBar';
import SidePanel from './SidePanel';

export default function SearchUIContainer() {
  const { isResultsPanelOpen } = useUiStore();

  return (
    <Box
      position="absolute"
      top="16px"
      left="16px"
      h="calc(100vh - 32px)"
      w="400px"
      zIndex="overlay"
      transition="transform 0.3s ease-in-out"
      transform={isResultsPanelOpen ? 'translateX(0%)' : 'translateX(calc(-100% - 16px))'}
      pointerEvents={isResultsPanelOpen ? 'auto' : 'none'}
      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
    >
        <VStack spacing={3} align="stretch" h="100%">
          <TopSearchBar />
          <SidePanel />
        </VStack>
    </Box>
  );
}