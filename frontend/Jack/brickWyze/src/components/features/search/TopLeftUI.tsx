// src/components/features/search/TopLeftUI.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Collapse, useDisclosure, Divider, Slide, VStack, Flex, Text } from '@chakra-ui/react';
import { useUiStore } from '@/stores/uiStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import TopSearchBar from './TopSearchBar';
import ChatInputPanel from './ChatInputPanel';
import Sidepanel from './SidePanel';
import MyDrawer from './MyDrawer';

const UI_MARGIN = 16;
const SIDE_PANEL_WIDTH = 313;
// ✅ CORE FIX 1: Define a fixed height for the search area when it's expanded.
// This is the key to making the layout stable.
const EXPANDED_SEARCH_AREA_HEIGHT = 130; // Adjust this value if you change padding/font size

export default function TopLeftUI() {
  const { viewState } = useUiStore();
  const { isOpen: isFilterDrawerOpen, onOpen: openFilterDrawer, onClose: closeFilterDrawer } = useDisclosure();
  const [isInResultsFlow, setIsInResultsFlow] = useState(false);
  
  // The ref is now only for the click-outside logic
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewState === 'results') setIsInResultsFlow(true);
    else if (viewState === 'initial') setIsInResultsFlow(false);
  }, [viewState]);

  const handleOutsideClick = () => {
    if (viewState === 'typing' && !isFilterDrawerOpen) {
      useUiStore.setState({ viewState: isInResultsFlow ? 'results' : 'initial' });
    }
  };
  
  useClickOutside(searchAreaRef as any, handleOutsideClick);

  const showResultsPanel = viewState === 'results' || (isInResultsFlow && viewState === 'typing');
  const isTypingForFirstTime = viewState === 'typing' && !isInResultsFlow;

  const handleFilterSearch = (filters: any) => {
    console.log("Searching with filters:", filters);
    useUiStore.setState({ viewState: 'results' });
  };

  return (
    <>
      <Box position="absolute" top={0} left={0} zIndex={1400}>
        {showResultsPanel ? (
          <Slide in={true} direction="left" style={{ position: 'relative', width: `${SIDE_PANEL_WIDTH}px` }}>
            {/* The main panel has a relative position to anchor the absolute search bar */}
            <Box h="100vh" w="100%" bg="white" boxShadow="xl" position="relative">
              
              {/* 1. The Search Bar is absolutely positioned on top. It will OVERLAY the content below. */}
              <Box
                ref={searchAreaRef}
                position="absolute"
                top={0} left={0} right={0}
                zIndex={10}
                p={4}
                bg="white"
                borderBottomWidth="1px"
                borderColor="gray.200"
              >
                <Box
                  boxShadow="md"
                  borderRadius={viewState === 'typing' ? 'xl' : 'full'}
                  transition="border-radius 0.2s ease-in-out"
                  overflow="hidden"
                  bg="white"
                >
                  <TopSearchBar onFilterClick={openFilterDrawer} isResultsViewActive={true} />
                  <Collapse in={viewState === 'typing'} animateOpacity>
                    <Divider />
                    <ChatInputPanel />
                  </Collapse>
                </Box>
              </Box>

              {/* ✅ CORE FIX 2: The results list container is completely static. */}
              {/* Its padding-top is a FIXED value, ensuring it NEVER moves. */}
              <VStack
                align="stretch"
                spacing={0}
                h="100%"
                overflowY="auto"
                // This padding creates permanent space at the top. When the search bar is small, this
                // space is visible. When it expands, it fills this exact space.
                pt={`${EXPANDED_SEARCH_AREA_HEIGHT}px`}
              >
                <Flex align="center" px={4} pb={3}>
                  <Text fontSize="lg" fontWeight="semibold">Results</Text>
                </Flex>
                <Box flex="1" px={4} pb={4}>
                  <Sidepanel />
                </Box>
              </VStack>

            </Box>
          </Slide>
        ) : (
          <Box p={`${UI_MARGIN}px`} ref={searchAreaRef}>
            <Box
              bg="white"
              boxShadow="lg"
              borderRadius={isTypingForFirstTime ? 'xl' : 'full'}
              transition="border-radius 0.2s ease-in-out"
              overflow="hidden"
            >
              <TopSearchBar onFilterClick={openFilterDrawer} isResultsViewActive={false} />
              <Collapse in={isTypingForFirstTime} animateOpacity>
                <Divider />
                <ChatInputPanel />
              </Collapse>
            </Box>
          </Box>
        )}
      </Box>

      <Box position="relative" zIndex={2000}>
        <MyDrawer
          isOpen={isFilterDrawerOpen}
          onClose={closeFilterDrawer}
          onSearchSubmit={handleFilterSearch}
        />
      </Box>
    </>
  );
}