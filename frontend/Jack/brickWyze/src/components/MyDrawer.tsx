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

import MySlider from './MySlider';
import MyRangeSlider from './MyRangeSlider';
import HierarchicalMultiSelect from './RaceDropDown/HierarchicalMultiSelect';
import { ethnicityData } from './RaceDropDown/ethnicityData';

export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLDivElement>(null); // Changed from HTMLButtonElement
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const selectWrapperRef = useRef<HTMLDivElement>(null);

  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [dropdownInput, setDropdownInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(() => new Set<string>());
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const [slider1Value, setSlider1Value] = useState(50);
  const [slider2Value, setSlider2Value] = useState(50);
  const [slider3Value, setSlider3Value] = useState(50);
  const [rangeValue, setRangeValue] = useState<[number, number]>([26, 160]);

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

  return (
    <main>
      <Box
        ref={btnRef}
        onClick={onOpen}
        position="absolute"
        top="16px"
        left="16px"
        zIndex={10}
        cursor="pointer"
      >
        <GiHamburgerMenu size={28} color="#2D3748" />
      </Box>

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        finalFocusRef={btnRef as React.RefObject<FocusableElement>}
        placement="left"
        size="sm"
      >
        <DrawerOverlay />
        <DrawerContent
          bg="#FFDED8"
          display="flex"
          flexDirection="column"
          h="100%"
        >
          <DrawerCloseButton />
          <DrawerHeader>Priorities</DrawerHeader>

          <DrawerBody
            ref={drawerBodyRef}
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': { background: '#555' },
              },
            }}
          >
            <Flex direction="column" gap={4} pb={8}>
              <MySlider heading="Foot Traffic Weighting" defaultValue={slider1Value} onChange={setSlider1Value} />
              <MySlider heading="Safety Weighting" defaultValue={slider2Value} onChange={setSlider2Value} />
              <MySlider heading="Rent Score Weighting" defaultValue={slider3Value} onChange={setSlider3Value} />
              <MySlider heading="Rent Score Weighting" defaultValue={slider3Value} onChange={setSlider3Value} />
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

          <Box
            p={4}
            position="sticky"
            bottom="0"
            bg="#FFDED8"
            zIndex="sticky"
            borderTop="1px solid"
            borderColor="rgba(0,0,0,0.1)"
          >
            <Flex justify="center">
              <Button bg="#FF492C" variant="solid" onClick={onClose}>
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
