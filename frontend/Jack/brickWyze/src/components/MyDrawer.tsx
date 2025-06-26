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
} from '@chakra-ui/react';
import { useRef } from 'react';
import MySlider from './MySlider';
import MyToolTip from './MyToolTip';
import { GiHamburgerMenu } from "react-icons/gi";

export default function MyDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null!);

  return (
    <main style={{ padding: '2rem' }}>
      <Button ref={btnRef} onClick={onOpen} background={"transparent"}>
        <GiHamburgerMenu></GiHamburgerMenu>
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
            <MySlider />
            <MyToolTip label={"hello World!"}></MyToolTip>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
