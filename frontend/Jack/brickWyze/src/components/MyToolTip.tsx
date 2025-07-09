'use client';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Box,
  Button,
} from '@chakra-ui/react';
import { IoIosInformationCircle } from 'react-icons/io';
import React, { ReactNode, useState } from 'react';

interface Props {
  children?: ReactNode;
  background?: string;
  buttonText?: string;
  buttonColor?: string;
}

export default function MyToolTip({
  children = "Enter Text Here",
  background = "white",
  buttonText = "Learn More",
  buttonColor = "#FF492C"
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(prev => !prev);
  const handleClose = () => setIsOpen(false);

  return (
    <Popover isOpen={isOpen} onClose={handleClose} onOpen={handleToggle} trigger="click" placement="top">
      <PopoverTrigger>
        <Box as="span" cursor="pointer">
          <IoIosInformationCircle />
        </Box>
      </PopoverTrigger>
      <PopoverContent
        bg={background}
        color="black"
        borderRadius="md"
        maxW="250px"
        _focus={{ boxShadow: 'none' }}
        zIndex="popover"
        p={3}
      >
        <PopoverArrow bg={background} />
        <PopoverBody>
          <Box mb={3}>{children}</Box>
          <Box textAlign="center">
            <Button size="sm" bg={buttonColor} onClick={() => alert("More info coming soon!")}>
              {buttonText}
            </Button>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
