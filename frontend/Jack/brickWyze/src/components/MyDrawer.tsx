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
import { GiHamburgerMenu } from "react-icons/gi";
import MyRangeSlider from './MyRangeSlider';
import { SearchIcon } from '@chakra-ui/icons';




export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null!);

  return (
    <main style={{ padding: '2rem' }}>
      <Button ref={btnRef} onClick={onOpen} background={"transparent"}>
        <GiHamburgerMenu />
      </Button>

      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent bg="#FFDED8">
          <DrawerCloseButton />
          <DrawerHeader>Priorities</DrawerHeader>

          <DrawerBody>
            <Flex align="center" justify="space-between">
              <MySlider />
            </Flex>
            <Flex align="center" justify="space-between">
              <MyRangeSlider heading='Rent (PSF)' toolTipText='Target Average Rent cost per Square foot in $USD'></MyRangeSlider>
            </Flex>
            <Flex align="center" justify="space-between">
              <MySlider />
            </Flex>
            <Flex align="center" justify="space-between">
              <MySlider />
            </Flex>
          </DrawerBody>
          

          <DrawerFooter>
            <Box w="100%" textAlign="center">
              <Button borderRadius={20} bg="#FF492C" variant="outline" onClick={onClose}>
                <SearchIcon mr={2} />
                Search
              </Button>
            </Box>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
