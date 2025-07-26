// src/components/features/search/TractDetailPanel/TrendAnalysis.tsx - EXACTLY as you uploaded
'use client';

import { Box, VStack, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';
import { FootTrafficChart } from './FootTrafficChart';
import { CrimeTrendChart } from './CrimeTrendChart';
import { TrendIndicators } from './TrendIndicators'; // Import the component

interface TrendAnalysisProps {
  tract: TractResult;
}

export function TrendAnalysis({ tract }: TrendAnalysisProps) {
  return (
    <VStack spacing={8} align="stretch" w="full">
      {/* Quick Trend Summary */}
      <TrendIndicators tract={tract} />

      {/* Detailed Charts */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          Detailed Charts
        </Text>
        <VStack spacing={6}>
          <FootTrafficChart tract={tract} />
          <CrimeTrendChart tract={tract} />
        </VStack>
      </Box>
    </VStack>
  );
}