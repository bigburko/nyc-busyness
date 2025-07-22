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
import { useActiveFilters } from '@/hooks/useActiveFilters';
import { useFilterStore, FilterState } from '@/stores/filterStore';
import { useGeminiStore } from '@/stores/geminiStore';
import ChatInputPanel from './ChatInputPanel';
import TractResultsContainer from './TractResultsContainer';
import MyDrawer from '@/components/features/search/MyDrawer';

const UI_MARGIN = 16;
const SIDE_PANEL_WIDTH = 485;
const MOBILE_SIDE_PANEL_WIDTH = '95vw';
const SEARCH_BAR_WIDTH = 450;
const MOBILE_SEARCH_BAR_WIDTH = '90vw';

interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
  [key: string]: unknown;
}

interface SubmissionData extends FilterState {
  topN?: number;
}

// 🔧 FIX: Import the exact interface from page.tsx to avoid conflicts
interface MapSearchResult {
  geoid: string;
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  custom_score: number;
  resilience_score?: number;
  avg_rent?: number;
  demographic_score?: number;
  foot_traffic_score?: number;
  crime_score?: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  foot_traffic_timeline_metadata?: Record<string, unknown>;
  crime_timeline_metadata?: Record<string, unknown>;
  foot_traffic_periods_used?: string[];
  [key: string]: unknown;
}

// 🔧 FIX: Match the exact EdgeFunctionResponse from page.tsx
interface EdgeFunctionResponse {
  zones: MapSearchResult[]; // Use MapSearchResult[], not TractResult[]
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
  demographic_scoring_applied?: boolean;
  foot_traffic_periods_used?: string[];
  debug?: Record<string, unknown>;
}

interface TopLeftUIProps {
  onFilterUpdate: (filters: SubmissionData) => void;
  searchResults?: TractResult[];
  onMapTractSelect?: (tractId: string | null) => void;
  selectedTract?: TractResult;
  onClearSelectedTract?: () => void;
  // 🔧 FIX: Match the exact type from page.tsx (EdgeFunctionResponse | null)
  fullSearchResponse?: EdgeFunctionResponse | null;
  isSearchLoading?: boolean;
}

export default function TopLeftUI({ 
  onFilterUpdate, 
  searchResults = [],
  onMapTractSelect,
  selectedTract,
  onClearSelectedTract,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fullSearchResponse: _fullSearchResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSearchLoading: _isSearchLoading
}: TopLeftUIProps) {
  const viewState = useUiStore(s => s.viewState);
  const { isOpen: isFilterDrawerOpen, onOpen: openFilterDrawer, onClose: closeFilterDrawer } = useDisclosure();
  const [isInResultsFlow, setIsInResultsFlow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [lastSearchSummary, setLastSearchSummary] = useState('');
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const activeFilterCount = useActiveFilters();
  const { reset } = useFilterStore();
  const { resetChat } = useGeminiStore();

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

  const handleFilterSearch = (filters: SubmissionData) => {
    console.log('🔍 [TopLeftUI] Received filters, passing to page:', filters);
    
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

  const handleClose = () => {
    uiStore.setState({ viewState: 'initial' });
    setIsInResultsFlow(false);
    setLastSearchSummary('');
  };

  const handleResetRequest = () => {
    setIsResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    reset();
    resetChat();
    setLastSearchSummary('');
    const currentState = useFilterStore.getState();
    const formattedFilters: SubmissionData = {
      ...currentState,
      topN: 10
    };
    onFilterUpdate(formattedFilters);
    setIsResetDialogOpen(false);
  };

  const handleResultsPanelClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('[role="button"]') || 
                         target.closest('input') ||
                         target.closest('[data-tract-card]');
    
    if (!isInteractive && viewState === 'typing') {
      console.log('📋 [TopLeftUI] Results panel clicked - closing chat input');
      if (window.resetToInitialView) {
        window.resetToInitialView();
      }
    }
  };

  const SearchBar = () => (
    <Box
      position="absolute"
      top={`${UI_MARGIN}px`}
      left={`${UI_MARGIN}px`}
      zIndex={1300}
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
      <SearchBar />

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
          pointerEvents="auto"
          borderRight="1px solid rgba(0,0,0,0.1)"
          transform={showResultsPanel ? "translateX(0)" : "translateX(-100%)"}
          transition="transform 300ms ease-out"
          onClick={handleResultsPanelClick}
          cursor="default"
        >
          <VStack
            align="stretch"
            spacing={0}
            h="100%"
            overflowY="hidden"
            pointerEvents="auto"
          >
            <Flex 
              align="center" 
              px={4} 
              pb={3} 
              borderBottom="1px solid" 
              borderColor="gray.200"
              onClick={(e) => {
                if (viewState === 'typing') {
                  e.stopPropagation();
                  if (window.resetToInitialView) {
                    window.resetToInitialView();
                  }
                }
              }}
            >
              <Text fontSize="lg" fontWeight="semibold">
                Results ({searchResults.length})
              </Text>
              {viewState === 'typing' && (
                <Text fontSize="xs" color="gray.400" ml="auto">
                  Click to close chat
                </Text>
              )}
            </Flex>
            
            <Box flex="1" overflow="hidden">
              <TractResultsContainer 
                searchResults={searchResults}
                onMapTractSelect={onMapTractSelect}
                selectedTract={selectedTract}
                onClearSelectedTract={onClearSelectedTract}
              />
            </Box>
          </VStack>
        </Box>
      )}

      <MyDrawer
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onSearchSubmit={handleFilterSearch}
      />

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