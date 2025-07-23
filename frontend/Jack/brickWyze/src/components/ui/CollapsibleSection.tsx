'use client';

import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Heading,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import React, { ReactNode } from 'react';
import MyToolTip from './MyToolTip'; // ✅ Import your custom tooltip

interface CollapsibleSectionProps {
  title: string;
  tooltip?: string;
  defaultIsOpen?: boolean;
  children: ReactNode;
  glowing?: boolean; // ✅ NEW: Optional pulsing glow
}

export default function CollapsibleSection({
  title,
  tooltip,
  defaultIsOpen = false,
  children,
  glowing = false, // ✅ NEW: Default to false
}: CollapsibleSectionProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen });

  // ✅ NEW: Pulsing glow animation styles
  const pulseGlowStyles = glowing ? {
    animation: 'pulseGlow 2.5s ease-in-out infinite',
    border: '3px solid',
    '@keyframes pulseGlow': {
      '0%': {
        boxShadow: '0 0 5px rgba(255, 165, 0, 0.7), 0 0 10px rgba(255, 165, 0, 0.5), 0 0 15px rgba(255, 165, 0, 0.3)',
        borderColor: 'rgba(255, 165, 0, 0.8)'
      },
      '50%': {
        boxShadow: '0 0 10px rgba(255, 165, 0, 0.9), 0 0 20px rgba(255, 165, 0, 0.7), 0 0 25px rgba(255, 165, 0, 0.5)',
        borderColor: 'rgba(255, 165, 0, 1)'
      },
      '100%': {
        boxShadow: '0 0 5px rgba(255, 165, 0, 0.7), 0 0 10px rgba(255, 165, 0, 0.5), 0 0 15px rgba(255, 165, 0, 0.3)',
        borderColor: 'rgba(255, 165, 0, 0.8)'
      }
    }
  } : {};

  return (
    <Box 
      w="100%" 
      bg={glowing ? "rgba(255, 255, 255, 0.8)" : "transparent"}
      borderRadius={glowing ? "2xl" : "none"}
      boxShadow={glowing ? "0 4px 20px rgba(255, 73, 44, 0.08)" : "none"}
      backdropFilter={glowing ? "blur(10px)" : "none"}
      p={glowing ? 1 : 0}
      sx={pulseGlowStyles}
    >
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        px={4}
        py={4}
        borderRadius="xl"
        bg={glowing ? "transparent" : "#FFD3CC"}
        onClick={onToggle}
        _hover={{ bg: glowing ? 'rgba(255, 73, 44, 0.05)' : "#FFBFB3" }}
        transition="all 0.2s"
      >
        <Flex align="center" gap={2}>
          <Heading as="h4" size="md" color="black">
            {title}
          </Heading>
          {tooltip && (
            <Box ml={1} onClick={e => e.stopPropagation()}>
              <MyToolTip label={title}>{tooltip}</MyToolTip>
            </Box>
          )}
        </Flex>

        <IconButton
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          aria-label="Toggle section"
          size="lg"
          variant="ghost"
          color="gray.600"
          fontSize="24px"
          onClick={e => {
            e.stopPropagation(); // Prevent double toggle
            onToggle();
          }}
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box 
          mt={glowing ? 0 : 2} 
          px={glowing ? 3 : 3}
          py={glowing ? 0 : 0}
          pt={glowing ? 0 : 0}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}