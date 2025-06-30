import React from 'react';
import { Box } from '@chakra-ui/react';

interface DisplayPill {
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
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      backgroundColor="blue.500"
      color="white"
      borderRadius="md"
      fontSize="sm"
      fontWeight="500"
      maxW="100%"
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Box 
        px={2} 
        py={1} 
        display="flex" 
        alignItems="center" 
        gap={1}
        flex="1 1 auto"
      >
        <Box flexShrink={0}>{pill.type === 'group' ? '📁' : '📄'}</Box>
        <Box>{pill.label}</Box>
      </Box>
      <Box
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(pill);
        }}
        cursor="pointer"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        py={1}
        color="white"
        borderRadius="0 4px 4px 0"
        bg="red.500"
        _hover={{
          backgroundColor: 'red.600',
        }}
        flexShrink={0}
        borderLeft="1px solid"
        borderLeftColor="red.600"
      >
        ✕
      </Box>
    </Box>
  );
};
