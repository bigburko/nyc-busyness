'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, useDisclosure, Divider, VStack, Flex, Text, Input, Button, IconButton, Badge,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Portal
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { FiSliders } from 'react-icons/fi';
import { uiStore, useUiStore } from '@/stores/uiStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterStore } from '@/stores/filterStore';
import { useGeminiStore } from '@/stores/geminiStore';
import ChatInputPanel from './ChatInputPanel';
import TractResultsContainer from './TractResultsContainer'; // ✅ NEW: Import new component
import MyDrawer from '@/components/features/search/MyDrawer';

const UI_MARGIN = 16;
const SIDE_PANEL_WIDTH = 485;
const MOBILE_SIDE_PANEL_WIDTH = '95vw';
const SEARCH_BAR_WIDTH = 450;
const MOBILE_SEARCH_BAR_WIDTH = '90vw';

interface TopLeftUIProps {
  onFilterUpdate: (filters: any) => void;
  searchResults?: any[]; // ✅ NEW: Add search results prop
  onMapTractSelect?: (tractId: string | null) => void; // ✅ NEW: Add map highlight callback
  selectedTract?: any; // ✅ NEW: Selected tract from map clicks
}

export default function TopLeftUI({ 
  onFilterUpdate, 
  searchResults = [], // ✅ NEW: Default to empty array
  onMapTractSelect, // ✅ NEW: Map highlighting function
  selectedTract // ✅ NEW: Selected tract object
}: TopLeftUIProps) {
  const viewState = useUiStore(s => s.viewState);
  const { isOpen: isFilterDrawerOpen, onOpen: openFilterDrawer, onClose: closeFilterDrawer } = useDisclosure();
  const [isInResultsFlow, setIsInResultsFlow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [lastSearchSummary, setLastSearchSummary] = useState(''); // ✅ Track search summary
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // ✅ Get active filter count
  const activeFilterCount = useActiveFilters();
  
  // ✅ Get store methods for reset
  const { reset } = useFilterStore();
  const { resetChat } = useGeminiStore();

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
    // ✅ Don't close if reset dialog is open
    if (isResetDialogOpen) return;
    
    if (viewState === 'typing' && !isFilterDrawerOpen) {
      uiStore.setState({ viewState: isInResultsFlow ? 'results' : 'initial' });
    }
  };

  useClickOutside(searchAreaRef as any, handleOutsideClick);

  const handleFilterSearch = (filters: any) => {
    console.log('🔍 [TopLeftUI] Received filters, passing to page:', filters);
    
    // ✅ Generate search summary including topN info
    const currentState = useFilterStore.getState();
    let summary = '';
    
    if (currentState.weights && currentState.weights.length > 0) {
      const topWeight = currentState.weights.reduce((max, w) => w.value > max.value ? w : max);
      summary = `Prioritizing ${topWeight.label} (${topWeight.value}%)`;
    } else {
      summary = 'Searching NYC neighborhoods';
    }
    
    if (currentState.selectedEthnicities && currentState.selectedEthnicities.length > 0) {
      summary += ` • ${currentState.selectedEthnicities[0]} areas`;
    }
    
    // ✅ NEW: Add topN info to summary
    if (filters.topN) {
      const tractCount = Math.ceil(310 * (filters.topN / 100));
      summary += ` • Top ${filters.topN}% (${tractCount} tracts)`;
    }
    
    setLastSearchSummary(summary);
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
    setLastSearchSummary(''); // ✅ Clear summary when closing
  };

  // ✅ Handle reset confirmation
  const handleResetRequest = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    reset();
    resetChat();
    setLastSearchSummary(''); // ✅ Clear summary on reset
    const currentState = useFilterStore.getState();
    const formattedFilters = {
      weights: currentState.weights || [],
      rentRange: currentState.rentRange || [26, 160],
      selectedEthnicities: currentState.selectedEthnicities || [],
      selectedGenders: currentState.selectedGenders || ['male', 'female'],
      ageRange: currentState.ageRange || [0, 100],
      incomeRange: currentState.incomeRange || [0, 250000],
    };
    onFilterUpdate(formattedFilters);
    setIsResetDialogOpen(false);
  };

  // ✅ Search bar component - stays in same position always
  const SearchBar = () => (
    <Box
      position="absolute"
      top={`${UI_MARGIN}px`}
      left={`${UI_MARGIN}px`}
      zIndex={1300} // ✅ Higher than results panel (1200)
      bg="#FFF5F5"
      boxShadow="lg"
      borderRadius="xl"
      overflow="hidden"
      width={{ base: MOBILE_SEARCH_BAR_WIDTH, md: `${SEARCH_BAR_WIDTH}px` }}
      maxWidth="95vw"
      ref={searchAreaRef}
      border="1px solid rgba(255, 73, 44, 0.2)"
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
            bg={activeFilterCount > 0 ? "#FF492C" : "gray.600"}
            color={activeFilterCount > 0 ? "white" : "white"}
            _hover={{ 
              bg: activeFilterCount > 0 ? "#E53E3E" : "gray.700" 
            }}
            _active={{
              bg: activeFilterCount > 0 ? "#C53030" : "gray.800"
            }}
            border={activeFilterCount > 0 ? "2px solid #FF492C" : "2px solid transparent"}
            boxShadow={activeFilterCount > 0 ? "0 0 0 1px rgba(255, 73, 44, 0.3)" : "md"}
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
          placeholder={
            lastSearchSummary 
              ? lastSearchSummary 
              : "Ask Bricky about NYC neighborhoods..."
          }
          onClick={handleInputClick}
          cursor="pointer"
          bg="transparent"
          border="none"
          _focus={{ outline: 'none' }}
          _placeholder={{ 
            color: lastSearchSummary ? 'gray.700' : 'gray.500',
            fontWeight: lastSearchSummary ? 'medium' : 'normal'
          }}
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
          <ChatInputPanel 
            onSearchSubmit={handleFilterSearch}
            onResetRequest={handleResetRequest}
          />
        </Box>
      </Box>
    </Box>
  );

  const showResultsPanel = viewState === 'results' || (isInResultsFlow && viewState === 'typing');

  return (
    <>
      {/* ✅ Search bar always stays in same position */}
      <SearchBar />

      {/* ✅ Results panel with NEW TractResultsContainer */}
      {showResultsPanel && (
        <Box
          position="absolute"
          top="0"
          left="0"
          h="100vh"
          width={isMobile ? MOBILE_SIDE_PANEL_WIDTH : `${SIDE_PANEL_WIDTH}px`}
          bg="white"
          boxShadow="xl"
          pt="120px"
          zIndex={1200}
          pointerEvents="auto" // ✅ Panel itself captures clicks
          borderRight="1px solid rgba(0,0,0,0.1)"
          transform={showResultsPanel ? "translateX(0)" : "translateX(-100%)"}
          transition="transform 300ms ease-out"
        >
          <VStack
            align="stretch"
            spacing={0}
            h="100%"
            overflowY="hidden" // ✅ CHANGED: Let TractResultsContainer handle scrolling
            pointerEvents="auto"
          >
            {/* ✅ OPTIONAL: Keep results header or remove it */}
            <Flex align="center" px={4} pb={3} borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="semibold">
                Results ({searchResults.length})
              </Text>
            </Flex>
            
            {/* ✅ NEW: Replace SidePanel with TractResultsContainer */}
            <Box flex="1" overflow="hidden">
              <TractResultsContainer 
                searchResults={searchResults}
                onMapTractSelect={onMapTractSelect}
                selectedTract={selectedTract} // ✅ NEW: Pass selected tract
              />
            </Box>
          </VStack>
        </Box>
      )}

      {/* ✅ Drawer - Chakra handles overlay automatically */}
      <MyDrawer
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onSearchSubmit={handleFilterSearch}
      />

      {/* ✅ Reset Confirmation Dialog - In Portal to avoid click conflicts */}
      <Portal>
        <AlertDialog
          isOpen={isResetDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsResetDialogOpen(false)}
          closeOnOverlayClick={false}
        >
          <AlertDialogOverlay
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <AlertDialogContent
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Reset All Filters & Chat
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to reset all filters to their default values and clear the chat history? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button 
                  ref={cancelRef} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsResetDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmReset();
                  }} 
                  ml={3}
                >
                  Reset Everything
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Portal>
    </>
  );
}