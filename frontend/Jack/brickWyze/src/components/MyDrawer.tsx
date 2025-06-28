'use client';

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Flex,
  Box,
} from '@chakra-ui/react';
import { useRef } from 'react';
import MySlider from './MySlider';
import MyToolTip from './MyToolTip';
import { GiHamburgerMenu } from 'react-icons/gi';
import MyRangeSlider from './MyRangeSlider';
import { SearchIcon } from '@chakra-ui/icons';
import HierarchicalMultiSelect from './HierarchicalMultiSelect'; // 👈 Import component
import { ethnicityOptions } from '../app/Data/sampleData'; // 👈 Replace with your actual data source

export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null!);

  const handleEthnicityChange = (selected: string[]) => {
    console.log("Selected ethnicity codes:", selected);
    // You could pass this to Supabase or state
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

          <DrawerBody overflowY="auto">
            <Flex direction="column" gap={4}>
              <MySlider />
              <MyRangeSlider
                heading="Rent (PSF)"
                toolTipText="Target Average Rent cost per Square foot in $USD"
              />
              <MySlider />
              <MySlider />

              {/* 👇 Hierarchical Dropdown */}
              <Box>
                <HierarchicalMultiSelect
                  data={ethnicityOptions}
                  label="Select Ethnicities"
                  onChange={handleEthnicityChange}
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
