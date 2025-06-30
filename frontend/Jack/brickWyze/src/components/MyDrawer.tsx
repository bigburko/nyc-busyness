'use client';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Flex,
  Box,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { SearchIcon } from '@chakra-ui/icons';
import type { FocusableElement } from '@chakra-ui/utils';

import MySlider from './MySlider';
import MyRangeSlider from './MyRangeSlider';
import HierarchicalMultiSelect from './RaceDropDown/HierarchicalMultiSelect';
import { ethnicityData } from './RaceDropDown/ethnicityData';

export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null); // ✅ Correct HTMLButtonElement
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);

  const handleEthnicityChange = (selected: string[]) => {
    setSelectedEthnicities(selected);
    console.log("Selected ethnicity codes:", selected);
  };

  const handleDropdownMenuChange = (menuIsOpen: boolean) => {
    if (menuIsOpen) {
      setTimeout(() => {
        scrollToDropdown();
      }, 100);
    } else {
      scrollToTop();
    }
  };

  const scrollToDropdown = () => {
    if (ethnicityRef.current && drawerBodyRef.current) {
      const dropdown = ethnicityRef.current;
      const body = drawerBodyRef.current;

      const offsetTop = dropdown.offsetTop;
      const scrollTarget = Math.max(0, offsetTop - 50);

      body.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (drawerBodyRef.current) {
      drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <Button ref={btnRef} onClick={onOpen} background="transparent">
        <GiHamburgerMenu />
      </Button>

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        finalFocusRef={btnRef as React.RefObject<FocusableElement>} // ✅ Cast for Chakra
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
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: '#555',
                },
              },
            }}
          >
            <Flex direction="column" gap={4} pb={8}>
              <MySlider />
              <MyRangeSlider
                heading="Rent (PSF)"
                toolTipText="Target Average Rent cost per Square foot in $USD"
              />
              <MySlider />
              <MySlider />

              <Box mt={4} />

              {/* Ethnicity Dropdown Scroll Target */}
              <Box
                ref={ethnicityRef}
                borderRadius="md"
                minHeight="60px"
                position="relative"
              >
                <HierarchicalMultiSelect
                  data={ethnicityData}
                  label="Select Ethnicities"
                  onChange={handleEthnicityChange}
                  onMenuOpenChange={handleDropdownMenuChange}
                  autoFocus={false}
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
