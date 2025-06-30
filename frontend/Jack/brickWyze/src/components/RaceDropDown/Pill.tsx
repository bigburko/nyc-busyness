'use client';

import { Box, CloseButton, Text } from '@chakra-ui/react';
import React from 'react';

export interface DisplayPill {
  type: 'group' | 'individual';
  label: string;
  value: string;
  actualValue?: string;
  groupChildren?: string[];
  level?: number;
}

interface PillProps {
  pill: DisplayPill;
  onRemove: (pill: DisplayPill) => void;
}

export const Pill: React.FC<PillProps> = ({ pill, onRemove }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // ✅ prevent toggling dropdown
    onRemove(pill);
  };

  return (
    <Box
      bg="gray.100"
      borderRadius="full"
      px={3}
      py={1}
      display="flex"
      alignItems="center"
      maxW="100%"
    >
      <Text fontSize="sm" isTruncated maxW="160px">
        {pill.label}
      </Text>
      <CloseButton
        size="sm"
        ml={2}
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()} // ✅ prevent dropdown focus toggle
      />
    </Box>
  );
};
