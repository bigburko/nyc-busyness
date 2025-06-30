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
import { useRef, useEffect } from 'react';
import MySlider from './MySlider';
import { GiHamburgerMenu } from 'react-icons/gi';
import MyRangeSlider from './MyRangeSlider';
import { SearchIcon } from '@chakra-ui/icons';
import HierarchicalMultiSelect from './RaceDropDown/HierarchicalMultiSelect';
import { ethnicityData } from './RaceDropDown/ethnicityData';

export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null!);
  const ethnicityRef = useRef<HTMLDivElement>(null);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  const handleEthnicityChange = (selected: string[]) => {
    console.log("Selected ethnicity codes:", selected);
  };

  const scrollToDropdown = () => {
    if (ethnicityRef.current && drawerBodyRef.current) {
      const dropdownElement = ethnicityRef.current;
      const drawerBody = drawerBodyRef.current;

      const dropdownRect = dropdownElement.getBoundingClientRect();
      const drawerBodyRect = drawerBody.getBoundingClientRect();

      const dropdownOffsetTop = dropdownElement.offsetTop;
      const drawerBodyHeight = drawerBodyRect.height;
      const dropdownHeight = Math.max(dropdownRect.height, 400);

      let scrollPosition;
      if (dropdownHeight + 100 < drawerBodyHeight) {
        scrollPosition = dropdownOffsetTop - 50;
      } else {
        scrollPosition = dropdownOffsetTop - 20;
      }

      scrollPosition = Math.max(0, scrollPosition);

      drawerBody.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    if (drawerBodyRef.current) {
      drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDropdownMenuChange = (isOpen: boolean) => {
    if (isOpen) {
      setTimeout(() => {
        scrollToDropdown();
      }, 100);
    } else {
      scrollToTop(); // Snap back when closed
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <Button ref={btnRef} onClick={onOpen} background={'transparent'}>
        <GiHamburgerMenu />
      </Button>

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={btnRef}
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

              {/* Dropdown container with scroll target */}
              <Box
                ref={ethnicityRef}
                borderRadius="md"
                transition="all 0.3s"
                position="relative"
                minHeight="60px"
              >
                <HierarchicalMultiSelect
                  data={ethnicityData}
                  label="Select Ethnicities"
                  onChange={handleEthnicityChange}
                  onMenuOpenChange={handleDropdownMenuChange}
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
