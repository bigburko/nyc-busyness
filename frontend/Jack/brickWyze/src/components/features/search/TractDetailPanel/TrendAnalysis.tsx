// src/components/features/search/TractDetailPanel/TrendAnalysis.tsx
'use client';

import { Box, VStack, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';
import { FootTrafficChart } from './FootTrafficChart';
import { CrimeTrendChart } from './CrimeTrendChart';
import { TrendIndicators } from './TrendIndicators';

interface TrendAnalysisProps {
  tract: TractResult;
  isExporting?: boolean;
}

export default function TrendAnalysis({ tract, isExporting = false }: TrendAnalysisProps) {
  return (
    <VStack spacing={8} align="stretch" w="full" data-chart="trend-analysis" data-chart-content="true">
      {/* Quick Trend Summary */}
      <TrendIndicators tract={tract} isExporting={isExporting} />

      {/* Detailed Charts */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          Detailed Charts
        </Text>
        <VStack spacing={6}>
          <FootTrafficChart tract={tract} isExporting={isExporting} />
          <CrimeTrendChart tract={tract} isExporting={isExporting} />
        </VStack>
      </Box>
    </VStack>
  );
}