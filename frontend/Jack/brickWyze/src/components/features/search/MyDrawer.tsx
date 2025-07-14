// src/components/features/search/MyDrawer.tsx

'use client';

import {
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Flex, Box, Button, Text, VStack, HStack, Divider, Badge
} from '@chakra-ui/react';
import { useRef, useState, useCallback } from 'react';
import { SearchIcon, CheckIcon } from '@chakra-ui/icons';
import { FiTrendingUp, FiSettings } from 'react-icons/fi';
import type { FocusableElement } from '@chakra-ui/utils';

import { useFilterStore, FilterState, INITIAL_WEIGHTS, Weighting, Layer } from '../../../stores/filterStore';
import WeightingPanel from '../filters/ScoreWeightingGroup/WeightingPanel';
import MyRangeSlider from '../../ui/MyRangeSlider';
import MyAgeSlider from '../filters/DemographicGroup/MyAgeSlider';
import MyIncomeSlider from '../filters/DemographicGroup/MyIncomeSlider';
import HierarchicalMultiSelect from '../filters/DemographicGroup/RaceDropDownGroup/HierarchicalMultiSelect';
import { ethnicityData } from '../filters/DemographicGroup/RaceDropDownGroup/ethnicityData';
import CancelResetButton from '../filters/ScoreWeightingGroup/CancelResetButton';
import GenderSelect from '../filters/DemographicGroup/GenderSelect';
import TopNSelector from '../filters/ScoreWeightingGroup/TopNSelector';

interface MyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchSubmit: (filters: any) => void;
}

const ALL_AVAILABLE_LAYERS: Layer[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', color: '#4299E1' },
  { id: 'demographic', label: 'Demographics', icon: '👥', color: '#48BB78' },
  { id: 'crime', label: 'Crime Score', icon: '🚨', color: '#E53E3E' },
  { id: 'flood_risk', label: 'Flood Risk', icon: '🌊', color: '#38B2AC' },
  { id: 'rent_score', label: 'Rent Score', icon: '💰', color: '#ED8936' },
  { id: 'poi', label: 'Points of Interest', icon: '📍', color: '#9F7AEA' },
];

export default function MyDrawer({ isOpen, onClose, onSearchSubmit }: MyDrawerProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  
  // ✅ Get filter state
  const activeWeights = useFilterStore((state: FilterState) => state.weights);
  const rentRange = useFilterStore((state: FilterState) => state.rentRange);
  const ageRange = useFilterStore((state: FilterState) => state.ageRange);
  const incomeRange = useFilterStore((state: FilterState) => state.incomeRange);
  const selectedEthnicities = useFilterStore((state: FilterState) => state.selectedEthnicities);
  const selectedGenders = useFilterStore((state: FilterState) => state.selectedGenders);
  const setFilters = useFilterStore((state: FilterState) => state.setFilters);
  const updateWeight = useFilterStore((state: FilterState) => state.updateWeight);

  // ✅ Local state for topN
  const [topN, setTopN] = useState(10);
  const [isDemographicOpen, setIsDemographicOpen] = useState(false);
  const [isWeightingOpen, setIsWeightingOpen] = useState(false);

  // ✅ Handler functions for weights
  const handleWeightChangeEnd = useCallback((id: string, value: number) => {
    updateWeight(id, value);
  }, [updateWeight]);

  const handleAddWeight = useCallback((layer: Layer) => {
    const newWeight: Weighting = { ...layer, value: 15 };
    const updatedWeights = [...activeWeights, newWeight];
    setFilters({ weights: updatedWeights });
  }, [activeWeights, setFilters]);

  const handleRemoveWeight = useCallback((id: string) => {
    const updatedWeights = activeWeights.filter((w: Weighting) => w.id !== id);
    setFilters({ weights: updatedWeights });
  }, [activeWeights, setFilters]);

  // ✅ Handler functions for other filters
  const handleRentRangeChange = useCallback((newVal: [number, number]) => {
    setFilters({ rentRange: newVal });
  }, [setFilters]);

  const handleAgeRangeChange = useCallback((newVal: [number, number]) => {
    setFilters({ ageRange: newVal });
  }, [setFilters]);

  const handleIncomeRangeChange = useCallback((newVal: [number, number]) => {
    setFilters({ incomeRange: newVal });
  }, [setFilters]);

  const handleGenderChange = useCallback((newVal: string[]) => {
    setFilters({ selectedGenders: newVal });
  }, [setFilters]);

  const handleEthnicityChange = useCallback((newVal: string[]) => {
    setFilters({ selectedEthnicities: newVal });
  }, [setFilters]);

  const handleReset = useCallback(() => {
    setFilters({ weights: INITIAL_WEIGHTS });
    setTopN(10);
  }, [setFilters]);

  const handleSubmit = () => {
    if (!selectedGenders.length) {
      alert('Please select at least one gender.');
      return;
    }
    
    const currentState = useFilterStore.getState();
    const submissionData = {
      weights: currentState.weights,
      rentRange: currentState.rentRange,
      selectedEthnicities: currentState.selectedEthnicities,
      selectedGenders: currentState.selectedGenders,
      ageRange: currentState.ageRange,
      incomeRange: currentState.incomeRange,
      topN: topN
    };
    
    console.log('🔍 [MyDrawer] Submitting with topN:', topN, submissionData);
    onSearchSubmit(submissionData);
    onClose();
  };

  // ✅ Calculate active filters for visual feedback
  const activeFilterCount = (selectedEthnicities?.length || 0) + (activeWeights?.length || 0);

  return (
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
      >
        {/* ✅ Simplified Header */}
        <DrawerHeader 
          pb={4} 
          pt={6}
          bg="rgba(255, 255, 255, 0.9)"
          backdropFilter="blur(20px)"
          borderBottom="1px solid rgba(255, 73, 44, 0.1)"
        >
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              Search Filters
            </Text>
            {activeFilterCount > 0 && (
              <Badge 
                bg="#FF492C" 
                color="white" 
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
              >
                {activeFilterCount} active filters
              </Badge>
            )}
          </VStack>
        </DrawerHeader>
        
        <DrawerCloseButton 
          color="#FF492C" 
          size="lg" 
          _hover={{ bg: 'rgba(255, 73, 44, 0.1)' }}
          borderRadius="full"
          top={6}
          right={4}
        />

        {/* ✅ Body with updated components */}
        <DrawerBody p={0} bg="transparent">
          <VStack spacing={4} p={2} align="stretch">
            
            {/* ✅ Results Display Section - Updated TopNSelector */}
            <Box 
              bg="rgba(255, 255, 255, 0.8)" 
              borderRadius="2xl" 
              p={4} 
              mx={1}
              boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
              border="1px solid rgba(255, 255, 255, 0.3)"
              backdropFilter="blur(10px)"
            >
              <TopNSelector
                value={topN}
                onChange={setTopN}
                estimatedTotalTracts={310}
              />
            </Box>

            {/* ✅ Rent Range Section - No tooltip */}
            <Box 
              bg="rgba(255, 255, 255, 0.8)" 
              borderRadius="2xl" 
              p={4} 
              mx={1}
              boxShadow="0 4px 20px rgba(255, 73, 44, 0.08)"
              border="1px solid rgba(255, 255, 255, 0.3)"
              backdropFilter="blur(10px)"
            >
              <HStack spacing={3} mb={3}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  🏠 Rent Range
                </Text>
              </HStack>
              <MyRangeSlider 
                heading="" 
                defaultRange={rentRange} 
                onChangeEnd={handleRentRangeChange}
              />
            </Box>

            {/* ✅ Demographics Section */}
            <Box 
              bg="rgba(255, 255, 255, 0.8)" 
              borderRadius="2xl" 
              p={1} 
              mx={1}
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

              {/* Content - Updated sliders */}
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
                    <Text fontSize="sm" fontWeight="bold" mb={3} color="gray.800">
                      🌍 Select Ethnicities
                    </Text>
                    <HierarchicalMultiSelect
                      data={ethnicityData}
                      label="Select Ethnicities"
                      onChange={handleEthnicityChange}
                      autoFocus={false}
                      controlledInput=""
                      setControlledInput={() => {}}
                      externalSelectedValues={selectedEthnicities}
                      externalExpandedGroups={new Set()}
                      setExternalExpandedGroups={() => {}}
                      setMenuIsOpenExternal={() => {}}
                    />
                  </Box>
                </VStack>
              )}
            </Box>

            {/* ✅ Weighting Section */}
            <Box 
              bg="rgba(255, 255, 255, 0.8)" 
              borderRadius="2xl" 
              p={1} 
              mx={1}
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
                  {(activeWeights?.length || 0) > 0 && (
                    <Badge bg="#FF492C" color="white" borderRadius="full">
                      {activeWeights?.length}
                    </Badge>
                  )}
                </HStack>
                <Box
                  transform={isWeightingOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                  transition="transform 0.2s"
                >
                  <Text fontSize="xl" color="#FF492C">▼</Text>
                </Box>
              </Flex>

              {/* Content */}
              {isWeightingOpen && (
                <VStack spacing={3} p={3} pt={0}>
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
                    
                    {/* ✅ Reset Weights Button */}
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
                        onClick={() => setFilters({ weights: INITIAL_WEIGHTS })}
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

        {/* ✅ Footer */}
        <Box 
          p={5} 
          bg="rgba(255, 255, 255, 0.95)" 
          backdropFilter="blur(20px)"
          borderTop="1px solid rgba(255, 73, 44, 0.1)"
        >
          <VStack spacing={3}>
            {/* Action Buttons */}
            <HStack spacing={3} w="full">
              <Button
                size="md"
                bg="gray.600"
                color="white"
                _hover={{ bg: "gray.700" }}
                _active={{ bg: "gray.800" }}
                borderRadius="lg"
                px={4}
                py={2}
                onClick={handleReset}
              >
                Reset
              </Button>
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
                flex="1"
                fontWeight="bold"
                leftIcon={<SearchIcon />}
                transition="all 0.2s"
                boxShadow="0 4px 15px rgba(255, 73, 44, 0.2)"
                h="50px"
              >
                Search Neighborhoods
              </Button>
            </HStack>

            {/* Status Info */}
            <HStack spacing={2} justify="center" opacity={0.7}>
              <CheckIcon boxSize={3} color="#FF492C" />
              <Text fontSize="xs" color="gray.600">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active • Top {topN}% results
              </Text>
            </HStack>
          </VStack>
        </Box>
      </DrawerContent>
    </Drawer>
  );
}