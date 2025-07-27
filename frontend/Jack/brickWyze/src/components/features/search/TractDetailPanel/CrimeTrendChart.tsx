// src/components/features/search/components/CrimeTrendChart.tsx
'use client';

import { Box, VStack, HStack, Text, Flex } from '@chakra-ui/react';
import MyToolTip from '../../../ui/MyToolTip';
import { TractResult } from '../../../../types/TractTypes';

interface CrimeTrendChartProps {
  tract: TractResult;
  isExporting?: boolean; // Add export support
}

export function CrimeTrendChart({ tract, isExporting = false }: CrimeTrendChartProps) {
  const currentScore = Math.round(tract.crime_score || 50);
  
  const hasRealData = tract.crime_timeline && Object.keys(tract.crime_timeline).length > 0;
  
  let chartData = [];
  
  if (hasRealData && tract.crime_timeline) {
    chartData = [
      { year: '2022', value: Math.round(tract.crime_timeline.year_2022 || 0) },
      { year: '2023', value: Math.round(tract.crime_timeline.year_2023 || 0) },
      { year: '2024', value: Math.round(tract.crime_timeline.year_2024 || 0) },
      { year: '2025', value: Math.round(tract.crime_timeline.pred_2025 || 0) },
      { year: '2026', value: Math.round(tract.crime_timeline.pred_2026 || 0) },
      { year: '2027', value: Math.round(tract.crime_timeline.pred_2027 || 0) },
    ];
  } else {
    chartData = [
      { year: '2022', value: Math.round(currentScore * 0.80) },
      { year: '2023', value: Math.round(currentScore * 0.85) },
      { year: '2024', value: Math.round(currentScore * 0.92) },
      { year: '2025', value: currentScore },
      { year: '2026', value: Math.min(100, Math.round(currentScore * 1.02)) },
      { year: '2027', value: Math.min(100, Math.round(currentScore * 1.05)) },
    ];
  }

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  
  const getHeight = (value: number) => {
    if (value <= 0) return 20;
    
    const range = maxValue - minValue;
    if (range === 0) return 80;
    
    const normalizedValue = (value - minValue) / range;
    return Math.max(30, 50 + (normalizedValue * 80));
  };

  return (
    <Box 
      w="full" 
      data-testid="crime-trend-chart" 
      data-chart="crime-trend" 
      data-chart-content="true"
      className="crime-trend-container"
    >
      <HStack mb={4} align="center" spacing={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Safety Score Trend
        </Text>
        {!isExporting && (
          <MyToolTip label="Safety Score Trend">
            Shows how safe this area is trending over time, with higher scores indicating better safety conditions
          </MyToolTip>
        )}
      </HStack>

      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm" data-chart-content="true">
        <Flex justify="space-around" align="end" h="160px" mb={2} px={2}>
          {chartData.map((item, chartIndex) => {
            const isPast = chartIndex < 3;
            const isCurrent = chartIndex === 3;
            const height = getHeight(item.value);
            
            return (
              <VStack key={`crime-chart-${item.year}`} spacing={1} flex="1" align="center" position="relative">
                {isCurrent && (
                  <Box 
                    position="absolute"
                    top="-4px"
                    bottom="-4px"
                    left="-4px"
                    right="-4px"
                    border="2px solid"
                    borderColor="blue.500"
                    borderRadius="md"
                    bg="blue.50"
                    zIndex={0}
                  />
                )}
                
                <VStack spacing={2} align="center" position="relative" zIndex={1}>
                    <Box w="14px" textAlign="center">
                      <Text 
                        fontSize="9px" 
                        fontWeight="bold" 
                        color="gray.700" 
                        lineHeight="1"
                      >
                        {item.value}
                      </Text>
                    </Box>
                    
                    <Box
                      bg={isPast ? "#6B7280" : isCurrent ? "#10B981" : "#60A5FA"}
                      h={`${height}px`}
                      w="20px"
                      borderRadius="sm"
                      boxShadow="sm"
                    />
                    
                    <Text fontSize="xs" color={isPast ? "gray.400" : isCurrent ? "blue.600" : "purple.600"} fontWeight={isCurrent ? "bold" : "normal"}>
                      {item.year}
                    </Text>
                  </VStack>
              </VStack>
            );
          })}
        </Flex>
      </Box>
    </Box>
  );
}