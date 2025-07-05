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
} from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { SearchIcon } from '@chakra-ui/icons';
import type { FocusableElement } from '@chakra-ui/utils';

import WeightingPanel, { Weighting, Layer } from './ScoreWeightingGroup/WeightingPanel';
import MyRangeSlider from './MyRangeSlider';
import HierarchicalMultiSelect from './RaceDropDownGroup/HierarchicalMultiSelect';
import { ethnicityData } from './RaceDropDownGroup/ethnicityData';

interface MyDrawerProps {
  onSearchSubmit: (filters: {
    weights: Weighting[];
    rentRange: [number, number];
    selectedEthnicities: string[];
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
  const [dropdownInput, setDropdownInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [rangeValue, setRangeValue] = useState<[number, number]>([26, 160]);

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

  const handleSliderChangeEnd = (updatedId: string, newValue: number) => {
    const updatedSlider = activeWeights.find(w => w.id === updatedId);
    if (!updatedSlider) return;
    const otherSliders = activeWeights.filter(w => w.id !== updatedId);
    let updatedWeights: Weighting[];
    if (newValue >= 100) {
      updatedWeights = [
        { ...updatedSlider, value: 100 },
        ...otherSliders.map(w => ({ ...w, value: 0 })),
      ];
    } else {
      const totalRemaining = 100 - newValue;
      const totalOtherOriginal = otherSliders.reduce((sum, w) => sum + w.value, 0);
      updatedWeights = [
        { ...updatedSlider, value: newValue },
        ...otherSliders.map(w => {
          const proportionalShare = totalOtherOriginal === 0
            ? totalRemaining / otherSliders.length
            : (w.value / totalOtherOriginal) * totalRemaining;
          return { ...w, value: proportionalShare };
        }),
      ];
    }
    setActiveWeights(normalizeWeights(updatedWeights));
  };

  const handleRemove = (idToRemove: string) => {
    const remainingWeights = activeWeights.filter(w => w.id !== idToRemove);
    setActiveWeights(normalizeWeights(remainingWeights));
  };

  const handleAdd = (layerToAdd: Layer) => {
    const valueForNewItem = 15;
    const scaledDownWeights = activeWeights.map(w => ({ ...w, value: w.value * (1 - valueForNewItem / 100) }));
    const newWeightsList = [...scaledDownWeights, { ...layerToAdd, value: valueForNewItem }];
    setActiveWeights(normalizeWeights(newWeightsList));
  };

  const inactiveLayers = ALL_AVAILABLE_LAYERS.filter(
    layer => !activeWeights.some(active => active.id === layer.id)
  );

  const handleDropdownMenuChange = (isOpen: boolean) => {
    setMenuIsOpen(isOpen);
    if (isOpen) {
      setTimeout(() => {
        if (ethnicityRef.current && drawerBodyRef.current) {
          const offsetTop = ethnicityRef.current.offsetTop;
          const scrollTarget = Math.max(0, offsetTop - 50);
          drawerBodyRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const dropdown = document.querySelector('.chakra-select__menu');
      const wrapper = selectWrapperRef.current;
      if (menuIsOpen && dropdown && !dropdown.contains(target) && wrapper && !wrapper.contains(target)) {
        setMenuIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuIsOpen, isOpen]);

  const handleSubmit = () => {
    if (typeof onSearchSubmit === 'function') {
      onSearchSubmit({
        weights: normalizeWeights(activeWeights),
        rentRange: rangeValue,
        selectedEthnicities,
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

      <Drawer isOpen={isOpen} onClose={onClose} finalFocusRef={btnRef as React.RefObject<FocusableElement>} placement="left" size="sm">
        <DrawerOverlay />
        <DrawerContent bg="#FFDED8" display="flex" flexDirection="column" h="100%">
          <DrawerCloseButton />
          <DrawerHeader>Priorities</DrawerHeader>

          <DrawerBody ref={drawerBodyRef} overflowY="auto" css={{
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '4px' },
            '&::-webkit-scrollbar-thumb': {
              background: '#888', borderRadius: '4px', '&:hover': { background: '#555' },
            },
          }}>
            <Flex direction="column" gap={4} pb={8}>
              <WeightingPanel
                activeWeights={activeWeights}
                inactiveLayers={inactiveLayers}
                onSliderChangeEnd={handleSliderChangeEnd}
                onRemove={handleRemove}
                onAdd={handleAdd}
              />
              <MyRangeSlider
                heading="Rent (PSF)"
                toolTipText="Target Average Rent cost per Square foot in $USD"
                defaultRange={rangeValue}
                onChange={setRangeValue}
              />
              <Box mt={4} />
              <Box ref={ethnicityRef} borderRadius="md" minHeight="60px">
                <HierarchicalMultiSelect
                  data={ethnicityData}
                  label="Select Ethnicities"
                  onChange={setSelectedEthnicities}
                  autoFocus={false}
                  onMenuOpenChange={handleDropdownMenuChange}
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

          <Box p={4} position="sticky" bottom="0" bg="#FFDED8" zIndex="sticky" borderTop="1px solid" borderColor="rgba(0,0,0,0.1)">
            <Flex justify="center">
              <Button bg="#FF492C" variant="solid" onClick={handleSubmit}>
                <SearchIcon mr={2} />
                Search
              </Button>
            </Flex>
          </Box>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
