'use client';

import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Flex,
  Box,
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { SearchIcon } from '@chakra-ui/icons';
import type { FocusableElement } from '@chakra-ui/utils';

import WeightingPanel, { Weighting, Layer } from './ScoreWeightingGroup/WeightingPanel';
import MyRangeSlider from './MyRangeSlider';
import HierarchicalMultiSelect from './DemographicGroup/RaceDropDownGroup/HierarchicalMultiSelect';
import { ethnicityData } from './DemographicGroup/RaceDropDownGroup/ethnicityData';
import CancelResetButton from './ScoreWeightingGroup/CancelResetButton';
import GenderSelect from './DemographicGroup/GenderGroup/GenderSelect'; // ✅ updated

interface MyDrawerProps {
  onSearchSubmit: (filters: {
    weights: Weighting[];
    rentRange: [number, number];
    selectedEthnicities: string[];
    selectedGenders: string[];
  }) => void;
}

const ALL_AVAILABLE_LAYERS: Layer[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', color: '#4299E1' },
  { id: 'demographic', label: 'Demographics', icon: '👥', color: '#48BB78' },
  { id: 'crime', label: 'Crime Score', icon: '🚨', color: '#E53E3E' },
  { id: 'flood_risk', label: 'Flood Risk', icon: '🌊', color: '#38B2AC' },
  { id: 'rent_score', label: 'Rent Score', icon: '💰', color: '#ED8936' },
  { id: 'poi', label: 'Points of Interest', icon: '📍', color: '#9F7AEA' },
];

const INITIAL_WEIGHTS: Weighting[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', color: '#4299E1', value: 35 },
  { id: 'demographic', label: 'Demographics', icon: '👥', color: '#48BB78', value: 25 },
  { id: 'crime', label: 'Crime Score', icon: '🚨', color: '#E53E3E', value: 15 },
  { id: 'flood_risk', label: 'Flood Risk', icon: '🌊', color: '#38B2AC', value: 10 },
  { id: 'rent_score', label: 'Rent Score', icon: '💰', color: '#ED8936', value: 10 },
  { id: 'poi', label: 'Points of Interest', icon: '📍', color: '#9F7AEA', value: 5 },
];

export default function MyDrawer({ onSearchSubmit }: MyDrawerProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLDivElement>(null);
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const selectWrapperRef = useRef<HTMLDivElement>(null);

  const [activeWeights, setActiveWeights] = useState<Weighting[]>(INITIAL_WEIGHTS);
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['male', 'female']); // ✅ both selected by default
  const [dropdownInput, setDropdownInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [rangeValue, setRangeValue] = useState<[number, number]>([26, 160]);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const normalizeWeights = (weights: Weighting[]): Weighting[] => {
    if (weights.length === 0) return [];
    const total = weights.reduce((sum, w) => sum + w.value, 0);
    if (total === 0) {
      const equalValue = 100 / weights.length;
      return weights.map(w => ({ ...w, value: equalValue }));
    }
    const normalized = weights.map(w => ({ ...w, value: (w.value / total) * 100 }));
    let roundedTotal = normalized.reduce((sum, w) => sum + Math.round(w.value), 0);
    const roundingError = 100 - roundedTotal;
    if (normalized.length > 0) {
      normalized[0].value = Math.round(normalized[0].value) + roundingError;
    }
    return normalized.map(w => ({ ...w, value: Math.round(w.value) }));
  };

  const handleSubmit = () => {
    if (typeof onSearchSubmit === 'function') {
      if (selectedGenders.length === 0) {
        alert('Please select at least one gender.');
        return;
      }

      onSearchSubmit({
        weights: normalizeWeights(activeWeights),
        rentRange: rangeValue,
        selectedEthnicities,
        selectedGenders,
      });
    } else {
      console.warn('onSearchSubmit is not a function');
    }
    onClose();
  };

  return (
    <main>
      <Box ref={btnRef} onClick={onOpen} position="absolute" top="16px" left="16px" zIndex={10} cursor="pointer">
        <GiHamburgerMenu size={28} color="#2D3748" />
      </Box>

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        finalFocusRef={btnRef as unknown as React.RefObject<FocusableElement>}
        placement="left"
        size="sm"
      >
        <DrawerOverlay />
        <DrawerContent bg="#FFDED8" display="flex" flexDirection="column" h="100%">
          <DrawerCloseButton />
          <DrawerHeader>Priorities</DrawerHeader>

          <DrawerBody
            ref={drawerBodyRef}
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb': {
                background: '#888', borderRadius: '4px', '&:hover': { background: '#555' },
              },
            }}
          >
            <Flex direction="column" gap={4} pb={8}>
              <WeightingPanel
                activeWeights={activeWeights}
                inactiveLayers={ALL_AVAILABLE_LAYERS.filter(
                  layer => !activeWeights.some(active => active.id === layer.id)
                )}
                onSliderChangeEnd={(id, value) => {
                  const updatedSlider = activeWeights.find(w => w.id === id);
                  if (!updatedSlider) return;
                  const others = activeWeights.filter(w => w.id !== id);
                  let updated = value >= 100
                    ? [{ ...updatedSlider, value: 100 }, ...others.map(w => ({ ...w, value: 0 }))]
                    : [
                        { ...updatedSlider, value },
                        ...others.map(w => {
                          const total = others.reduce((s, w) => s + w.value, 0);
                          const share = total === 0 ? (100 - value) / others.length : (w.value / total) * (100 - value);
                          return { ...w, value: share };
                        }),
                      ];
                  setActiveWeights(normalizeWeights(updated));
                }}
                onRemove={id => setActiveWeights(normalizeWeights(activeWeights.filter(w => w.id !== id)))}
                onAdd={layer => {
                  const newValue = 15;
                  const scaled = activeWeights.map(w => ({ ...w, value: w.value * (1 - newValue / 100) }));
                  const updated = [...scaled, { ...layer, value: newValue }];
                  setActiveWeights(normalizeWeights(updated));
                }}
              />

              <Flex justify="center" w="100%">
                <Button
                  size="sm"
                  bg="gray.700"
                  color="white"
                  _hover={{ bg: 'gray.600' }}
                  _active={{ bg: 'gray.800' }}
                  borderRadius="md"
                  px={4}
                  py={2}
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  Reset Weights to Default
                </Button>
              </Flex>

              <MyRangeSlider
                heading="Rent (PSF)"
                toolTipText="Target Average Rent cost per Square foot in $USD"
                defaultRange={rangeValue}
                onChange={setRangeValue}
              />

              <GenderSelect value={selectedGenders} onChange={setSelectedGenders} />

              <Box mt={4} />
              <Box ref={ethnicityRef} borderRadius="md" minHeight="60px">
                <HierarchicalMultiSelect
                  data={ethnicityData}
                  label="Select Ethnicities"
                  onChange={setSelectedEthnicities}
                  autoFocus={false}
                  onMenuOpenChange={(isOpen) => {
                    setMenuIsOpen(isOpen);
                    if (isOpen) {
                      setTimeout(() => {
                        if (ethnicityRef.current && drawerBodyRef.current) {
                          const offsetTop = ethnicityRef.current.offsetTop;
                          drawerBodyRef.current.scrollTo({ top: offsetTop - 50, behavior: 'smooth' });
                        }
                      }, 100);
                    }
                  }}
                  controlledInput={dropdownInput}
                  setControlledInput={setDropdownInput}
                  externalSelectedValues={selectedEthnicities}
                  externalExpandedGroups={expandedGroups}
                  setExternalExpandedGroups={setExpandedGroups}
                  setMenuIsOpenExternal={setMenuIsOpen}
                  selectWrapperRef={selectWrapperRef}
                />
              </Box>
            </Flex>
          </DrawerBody>

          <Box p={4} position="sticky" bottom="0" bg="#FFDED8" zIndex="sticky" borderTop="1px solid rgba(0,0,0,0.1)">
            <Flex justify="center">
              <Button bg="#FF492C" variant="solid" onClick={handleSubmit}>
                <SearchIcon mr={2} />
                Search
              </Button>
            </Flex>
          </Box>
        </DrawerContent>
      </Drawer>

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
              <Button colorScheme="red" onClick={() => {
                setActiveWeights(INITIAL_WEIGHTS);
                setIsResetDialogOpen(false);
              }} ml={3}>
                Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </main>
  );
}
