// src/components/features/search/components/TractInfo.tsx
'use client';

import { Box, VStack, Text } from '@chakra-ui/react';

interface TractInfoProps {
  ntaName: string;
  tractNumber: string;
}

export function TractInfo({ ntaName, tractNumber }: TractInfoProps) {
  return (
    <Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
      <VStack align="start" spacing={1}>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
          {ntaName}
        </Text>
        <Text fontSize="sm" color="gray.500">
          Census Tract {tractNumber}
        </Text>
      </VStack>
    </Box>
  );
}