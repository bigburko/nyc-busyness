'use client';

import { Box, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useUiStore, uiStore } from '@/stores/uiStore';
import TopSearchBar from './TopSearchBar';
import SidePanel from './SidePanel';

// NEW: Extend global window interface for this file
declare global {
  interface Window {
    closeResultsPanel?: () => void;
    resetToInitialView?: () => void;
  }
}

export default function SearchUIContainer() {
  const viewState = useUiStore((s) => s.viewState);
  const isResultsPanelOpen = viewState === 'results';

  // NEW: Expose comprehensive UI reset functions globally
  useEffect(() => {
    // Close just the results panel
    window.closeResultsPanel = () => {
      console.log('❌ [SearchUIContainer] Closing results panel from map click');
      uiStore.getState().closeResultsPanel();
    };
    
    // NEW: Reset entire UI to initial state (closes everything)
    window.resetToInitialView = () => {
      console.log('🔄 [SearchUIContainer] Resetting UI to initial view from map click');
      uiStore.getState().clearSearch(); // This sets viewState to 'initial'
    };
    
    return () => {
      delete window.closeResultsPanel;
      delete window.resetToInitialView;
    };
  }, []);

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
        <TopSearchBar
          onFilterClick={() => {
            console.log('Open filter drawer here');
          }}
        />
        <SidePanel />
      </VStack>
    </Box>
  );
}