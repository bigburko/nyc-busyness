// src/components/features/search/components/FootTrafficChart.tsx
'use client';

import { Box, VStack, HStack, Text, Flex } from '@chakra-ui/react';
import { useFilterStore } from '../../../../stores/filterStore';
import MyToolTip from '../../../ui/MyToolTip';
import { TractResult } from '../../../../types/TractTypes';

interface FootTrafficChartProps {
  tract: TractResult;
  isExporting?: boolean; // Add export support
}

export function FootTrafficChart({ tract, isExporting = false }: FootTrafficChartProps) {
  const currentScore = Math.round(tract.foot_traffic_score || 50);
  const { selectedTimePeriods } = useFilterStore();
  
  const hasperiodData = tract.foot_traffic_by_period && 
    Object.keys(tract.foot_traffic_by_period).length > 0;
  
  const hasTimelineData = tract.foot_traffic_timeline && 
    Object.keys(tract.foot_traffic_timeline).length > 0;

  // If we have the rich period data, use it!
  if (hasperiodData && tract.foot_traffic_by_period) {
    const periods = tract.foot_traffic_by_period;
    const years = ['2022', '2023', '2024', 'pred_2025', 'pred_2026', 'pred_2027'];
    
    const availablePeriods = ['morning', 'afternoon', 'evening'];
    const activePeriods = availablePeriods.filter(period => 
      selectedTimePeriods.includes(period) && periods[period as keyof typeof periods]
    );
    
    if (activePeriods.length === 0) {
      return (
        <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200" data-testid="foot-traffic-chart" data-chart="foot-traffic-timeline" data-chart-content="true">
          <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.800">
            Foot Traffic by Time Period
          </Text>
          <Text fontSize="lg" color="gray.600" textAlign="center" py={6}>
            No time periods selected. Please select morning, afternoon, or evening to view data.
          </Text>
        </Box>
      );
    }
    
    const chartData = years.map(year => {
      const yearData: Record<string, string | number | boolean> = {
        year: year.replace('pred_', ''),
        isPrediction: year.startsWith('pred_')
      };
      
      activePeriods.forEach(period => {
        yearData[period] = Math.round(periods[period as keyof typeof periods]?.[year] || 0);
      });
      
      return yearData;
    }).filter(item => {
      return activePeriods.some(period => item[period] as number > 0);
    });
    
    if (chartData.length === 0) {
      return (
        <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200" data-testid="foot-traffic-chart" data-chart="foot-traffic-timeline" data-chart-content="true">
          <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.800">
            Foot Traffic Score
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
            {currentScore}/100
          </Text>
        </Box>
      );
    }

    const allValues = chartData.flatMap(d => activePeriods.map(period => d[period] as number));
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues.filter(v => v > 0));
    
    const getHeight = (value: number) => {
      if (value <= 0) return 20;
      
      const range = maxValue - minValue;
      if (range === 0) return 80;
      
      const normalizedValue = (value - minValue) / range;
      return Math.max(40, 40 + (normalizedValue * 120));
    };

    const periodConfig = {
      morning: { color: '#F59E0B', pastColor: '#6B7280' },
      afternoon: { color: '#3B82F6', pastColor: '#9CA3AF' },
      evening: { color: '#6366F1', pastColor: '#9CA3AF' }
    };

    return (
      <Box w="full" data-testid="foot-traffic-chart" className="foot-traffic-periods-container" data-chart="foot-traffic-periods" data-chart-content="true">
        <HStack mb={4} align="center" spacing={3}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Foot Traffic by Time Period
          </Text>
          <MyToolTip label="Foot Traffic by Time Period">
            Shows pedestrian activity patterns across different times of day over multiple years, helping identify peak traffic periods and trends
          </MyToolTip>
        </HStack>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm" data-chart-content="true">
          {/* Chart - Clean version with enough height for bars */}
          <Flex justify="space-around" align="end" h="200px" mb={4} px={2}>
            {chartData.map((item) => {
              const isPast = parseInt(item.year as string) < 2025;
              const isCurrent = item.year === '2025';
              const isFuture = parseInt(item.year as string) > 2025;
              
              return (
                <VStack key={`ft-period-${item.year}`} spacing={1} flex="1" align="center" position="relative">
                  {/* Blue background box - positioned behind content */}
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
                  
                  {/* Content - same structure for all years */}
                  <VStack spacing={2} align="center" position="relative" zIndex={1}>
                      {/* Each bar with its value directly above it */}
                      <HStack spacing="2px" align="end">
                        {activePeriods.map(period => {
                          const config = periodConfig[period as keyof typeof periodConfig];
                          const height = getHeight(item[period] as number);
                          
                          return (
                            <VStack key={`${item.year}-${period}-pair`} spacing={2} align="center">
                              <Text 
                                fontSize="9px" 
                                fontWeight="bold" 
                                color="gray.700" 
                                lineHeight="1"
                              >
                                {item[period] as number}
                              </Text>
                              
                              <Box
                                bg={config.color}
                                h={`${height}px`}
                                w="8px"
                                borderRadius="sm"
                                boxShadow="sm"
                                opacity={isPast ? 0.6 : 1}
                                border={isFuture ? "1px dashed" : "none"}
                                borderColor="gray.400"
                              />
                            </VStack>
                          );
                        })}
                      </HStack>
                      
                      {/* Year label */}
                      <Text 
                        fontSize="xs" 
                        color={isPast ? "gray.400" : isCurrent ? "blue.600" : "purple.600"}
                        fontWeight={isCurrent ? "bold" : "normal"}
                      >
                        {item.year as string}
                      </Text>
                    </VStack>
                </VStack>
              );
            })}
          </Flex>
          
          {/* Period Legend ONLY - Show time periods */}
          <HStack justify="center" spacing={6} fontSize="xs" color="gray.600">
            {activePeriods.includes('morning') && (
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#F59E0B" borderRadius="sm" />
                <Text>Morning</Text>
              </HStack>
            )}
            {activePeriods.includes('afternoon') && (
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#3B82F6" borderRadius="sm" />
                <Text>Afternoon</Text>
              </HStack>
            )}
            {activePeriods.includes('evening') && (
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#6366F1" borderRadius="sm" />
                <Text>Evening</Text>
              </HStack>
            )}
          </HStack>
        </Box>
      </Box>
    );
  }

  // Fallback: Use timeline data if available 
  if (hasTimelineData && tract.foot_traffic_timeline) {
    const timeline = tract.foot_traffic_timeline;
    const chartData = [
      { year: '2022', value: Math.round(timeline['2022'] || 0) },
      { year: '2023', value: Math.round(timeline['2023'] || 0) },
      { year: '2024', value: Math.round(timeline['2024'] || 0) },
      { year: '2025', value: Math.round(timeline['pred_2025'] || 0) },
      { year: '2026', value: Math.round(timeline['pred_2026'] || 0) },
      { year: '2027', value: Math.round(timeline['pred_2027'] || 0) },
    ];

    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    
    const getHeight = (value: number) => {
      const range = maxValue - minValue;
      if (range === 0) return 60;
      // Less aggressive scaling
      const normalizedValue = (value - minValue) / range;
      return Math.max(30, 50 + (normalizedValue * 80));
    };

    return (
      <Box w="full" data-testid="foot-traffic-chart" data-chart="foot-traffic-timeline" data-chart-content="true">
        <HStack mb={4} align="center" spacing={3}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Foot Traffic Trend
          </Text>
          <MyToolTip label="Foot Traffic Trend">
            Shows overall pedestrian activity trends over time, combining all time periods into a single trend line
          </MyToolTip>
        </HStack>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm" data-chart-content="true">
          <Flex justify="space-around" align="end" h="160px" mb={2} px={2}>
            {chartData.map((item, index) => {
              const isPast = index < 3;
              const isCurrent = index === 3;
              const height = getHeight(item.value);
              
              return (
                <VStack key={`ft-timeline-${item.year}`} spacing={1} flex="1" align="center" position="relative">
                  {/* Blue background box - positioned behind content */}
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
                  
                  {/* Content - same structure for all years */}
                  <VStack spacing={2} align="center" position="relative" zIndex={1}>
                      <Box w="14px" textAlign="center">
                        <Text fontSize="9px" fontWeight="bold" color="gray.700" lineHeight="1">
                          {item.value}
                        </Text>
                      </Box>
                      <Box
                        bg={isPast ? "#6B7280" : isCurrent ? "#4299E1" : "#60A5FA"}
                        h={`${height}px`}
                        w="20px"
                        borderRadius="md"
                        boxShadow="sm"
                      />
                      <Text fontSize="xs" color="gray.500" fontWeight={isCurrent ? "bold" : "normal"}>
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

  // Final fallback: Show current score only
  return (
    <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200" data-testid="foot-traffic-chart" data-chart="foot-traffic-timeline" data-chart-content="true">
      <HStack mb={2} align="center" spacing={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Foot Traffic Score
        </Text>
        {!isExporting && (
          <MyToolTip label="Foot Traffic Score">
            Current foot traffic score for this area based on pedestrian activity data
          </MyToolTip>
        )}
      </HStack>
      <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
        {currentScore}/100
      </Text>
    </Box>
  );
}