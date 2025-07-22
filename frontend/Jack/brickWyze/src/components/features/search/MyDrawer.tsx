// src/components/features/search/MyDrawer.tsx - FIXED: No any types

'use client';

import {
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Flex, Box, Button, AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Text, VStack, HStack, Badge
} from '@chakra-ui/react';
import { useRef, useState, useCallback } from 'react';
import { SearchIcon } from '@chakra-ui/icons';
import type { FocusableElement } from '@chakra-ui/utils';

// ✅ FIXED: Use the correct store import pattern
import { useFilterStore, Weighting, Layer, FilterState } from '../../../stores/filterStore';
import WeightingPanel from '../filters/ScoreWeightingGroup/WeightingPanel';
import MyRangeSlider from '../../ui/MyRangeSlider';
import MyAgeSlider from '../filters/DemographicGroup/MyAgeSlider';
import MyIncomeSlider from '../filters/DemographicGroup/MyIncomeSlider';
import HierarchicalMultiSelect from '../filters/DemographicGroup/RaceDropDownGroup/HierarchicalMultiSelect';
import { ethnicityData } from '../filters/DemographicGroup/RaceDropDownGroup/ethnicityData';
import CancelResetButton from '../filters/ScoreWeightingGroup/CancelResetButton';
import GenderSelect from '../filters/DemographicGroup/GenderSelect';
import TimePeriodSelect from '../filters/ScoreWeightingGroup/TimePeriodSelect';
import TopNSelector from '../filters/ScoreWeightingGroup/TopNSelector';
import MyToolTip from '../../ui/MyToolTip';

// ✅ FIXED: Extended FilterState interface for submission data with topN
interface SubmissionData extends FilterState {
  topN: number;
}

// ✅ FIXED: Proper interface for search zone results instead of any
interface SearchZone {
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
  [key: string]: unknown;
}

// ✅ FIXED: Added search results interface with proper typing
interface SearchResults {
  zones: SearchZone[]; // ✅ FIXED: Use proper interface instead of any[]
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
}

interface MyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit: (filters: SubmissionData) => void;
  // ✅ FIXED: Add search results props
  searchResults?: SearchResults | null;
  isSearchLoading?: boolean;
}

const ALL_AVAILABLE_LAYERS: Layer[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', color: '#4299E1' },
  { id: 'demographic', label: 'Demographics', icon: '👥', color: '#48BB78' },
  { id: 'crime', label: 'Crime Score', icon: '🚨', color: '#E53E3E' },
  { id: 'flood_risk', label: 'Flood Risk', icon: '🌊', color: '#38B2AC' },
  { id: 'rent_score', label: 'Rent Score', icon: '💰', color: '#ED8936' },
  { id: 'poi', label: 'Points of Interest', icon: '📍', color: '#9F7AEA' },
];

export default function MyDrawer({ 
  isOpen, 
  onClose, 
  onSearchSubmit, 
  searchResults, 
  isSearchLoading = false 
}: MyDrawerProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  
  // ✅ FIXED: Get filter state and actions using the store pattern
  const state = useFilterStore();
  const activeWeights = state.weights;
  const rentRange = state.rentRange;
  const ageRange = state.ageRange;
  const incomeRange = state.incomeRange;
  const selectedEthnicities = state.selectedEthnicities;
  const selectedGenders = state.selectedGenders;
  const selectedTimePeriods = state.selectedTimePeriods;
  
  // ✅ FIXED: Get actions from the store
  const setFilters = state.setFilters;
  const updateWeight = state.updateWeight;
  const addWeight = state.addWeight;
  const removeWeight = state.removeWeight;
  const reset = state.reset;

  // ✅ Local state for UI
  const [topN, setTopN] = useState(10);
  const [isDemographicOpen, setIsDemographicOpen] = useState(false);
  const [isWeightingOpen, setIsWeightingOpen] = useState(false);
  const [_menuIsOpen, setMenuIsOpen] = useState(false);
  const [dropdownInput, setDropdownInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // ✅ Handler functions
  const handleWeightChangeEnd = useCallback((id: string, value: number) => {
    updateWeight(id, value);
  }, [updateWeight]);

  const handleAddWeight = useCallback((layer: Layer) => {
    addWeight(layer);
  }, [addWeight]);

  const handleRemoveWeight = useCallback((id: string) => {
    removeWeight(id);
  }, [removeWeight]);

  const handleRentRangeChange = useCallback((newVal: [number, number]) => setFilters({ rentRange: newVal }), [setFilters]);
  const handleAgeRangeChange = useCallback((newVal: [number, number]) => setFilters({ ageRange: newVal }), [setFilters]);
  const handleIncomeRangeChange = useCallback((newVal: [number, number]) => setFilters({ incomeRange: newVal }), [setFilters]);
  const handleGenderChange = useCallback((newVal: string[]) => setFilters({ selectedGenders: newVal }), [setFilters]);
  const handleEthnicityChange = useCallback((newVal: string[]) => setFilters({ selectedEthnicities: newVal }), [setFilters]);
  const handleTimePeriodChange = useCallback((newVal: string[]) => {
    console.log('🕐 [MyDrawer] Time period change:', newVal);
    setFilters({ selectedTimePeriods: newVal });
    
    // ✅ AUTO-SUBMIT: Trigger search when time periods change (like TopN does)
    const currentState = useFilterStore.getState();
    const submissionData: SubmissionData = {
      ...currentState,
      selectedTimePeriods: newVal, // Use the new time periods
      topN: topN
    };
    onSearchSubmit(submissionData);
  }, [setFilters, onSearchSubmit, topN]);

  // ✅ FIXED: Handle TopN changes and trigger search
  const handleTopNChange = useCallback((newValue: number) => {
    setTopN(newValue);
    
    // Auto-submit search when topN changes (with current filters)
    const currentState = useFilterStore.getState();
    const submissionData: SubmissionData = {
      ...currentState,
      topN: newValue
    };
    onSearchSubmit(submissionData);
  }, [onSearchSubmit]);

  const handleSubmit = () => {
    if (!selectedGenders.length) {
      alert('Please select at least one gender.');
      return;
    }
    
    // ✅ DEBUG: Log current state before submission
    const currentState = useFilterStore.getState();
    console.log('🔍 [MyDrawer] Current store state on search:', {
      selectedTimePeriods: currentState.selectedTimePeriods,
      storeState: currentState
    });
    
    const submissionData: SubmissionData = {
      ...currentState,
      topN: topN
    };
    
    // ✅ DEBUG: Log what we're actually sending
    console.log('📤 [MyDrawer] Submitting data:', {
      timePeriods: submissionData.selectedTimePeriods,
      topN: submissionData.topN,
      fullData: submissionData
    });
    
    onSearchSubmit(submissionData);
    onClose();
  };

  // ✅ Calculate total weight for debugging
  const totalWeight = activeWeights.reduce((sum, w) => sum + w.value, 0);

  return (
    <main>
      <Drawer 
        isOpen={isOpen} 
        onClose={onClose} 
        finalFocusRef={btnRef as unknown as React.RefObject<FocusableElement>} 
        placement="left" 
        size="md"
      >
        <DrawerOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
        <DrawerContent 
          bg="linear-gradient(135deg, #FFF5F5 0%, #FFEEE8 100%)"
          maxW="440px"
          boxShadow="2xl"
          display="flex" 
          flexDirection="column" 
          h="100%"
        >
          <DrawerCloseButton 
            color="#FF492C" 
            size="lg" 
            _hover={{ bg: 'rgba(255, 73, 44, 0.1)' }}
            borderRadius="full"
            top={6}
            right={4}
            zIndex={10}
          />
          
          <DrawerHeader 
            pb={4} 
            pt={6}
            bg="rgba(255, 255, 255, 0.9)"
            backdropFilter="blur(20px)"
            borderBottom="1px solid rgba(255, 73, 44, 0.1)"
          >
            <Text fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center">
              Search Filters
            </Text>
          </DrawerHeader>
          
          <DrawerBody 
            ref={drawerBodyRef} 
            overflowY="auto" 
            css={{ 
              '&::-webkit-scrollbar': { width: '8px' }, 
              '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' }, 
              '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px', '&:hover': { background: '#555' } } 
            }}
          >
            <VStack spacing={4} p={2} align="stretch">
              
              {/* Results Display - FIXED */}
              <Box 
                bg="rgba(255, 255, 255, 0.8)" 
                borderRadius="2xl" 
                p={4} 
                boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                <HStack spacing={3} mb={3}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    📊 Results Display
                  </Text>
                  <MyToolTip label="Results Display">
                    Control how many census tracts to display on the map. Lower percentages show fewer, higher-quality results for better performance.
                  </MyToolTip>
                </HStack>
                
                {/* ✅ FIXED: Use actual search results instead of hardcoded 310 */}
                <TopNSelector
                  value={topN}
                  onChange={handleTopNChange}
                  actualMatchingTracts={searchResults?.zones?.length}
                  totalTractsFound={searchResults?.total_zones_found}
                  isLoading={isSearchLoading}
                />
                
                {/* ✅ Debug info (optional - can remove in production) */}
                {searchResults && (
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Debug: {searchResults.zones?.length || 0} zones shown, {searchResults.total_zones_found || 0} total found
                  </Text>
                )}
              </Box>

              {/* Rent Range */}
              <Box 
                bg="rgba(255, 255, 255, 0.8)" 
                borderRadius="2xl" 
                p={4} 
                boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                <HStack spacing={3} mb={3}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    🏠 Rent Range
                  </Text>
                  <MyToolTip label="Rent Range">
                    Filter neighborhoods by average rent cost per square foot in USD. Adjust the range to find areas within your budget.
                  </MyToolTip>
                </HStack>
                
                <MyRangeSlider 
                  heading="" 
                  defaultRange={rentRange} 
                  onChangeEnd={handleRentRangeChange}
                />
              </Box>

              {/* Time Period Selection - NEW LOCATION */}
              <Box 
                bg="rgba(255, 255, 255, 0.8)" 
                borderRadius="2xl" 
                p={4} 
                boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                <HStack spacing={3} mb={3}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    🕐 Foot Traffic Timing
                  </Text>
                  <MyToolTip label="Foot Traffic Timing">
                    Select which time periods to analyze for foot traffic patterns. Choose morning, afternoon, or night to find areas busy during your preferred times.
                  </MyToolTip>
                </HStack>
                
                <TimePeriodSelect 
                  value={selectedTimePeriods}
                  onChange={handleTimePeriodChange}
                />
              </Box>
              
              {/* Demographics - COLLAPSIBLE */}
              <Box 
                bg="rgba(255, 255, 255, 0.8)" 
                borderRadius="2xl" 
                p={1} 
                boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                {/* Header */}
                <Flex
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  px={4}
                  py={4}
                  borderRadius="xl"
                  onClick={() => setIsDemographicOpen(!isDemographicOpen)}
                  _hover={{ bg: 'rgba(255, 73, 44, 0.05)' }}
                  transition="all 0.2s"
                >
                  <HStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      👥 Demographics
                    </Text>
                    {(selectedEthnicities?.length || 0) > 0 && (
                      <Badge bg="#FF492C" color="white" borderRadius="full">
                        {selectedEthnicities?.length}
                      </Badge>
                    )}
                  </HStack>
                  <Box
                    transform={isDemographicOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                    transition="transform 0.2s"
                  >
                    <Text fontSize="xl" color="#FF492C">▼</Text>
                  </Box>
                </Flex>

                {/* Content - Only show when expanded */}
                {isDemographicOpen && (
                  <VStack spacing={3} p={3} pt={0}>
                    <Box w="full">
                      <MyAgeSlider value={ageRange} onChangeEnd={handleAgeRangeChange} />
                    </Box>
                    
                    <Box w="full">
                      <MyIncomeSlider value={incomeRange} onChangeEnd={handleIncomeRangeChange} />
                    </Box>
                    
                    <Box 
                      bg="white" 
                      borderRadius="xl" 
                      p={4} 
                      w="full"
                      border="1px solid rgba(255, 73, 44, 0.1)"
                    >
                      <GenderSelect value={selectedGenders} onChange={handleGenderChange} />
                    </Box>
                    
                    <Box 
                      bg="white" 
                      borderRadius="xl" 
                      p={4} 
                      w="full"
                      border="1px solid rgba(255, 73, 44, 0.1)"
                    >
                      <HStack spacing={3} mb={3}>
                        <Text fontSize="md" fontWeight="bold" color="gray.800">
                          🌍 Select Ethnicities
                        </Text>
                        <MyToolTip label="Ethnicities">
                          Filter census tracts by ethnic composition. Select multiple ethnicities to find diverse neighborhoods that match your preferences.
                        </MyToolTip>
                      </HStack>
                      
                      <Box mt={2} ref={ethnicityRef} borderRadius="md" minHeight="60px">
                        <HierarchicalMultiSelect 
                          data={ethnicityData} 
                          label="Select Ethnicities" 
                          onChange={handleEthnicityChange} 
                          autoFocus={false} 
                          onMenuOpenChange={setMenuIsOpen} 
                          controlledInput={dropdownInput} 
                          setControlledInput={setDropdownInput} 
                          externalSelectedValues={selectedEthnicities} 
                          externalExpandedGroups={expandedGroups} 
                          setExternalExpandedGroups={setExpandedGroups} 
                          setMenuIsOpenExternal={setMenuIsOpen} 
                          selectWrapperRef={selectWrapperRef}
                        />
                      </Box>
                      {_menuIsOpen && <Box h="280px" />}
                    </Box>
                  </VStack>
                )}
              </Box>
              
              {/* Score Weighting - COLLAPSIBLE */}
              <Box 
                bg="rgba(255, 255, 255, 0.8)" 
                borderRadius="2xl" 
                p={1} 
                boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
                border="1px solid rgba(255, 255, 255, 0.3)"
                backdropFilter="blur(10px)"
              >
                {/* Header */}
                <Flex
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  px={4}
                  py={4}
                  borderRadius="xl"
                  onClick={() => setIsWeightingOpen(!isWeightingOpen)}
                  _hover={{ bg: 'rgba(255, 73, 44, 0.05)' }}
                  transition="all 0.2s"
                >
                  <HStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      ⚖️ Score Weighting
                    </Text>
                    <MyToolTip label="Score Weighting">
                      Adjust the importance of different factors when ranking neighborhoods. Higher percentages mean that factor has more influence on the results.
                    </MyToolTip>
                  </HStack>
                  <Box
                    transform={isWeightingOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                    transition="transform 0.2s"
                  >
                    <Text fontSize="xl" color="#FF492C">▼</Text>
                  </Box>
                </Flex>

                {/* Content - Only show when expanded */}
                {isWeightingOpen && (
                  <VStack spacing={3} p={3} pt={0}>
                    {/* Total weight indicator for debugging */}
                    <Box w="full" bg="gray.50" p={3} borderRadius="lg">
                      <Text fontSize="sm" color="gray.600" textAlign="center" fontWeight="medium">
                        Total Weight: {totalWeight}%
                        {totalWeight !== 100 && (
                          <Text as="span" color="red.500" ml={2} fontWeight="bold">
                            ⚠️ Should be 100%
                          </Text>
                        )}
                        {totalWeight === 100 && (
                          <Text as="span" color="green.500" ml={2}>
                            ✅
                          </Text>
                        )}
                      </Text>
                    </Box>
                    
                    <Box 
                      bg="white" 
                      borderRadius="xl" 
                      p={4} 
                      w="full"
                      border="1px solid rgba(255, 73, 44, 0.1)"
                    >
                      <WeightingPanel 
                        activeWeights={activeWeights} 
                        inactiveLayers={ALL_AVAILABLE_LAYERS.filter((layer: Layer) => !activeWeights.some((active: Weighting) => active.id === layer.id))} 
                        onSliderChangeEnd={handleWeightChangeEnd} 
                        onRemove={handleRemoveWeight} 
                        onAdd={handleAddWeight}
                      />
                      <Flex justify="center" w="100%" mt={4}>
                        <Button 
                          size="sm" 
                          bg="gray.600" 
                          color="white" 
                          _hover={{ bg: "gray.700" }} 
                          _active={{ bg: "gray.800" }} 
                          borderRadius="md" 
                          px={4} 
                          py={2} 
                          onClick={() => setIsResetDialogOpen(true)}
                        >
                          Reset Weights to Default
                        </Button>
                      </Flex>
                    </Box>
                  </VStack>
                )}
              </Box>
            </VStack>
          </DrawerBody>
          
          {/* Footer */}
          <Box 
            p={5} 
            bg="rgba(255, 255, 255, 0.95)" 
            backdropFilter="blur(20px)"
            borderTop="1px solid rgba(255, 73, 44, 0.1)"
            position="sticky" 
            bottom="0" 
            zIndex="sticky"
          >
            <Flex justify="center">
              <Button
                bg="linear-gradient(135deg, #FF492C, #FF6B47)"
                color="white"
                size="lg"
                borderRadius="xl"
                _hover={{ 
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 25px rgba(255, 73, 44, 0.3)"
                }}
                _active={{ 
                  transform: "translateY(0px)"
                }}
                onClick={handleSubmit}
                fontWeight="bold"
                leftIcon={<SearchIcon />}
                transition="all 0.2s"
                boxShadow="0 4px 15px rgba(255, 73, 44, 0.2)"
                h="50px"
                px={8}
                isLoading={isSearchLoading}
                loadingText="Searching..."
              >
                Search
              </Button>
            </Flex>
          </Box>
        </DrawerContent>
      </Drawer>
      
      {/* Reset Dialog */}
      <AlertDialog 
        isOpen={isResetDialogOpen} 
        leastDestructiveRef={cancelRef as unknown as React.RefObject<FocusableElement>} 
        onClose={() => setIsResetDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reset Weightings
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to reset all weightings to their default values? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <CancelResetButton ref={cancelRef} onClick={() => setIsResetDialogOpen(false)} />
              <Button 
                colorScheme="red" 
                onClick={() => { 
                  reset(); 
                  setIsResetDialogOpen(false); 
                }} 
                ml={3}
              >
                Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </main>
  );
}