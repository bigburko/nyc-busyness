// src/components/features/search/components/TrendAnalysis.tsx
'use client';

import { Box, VStack, Text } from '@chakra-ui/react';
import { TractResult } from '../types/TractTypes';
import { FootTrafficChart } from './FootTrafficChart';
import { CrimeTrendChart } from './CrimeTrendChart';

interface TrendAnalysisProps {
  tract: TractResult;
}

export function TrendAnalysis({ tract }: TrendAnalysisProps) {
  return (
    <Box p={6}>
      <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
        📈 Trend Analysis
      </Text>
      
      <VStack spacing={6}>
        <FootTrafficChart tract={tract} />
        <CrimeTrendChart tract={tract} />
      </VStack>
    </Box>
  );
}