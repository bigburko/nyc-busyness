'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, useDisclosure, Divider, Slide, VStack, Flex, Text, Input, Button, IconButton, Badge } from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { FiSliders } from 'react-icons/fi';
import { uiStore, useUiStore } from '@/stores/uiStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useActiveFilters } from '@/hooks/useActiveFilters';
import ChatInputPanel from './ChatInputPanel';
import Sidepanel from './SidePanel';
import MyDrawer from '@/components/features/search/MyDrawer'; // ✅ Full path

const UI_MARGIN = 16;
const SIDE_PANEL_WIDTH = 520; // ✅ Increased from 420 to 520
const MOBILE_SIDE_PANEL_WIDTH = '95vw';
const SEARCH_BAR_WIDTH = 520; // ✅ Match sidepanel width
const MOBILE_SEARCH_BAR_WIDTH = '90vw';

interface TopLeftUIProps {
  onFilterUpdate: (filters: any) => void;
}

export default function TopLeftUI({ onFilterUpdate }: TopLeftUIProps) {
  const viewState = useUiStore(s => s.viewState);
  const { isOpen: isFilterDrawerOpen, onOpen: openFilterDrawer, onClose: closeFilterDrawer } = useDisclosure();
  const [isInResultsFlow, setIsInResultsFlow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  
  // ✅ Get active filter count
  const activeFilterCount = useActiveFilters();

  // ✅ Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (viewState === 'results') setIsInResultsFlow(true);
    else if (viewState === 'initial') setIsInResultsFlow(false);
  }, [viewState]);

  const handleOutsideClick = () => {
    if (viewState === 'typing' && !isFilterDrawerOpen) {
      uiStore.setState({ viewState: isInResultsFlow ? 'results' : 'initial' });
    }
  };

  useClickOutside(searchAreaRef as any, handleOutsideClick);

  const handleFilterSearch = (filters: any) => {
    console.log('🔍 [TopLeftUI] Received filters, passing to page:', filters);
    uiStore.setState({ viewState: 'results' });
    onFilterUpdate(filters);
  };

  const handleInputClick = () => {
    uiStore.setState({ viewState: 'typing' });
  };

  // ✅ Close panel and reset to initial state
  const handleClose = () => {
    uiStore.setState({ viewState: 'initial' });
    setIsInResultsFlow(false);
  };

  // ✅ Search bar component - stays in same position always
  const SearchBar = () => (
    <Box
      position="absolute"
      top={`${UI_MARGIN}px`}
      left={`${UI_MARGIN}px`}
      zIndex={1000} // ✅ LOWERED: Below drawer (drawer overlay is 1999, content is 2000)
      bg="white"
      boxShadow="lg"
      borderRadius="xl"
      overflow="hidden"
      width={{ base: MOBILE_SEARCH_BAR_WIDTH, md: `${SEARCH_BAR_WIDTH}px` }} // ✅ Increased width
      maxWidth="95vw"
      ref={searchAreaRef}
    >
      <Flex align="center" px={3} py={2} gap={2} width="100%">
        <Box position="relative">
          <Button
            leftIcon={<FiSliders />}
            onClick={openFilterDrawer}
            variant="solid"
            size="sm"
            borderRadius="full"
            fontWeight="medium"
            bg={activeFilterCount > 0 ? "#FF492C" : "gray.100"}
            color={activeFilterCount > 0 ? "white" : "gray.600"}
            _hover={{ 
              bg: activeFilterCount > 0 ? "#E53E3E" : "gray.200" 
            }}
            _active={{
              bg: activeFilterCount > 0 ? "#C53030" : "gray.300"
            }}
            border={activeFilterCount > 0 ? "2px solid #FF492C" : "2px solid transparent"}
            boxShadow={activeFilterCount > 0 ? "0 0 0 1px rgba(255, 73, 44, 0.3)" : "none"}
          >
            Filters
          </Button>
          {activeFilterCount > 0 && (
            <Badge
              position="absolute"
              top="-4px"
              right="-4px"
              bg="#E53E3E"
              color="white"
              borderRadius="full"
              fontSize="xs"
              minW="20px"
              h="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              border="2px solid white"
              boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Box>
        <Input
          placeholder="Ask Bricky about NYC neighborhoods..."
          onClick={handleInputClick}
          cursor="pointer"
          bg="transparent"
          border="none"
          _focus={{ outline: 'none' }}
          _placeholder={{ color: 'gray.500' }}
          flex="1"
          readOnly
        />
        <IconButton
          aria-label={isInResultsFlow ? "Close" : "Search"}
          icon={isInResultsFlow ? <CloseIcon /> : <SearchIcon />}
          variant="ghost"
          size="sm"
          borderRadius="full"
          onClick={isInResultsFlow ? handleClose : handleInputClick}
        />
      </Flex>

      {/* ✅ Chat panel - expands below search bar */}
      <Box
        height={viewState === 'typing' ? 'auto' : '0px'}
        opacity={viewState === 'typing' ? 1 : 0}
        overflow="hidden"
        transition="opacity 150ms ease-out, height 150ms ease-out"
      >
        <Divider />
        <Box 
          transform={viewState === 'typing' ? 'translateY(0)' : 'translateY(-5px)'}
          transition="transform 150ms ease-out"
        >
          <ChatInputPanel onSearchSubmit={handleFilterSearch} />
        </Box>
      </Box>
    </Box>
  );

  const showResultsPanel = viewState === 'results' || (isInResultsFlow && viewState === 'typing');

  return (
    <>
      {/* ✅ Search bar always stays in same position */}
      <SearchBar />

      {/* ✅ Results panel slides in from left, below search bar */}
      {showResultsPanel && (
        <Slide in={true} direction="left">
          <Box
            position="absolute"
            top="0"
            left="0"
            h="100vh"
            width={isMobile ? MOBILE_SIDE_PANEL_WIDTH : `${SIDE_PANEL_WIDTH}px`} // ✅ Reduced width
            bg="white"
            boxShadow="xl"
            pt="120px" // Space for search bar
            zIndex={1200} // ✅ Lower than search bar, allows map clicks outside
            pointerEvents="auto"
            borderRight="1px solid rgba(0,0,0,0.1)"
          >
            <VStack
              align="stretch"
              spacing={0}
              h="100%"
              overflowY="auto"
              pointerEvents="auto"
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
      )}

      {/* ✅ Drawer - Chakra handles overlay automatically */}
      <MyDrawer
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onSearchSubmit={handleFilterSearch}
      />
    </>
  );
}