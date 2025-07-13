// src/components/DrawerGroup/MyDrawer.tsx

'use client';

import {
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton,
  Flex, Box, Button, AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';
import { useRef, useState, useCallback } from 'react';
import { SearchIcon } from '@chakra-ui/icons';
import type { FocusableElement } from '@chakra-ui/utils';

// We NO LONGER need 'shallow'
import { useFilterStore, INITIAL_WEIGHTS, Weighting, Layer, FilterState } from '../../../stores/filterStore';

import WeightingPanel from '../filters/ScoreWeightingGroup/WeightingPanel';
import MyRangeSlider from '../../ui/MyRangeSlider';
import MyAgeSlider from '../filters/DemographicGroup/MyAgeSlider';
import MyIncomeSlider from '../filters/DemographicGroup/MyIncomeSlider';
import HierarchicalMultiSelect from '../filters/DemographicGroup/RaceDropDownGroup/HierarchicalMultiSelect';
import { ethnicityData } from '../filters/DemographicGroup/RaceDropDownGroup/ethnicityData';
import CancelResetButton from '../filters/ScoreWeightingGroup/CancelResetButton';
import GenderSelect from '../filters/DemographicGroup/GenderSelect';
import CollapsibleSection from '../../ui/CollapsibleSection';

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
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  
  // ✅ THE FIX: Use one selector for each piece of state.
  // This is more verbose but is guaranteed to be type-safe and performant.
  // This component will only re-render if one of these specific values changes.
  const activeWeights = useFilterStore((state: FilterState) => state.weights);
  const rentRange = useFilterStore((state: FilterState) => state.rentRange);
  const ageRange = useFilterStore((state: FilterState) => state.ageRange);
  const incomeRange = useFilterStore((state: FilterState) => state.incomeRange);
  const selectedEthnicities = useFilterStore((state: FilterState) => state.selectedEthnicities);
  const selectedGenders = useFilterStore((state: FilterState) => state.selectedGenders);
  const setFilters = useFilterStore((state: FilterState) => state.setFilters);
  const updateWeight = useFilterStore((state: FilterState) => state.updateWeight);


  const [_menuIsOpen, setMenuIsOpen] = useState(false);
  const [dropdownInput, setDropdownInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
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

  const handleRentRangeChange = useCallback((newVal: [number, number]) => setFilters({ rentRange: newVal }), [setFilters]);
  const handleAgeRangeChange = useCallback((newVal: [number, number]) => setFilters({ ageRange: newVal }), [setFilters]);
  const handleIncomeRangeChange = useCallback((newVal: [number, number]) => setFilters({ incomeRange: newVal }), [setFilters]);
  const handleGenderChange = useCallback((newVal: string[]) => setFilters({ selectedGenders: newVal }), [setFilters]);
  const handleEthnicityChange = useCallback((newVal: string[]) => setFilters({ selectedEthnicities: newVal }), [setFilters]);

  const handleSubmit = () => {
    if (!selectedGenders.length) {
      alert('Please select at least one gender.');
      return;
    }
    const currentState = useFilterStore.getState();
    onSearchSubmit(currentState);
    onClose();
  };

  return (
    <main>
       <Drawer isOpen={isOpen} onClose={onClose} finalFocusRef={btnRef as unknown as React.RefObject<FocusableElement>} placement="left" size="sm">
        <DrawerOverlay />
        <DrawerContent bg="#FFDED8" display="flex" flexDirection="column" h="100%">
          <DrawerCloseButton />
          <DrawerHeader>Priorities</DrawerHeader>
          <DrawerBody ref={drawerBodyRef} overflowY="auto" css={{ '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px', '&:hover': { background: '#555' } } }}>
            <Flex direction="column" gap={4} pb={8}>
              <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
                <MyRangeSlider heading="Rent (PSF)" toolTipText="Target Average Rent cost per Square foot in $USD" defaultRange={rentRange} onChangeEnd={handleRentRangeChange}/>
              </Box>
              <Box bg="white" borderRadius="lg" p={3} boxShadow="sm">
                <CollapsibleSection title="Demographic Fit Filters" tooltip="Customize your target audience by age, income, gender, and race">
                  <Flex direction="column" gap={4}>
                    <MyAgeSlider value={ageRange} onChangeEnd={handleAgeRangeChange} />
                    <MyIncomeSlider value={incomeRange} onChangeEnd={handleIncomeRangeChange} />
                    <GenderSelect value={selectedGenders} onChange={handleGenderChange} />
                    <Box mt={2} ref={ethnicityRef} borderRadius="md" minHeight="60px">
                      <HierarchicalMultiSelect data={ethnicityData} label="Select Ethnicities" onChange={handleEthnicityChange} autoFocus={false} onMenuOpenChange={setMenuIsOpen} controlledInput={dropdownInput} setControlledInput={setDropdownInput} externalSelectedValues={selectedEthnicities} externalExpandedGroups={expandedGroups} setExternalExpandedGroups={setExpandedGroups} setMenuIsOpenExternal={setMenuIsOpen} selectWrapperRef={selectWrapperRef}/>
                    </Box>
                    {_menuIsOpen && <Box h="280px" />}
                  </Flex>
                </CollapsibleSection>
              </Box>
              <Box bg="white" borderRadius="lg" p={3} boxShadow="sm">
                <CollapsibleSection title="Resilience Score Weighting" tooltip="Adjust how different factors contribute to the overall score">
                  <WeightingPanel activeWeights={activeWeights} inactiveLayers={ALL_AVAILABLE_LAYERS.filter((layer: Layer) => !activeWeights.some((active: Weighting) => active.id === layer.id))} onSliderChangeEnd={handleWeightChangeEnd} onRemove={handleRemoveWeight} onAdd={handleAddWeight}/>
                  <Flex justify="center" w="100%" mt={4}>
                    <Button size="sm" bg="black" color="white" _hover={{ bg: 'black' }} _active={{ bg: 'black' }} borderRadius="md" px={4} py={2} onClick={() => setIsResetDialogOpen(true)}>Reset Weights to Default</Button>
                  </Flex>
                </CollapsibleSection>
              </Box>
            </Flex>
          </DrawerBody>
          <Box p={4} position="sticky" bottom="0" bg="#FFDED8" zIndex="sticky" borderTop="1px solid rgba(0,0,0,0.1)">
            <Flex justify="center"><Button bg="#FF492C" variant="solid" onClick={handleSubmit}><SearchIcon mr={2} />Search</Button></Flex>
          </Box>
        </DrawerContent>
      </Drawer>
      <AlertDialog isOpen={isResetDialogOpen} leastDestructiveRef={cancelRef as unknown as React.RefObject<FocusableElement>} onClose={() => setIsResetDialogOpen(false)}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Reset Weightings</AlertDialogHeader>
            <AlertDialogBody>Are you sure you want to reset all weightings to their default values? This cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <CancelResetButton ref={cancelRef} onClick={() => setIsResetDialogOpen(false)} />
              <Button colorScheme="red" onClick={() => { setFilters({ weights: INITIAL_WEIGHTS }); setIsResetDialogOpen(false); }} ml={3}>Reset</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </main>
  );
}