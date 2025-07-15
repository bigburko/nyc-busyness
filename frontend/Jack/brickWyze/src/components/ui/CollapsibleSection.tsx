'use client';

import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Heading,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import React, { ReactNode } from 'react';
import MyToolTip from './MyToolTip'; // ✅ Import your custom tooltip

interface CollapsibleSectionProps {
  title: string;
  tooltip?: string;
  defaultIsOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  tooltip,
  defaultIsOpen = false,
  children,
}: CollapsibleSectionProps) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen });

  return (
    <Box w="100%">
      <Flex
        align="center"
        justify="space-between"
        cursor="pointer"
        px={3}
        py={3}
        borderRadius="md"
        bg="#FFD3CC"
        onClick={onToggle}
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
          icon={isOpen ? <ChevronDownIcon boxSize={6} /> : <ChevronRightIcon boxSize={6} />}
          aria-label="Toggle section"
          size="sm"
          variant="ghost"
          onClick={e => {
            e.stopPropagation(); // Prevent double toggle
            onToggle();
          }}
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <Box mt={2} px={3}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
