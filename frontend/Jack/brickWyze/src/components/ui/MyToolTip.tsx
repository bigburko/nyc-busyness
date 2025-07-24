'use client';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Box,
  Button,
  Portal,
} from '@chakra-ui/react';
import { IoIosInformationCircle } from 'react-icons/io';
import React, { ReactNode, useState } from 'react';

interface Props {
  label?: string;
  children?: ReactNode;
  background?: string;
  buttonText?: string;
  buttonColor?: string;
  usePortal?: boolean; // New prop to control Portal usage
}

export default function MyToolTip({
  label = 'More Info',
  children = 'Enter text here',
  background = 'white',
  buttonText = 'Ask Bricky',
  buttonColor = '#FF492C',
  usePortal = false, // Default to false for normal behavior
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(prev => !prev);
  const handleClose = () => setIsOpen(false);

  const popoverContent = (
    <PopoverContent
      bg={background}
      color="black"
      borderRadius="md"
      maxW="250px"
      _focus={{ boxShadow: 'none' }}
      zIndex={usePortal ? 99999 : 9999}
      p={3}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(255, 73, 44, 0.3)"
      border="1px solid rgba(0, 0, 0, 0.15)"
    >
      <PopoverArrow bg={background} />
      <PopoverBody>
        <Box mb={3}>{children}</Box>
        <Box textAlign="center">
          <Button 
            size="sm" 
            bg={buttonColor} 
            color="white"
            _hover={{ bg: "#E53E3E" }}
            onClick={() => alert("Ask Bricky feature coming soon!")}
          >
            {buttonText}
          </Button>
        </Box>
      </PopoverBody>
    </PopoverContent>
  );

  return (
    <Popover 
      isOpen={isOpen} 
      onClose={handleClose} 
      onOpen={handleToggle} 
      trigger="click" 
      placement="top"
      boundary={usePortal ? undefined : "scrollParent"}
    >
      <PopoverTrigger>
        <Box as="span" cursor="pointer" aria-label={label}>
          <IoIosInformationCircle />
        </Box>
      </PopoverTrigger>
      {usePortal ? <Portal>{popoverContent}</Portal> : popoverContent}
    </Popover>
  );
}