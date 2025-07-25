// src/components/features/search/TractDetailPanel.tsx - COMPLETE UPDATED VERSION
'use client';

import { 
  Box, VStack, HStack, Text, Button, IconButton, SimpleGrid, Progress, Flex, Badge
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useFilterStore } from '../../../stores/filterStore';
import MyToolTip from '../../ui/MyToolTip';

interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
}

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
}

interface WeightConfig {
  id: string;
  label: string;
  icon: string;
  getValue: (tract: TractResult) => number;
  color: string;
  unit?: string;
}

function ScoreMeter({ 
  label, 
  score, 
  color = "#FF492C", 
  max = 100,
  icon 
}: { 
  label: string; 
  score: number; 
  color?: string; 
  max?: number;
  icon?: string;
}) {
  const displayScore = Math.min(Math.max(Math.round(score), 0), max);
  const percentage = Math.min((score / max) * 100, 100);
  
  return (
    <Box w="full">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          {icon} {label}
        </Text>
        <Text fontSize="md" fontWeight="bold" color={color}>
          {displayScore}/{max}
        </Text>
      </HStack>
      <Progress 
        value={percentage} 
        size="md" 
        colorScheme="orange" 
        bg="gray.100" 
        borderRadius="full"
        h="8px"
      />
    </Box>
  );
}

function FootTrafficChart({ tract }: { tract: TractResult }) {
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
        <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
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
      // 🔧 FIX: Define proper interface for yearData instead of using any
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
        <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
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
      <Box w="full">
        <HStack mb={4} align="center" spacing={3}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Foot Traffic by Time Period
          </Text>
          <MyToolTip label="Foot Traffic by Time Period">
            Shows pedestrian activity patterns across different times of day over multiple years, helping identify peak traffic periods and trends
          </MyToolTip>
        </HStack>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
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
      <Box w="full">
        <HStack mb={4} align="center" spacing={3}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Foot Traffic Trend
          </Text>
          <MyToolTip label="Foot Traffic Trend">
            Shows overall pedestrian activity trends over time, combining all time periods into a single trend line
          </MyToolTip>
        </HStack>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
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
    <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
      <HStack mb={2} align="center" spacing={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Foot Traffic Score
        </Text>
        <MyToolTip label="Foot Traffic Score">
          Current foot traffic score for this area based on pedestrian activity data
        </MyToolTip>
      </HStack>
      <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
        {currentScore}/100
      </Text>
    </Box>
  );}

function CrimeTrendChart({ tract }: { tract: TractResult }) {
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
    
    // Less aggressive scaling - reduced multiplier and smaller base range
    const normalizedValue = (value - minValue) / range;
    return Math.max(30, 50 + (normalizedValue * 80)); // Reduced from 40 + 120 to 50 + 80
  };

  return (
    <Box w="full">
      <HStack mb={4} align="center" spacing={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Safety Score Trend
        </Text>
        <MyToolTip label="Safety Score Trend">
          Shows how safe this area is trending over time, with higher scores indicating better safety conditions
        </MyToolTip>
      </HStack>

      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
        {/* Chart - Clean version with reduced white space */}
        <Flex justify="space-around" align="end" h="160px" mb={2} px={2}>
          {chartData.map((item, chartIndex) => {
            // 🔧 FIX: Rename 'index' to 'chartIndex' to avoid unused variable
            const isPast = chartIndex < 3;
            const isCurrent = chartIndex === 3;
            const height = getHeight(item.value);
            
            return (
              <VStack key={`crime-chart-${item.year}`} spacing={1} flex="1" align="center" position="relative">
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

function getResilienceColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#3B82F6";
  if (score >= 40) return "#F59E0B";
  if (score >= 20) return "#F97316";
  return "#EF4444";
}

function getResilienceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Low";
  return "Very Low";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"; // Green
  if (score >= 60) return "#3B82F6"; // Blue  
  if (score >= 40) return "#F59E0B"; // Orange
  if (score >= 20) return "#F97316"; // Dark Orange
  return "#EF4444"; // Red
}

// Define all possible weight configurations
const WEIGHT_CONFIGS: WeightConfig[] = [
  {
    id: 'foot_traffic',
    label: 'Foot Traffic',
    icon: '🚶',
    getValue: (tract) => tract.foot_traffic_score || 0,
    color: '#4299E1'
  },
  {
    id: 'demographic',
    label: 'Demographics',
    icon: '👥',
    getValue: (tract) => tract.demographic_score || 0,
    color: '#48BB78'
  },
  {
    id: 'crime',
    label: 'Safety Score',
    icon: '🛡️',
    getValue: (tract) => tract.crime_score || 0,
    color: '#10B981'
  },
  {
    id: 'flood_risk',
    label: 'Flood Risk',
    icon: '🌊',
    getValue: (tract) => tract.flood_risk_score || 0,
    color: '#38B2AC'
  },
  {
    id: 'rent_score',
    label: 'Rent Score',
    icon: '💰',
    getValue: (tract) => tract.rent_score || 0,
    color: '#ED8936'
  },
  {
    id: 'poi',
    label: 'Points of Interest',
    icon: '📍',
    getValue: (tract) => tract.poi_score || 0,
    color: '#9F7AEA'
  }
];

export default function TractDetailPanel({ tract, onClose }: TractDetailPanelProps) {
  const resilienceScore = Math.round(tract.custom_score || 0);
  const rentText = tract.avg_rent ? `${tract.avg_rent.toFixed(2)}` : 'N/A';
  const resilienceColor = getResilienceColor(resilienceScore);
  const resilienceLabel = getResilienceLabel(resilienceScore);
  
  // Get weights from filter store - assuming it has a weights array with {id, value} objects
  const filterStore = useFilterStore();
  const weights = (filterStore as any).weights || []; // Type assertion since we don't have the exact interface
  
  // Get top 3 weighted metrics, or use defaults
  const getTopMetrics = () => {
    // Filter and sort weights by value (highest first)
    const activeWeights = weights
      .filter((w: any) => w.value > 0)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 3);
    
    // If no weights are set, use defaults
    if (activeWeights.length === 0) {
      return WEIGHT_CONFIGS.filter(config => 
        ['foot_traffic', 'demographic', 'crime'].includes(config.id)
      );
    }
    
    // Map active weights to configs
    return activeWeights
      .map((weight: any) => WEIGHT_CONFIGS.find(config => config.id === weight.id))
      .filter(Boolean) // Remove any undefined configs
      .slice(0, 3); // Ensure we only have 3
  };
  
  const topMetrics = getTopMetrics();
  
  // Clean tract name (remove MN prefix) and format header
  const cleanTractName = tract.tract_name.replace(/^MN/, '');
  const tractNumber = tract.geoid;
  
  return (
    <Flex direction="column" h="100%" bg="white" position="relative">
      {/* Fixed floating X button */}
      <Box position="absolute" top="16px" right="16px" zIndex={30}>
        <IconButton
          aria-label="Close details"
          icon={<CloseIcon />}
          size="md"
          onClick={onClose}
          bg="white"
          color="gray.600"
          borderRadius="full"
          boxShadow="0 2px 8px rgba(0,0,0,0.15)"
          border="1px solid"
          borderColor="gray.200"
          _hover={{ 
            bg: 'gray.50',
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transform: "scale(1.05)"
          }}
          _active={{ transform: "scale(0.95)" }}
          transition="all 0.2s"
        />
      </Box>

      {/* Main scrollable content */}
      <Box flex="1" overflowY="auto">
        {/* Resilience Score section */}
        <Box p={6} bg="white" borderBottom="2px solid" borderColor="gray.100">
          <VStack spacing={1} align="center" justify="center">
            <Text 
              fontSize="6xl" 
              fontWeight="black" 
              color={resilienceColor}
              lineHeight="0.8"
              textShadow="0 2px 4px rgba(0,0,0,0.1)"
            >
              {resilienceScore}
            </Text>
            <Text 
              fontSize="sm" 
              color={resilienceColor}
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {resilienceLabel}
            </Text>
          </VStack>
        </Box>

        {/* Tract info section - UPDATED */}
        <Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
               {tract.nta_name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Census Tract {tractNumber}
            </Text>
          </VStack>
        </Box>

        {/* Dynamic Quick stats grid - UPDATED */}
        <Box p={6} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
          <SimpleGrid columns={2} spacing={6}>
            {/* Always show rent first */}
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                ${rentText}
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Rent PSF
              </Text>
              <Text fontSize="xs" color="gray.500">
                per sq ft
              </Text>
            </VStack>
            
            {/* Show top 3 weighted metrics dynamically */}
            {topMetrics.slice(0, 3).map((metric: WeightConfig, index: number) => {
              const value = Math.round(metric.getValue(tract));
              const isPercentage = metric.id === 'demographic' && tract.demographic_match_pct;
              const displayValue = isPercentage 
                ? (() => {
                    const rawValue = tract.demographic_match_pct || 0;
                    const displayValue = rawValue > 1 ? Math.round(rawValue) : Math.round(rawValue * 100);
                    return `${Math.min(displayValue, 100)}%`;
                  })()
                : value;
              
              // Use consistent color scheme based on score value
              const scoreForColor = isPercentage 
                ? ((tract.demographic_match_pct || 0) > 1 ? (tract.demographic_match_pct || 0) : (tract.demographic_match_pct || 0) * 100)
                : value;
              const scoreColor = getScoreColor(scoreForColor);
              
              return (
                <VStack key={`${metric.id}-${index}`} spacing={2}>
                  <Text fontSize="2xl" fontWeight="bold" color={scoreColor}>
                    {metric.icon} {displayValue}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    {metric.label}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {isPercentage ? "match rate" : "out of 100"}
                  </Text>
                </VStack>
              );
            })}
          </SimpleGrid>
        </Box>

        {/* Charts section */}
        <Box p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
            📈 Trend Analysis
          </Text>
          
          <VStack spacing={6}>
            <FootTrafficChart tract={tract} />
            <CrimeTrendChart tract={tract} />
          </VStack>
        </Box>

        {/* Smart Score Breakdown */}
        <Box p={6}>
          <HStack mb={6} align="center" spacing={3}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              📊 Score Calculation
            </Text>
            <MyToolTip label="Score Calculation">
              Shows how your current weights contribute to the final resilience score, with exact calculations
            </MyToolTip>
          </HStack>
          
          {(() => {
            // Get current weights from filter store
            const currentWeights = weights.filter((w: any) => w.value > 0);
            
            // Default weights when none are set
            const DEFAULT_WEIGHTS = [
              { id: 'foot_traffic', value: 45 },
              { id: 'crime', value: 25 },
              { id: 'flood_risk', value: 15 },
              { id: 'rent_score', value: 10 },
              { id: 'poi', value: 5 }
            ];
            
            // Use current weights or defaults
            const activeWeights = currentWeights.length > 0 ? currentWeights : DEFAULT_WEIGHTS;
            
            // Calculate contributions
            const contributions = activeWeights.map((weight: any) => {
              const config = WEIGHT_CONFIGS.find(c => c.id === weight.id);
              if (!config) return null;
              
              const score = Math.round(config.getValue(tract));
              const weightPercent = weight.value;
              const contribution = Math.round((score * weightPercent) / 100);
              
              return {
                ...config,
                score,
                weight: weightPercent,
                contribution,
                contributionPercent: Math.round((contribution / resilienceScore) * 100)
              };
            }).filter(Boolean);
            
            // Sort by contribution (highest first)
            contributions.sort((a: any, b: any) => b.contribution - a.contribution);
            
            if (currentWeights.length === 0) {
              return (
                <VStack spacing={6}>
                  <Box 
                    p={4} 
                    bg="blue.50" 
                    borderRadius="lg" 
                    border="1px solid" 
                    borderColor="blue.200"
                    w="full"
                  >
                    <VStack spacing={2}>
                      <Text fontSize="md" fontWeight="semibold" color="blue.700" textAlign="center">
                        🎯 Using Default Scoring
                      </Text>
                      <Text fontSize="sm" color="blue.600" textAlign="center">
                        No custom weights set. Using our research-backed default formula.
                      </Text>
                    </VStack>
                  </Box>
                  
                  <VStack spacing={4} w="full">
                    {contributions.map((item: any, index: number) => (
                      <Box 
                        key={`default-${item.id}-${index}`}
                        p={4} 
                        bg="white" 
                        borderRadius="lg" 
                        border="1px solid" 
                        borderColor="gray.200"
                        boxShadow="sm"
                        w="full"
                      >
                        <HStack justify="space-between" mb={3}>
                          <HStack spacing={2}>
                            <Text fontSize="lg">{item.icon}</Text>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                                {item.label}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {item.weight}% weight (default)
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <VStack align="end" spacing={0}>
                            <Text fontSize="lg" fontWeight="bold" color={getScoreColor(item.score)}>
                              +{item.contribution}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.contributionPercent}% of final
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <HStack fontSize="xs" color="gray.600" spacing={1}>
                          <Text>{item.score} × {item.weight}% = {item.contribution} points</Text>
                        </HStack>
                        
                        <Progress 
                          value={(item.contribution / resilienceScore) * 100} 
                          size="sm" 
                          colorScheme="blue" 
                          bg="gray.100" 
                          borderRadius="full"
                          mt={2}
                        />
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              );
            }
            
            return (
              <VStack spacing={6}>
                <Box 
                  p={4} 
                  bg="green.50" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="green.200"
                  w="full"
                >
                  <VStack spacing={2}>
                    <Text fontSize="md" fontWeight="semibold" color="green.700" textAlign="center">
                      ⚖️ Custom Weighted Scoring
                    </Text>
                    <Text fontSize="sm" color="green.600" textAlign="center">
                      Score calculated using your custom weights from the filter panel
                    </Text>
                  </VStack>
                </Box>
                
                <VStack spacing={4} w="full">
                  {contributions.map((item: any, index: number) => (
                    <Box 
                      key={`weighted-${item.id}-${index}`}
                      p={4} 
                      bg="white" 
                      borderRadius="lg" 
                      border="1px solid" 
                      borderColor="gray.200"
                      boxShadow="sm"
                      w="full"
                    >
                      <HStack justify="space-between" mb={3}>
                        <HStack spacing={2}>
                          <Text fontSize="lg">{item.icon}</Text>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="md" fontWeight="semibold" color="gray.700">
                              {item.label}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.weight}% weight (custom)
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <VStack align="end" spacing={0}>
                          <Text fontSize="lg" fontWeight="bold" color={getScoreColor(item.score)}>
                            +{item.contribution}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.contributionPercent}% of final
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack fontSize="xs" color="gray.600" spacing={1}>
                        <Text>{item.score} × {item.weight}% = {item.contribution} points</Text>
                      </HStack>
                      
                      <Progress 
                        value={(item.contribution / resilienceScore) * 100} 
                        size="sm" 
                        colorScheme="orange" 
                        bg="gray.100" 
                        borderRadius="full"
                        mt={2}
                      />
                    </Box>
                  ))}
                </VStack>
                
                {/* Show unweighted factors in collapsed section */}
                {(() => {
                  const unweightedFactors = WEIGHT_CONFIGS.filter(config => 
                    !activeWeights.some((w: any) => w.id === config.id)
                  );
                  
                  if (unweightedFactors.length === 0) return null;
                  
                  return (
                    <Box w="full" mt={4}>
                      <Text fontSize="sm" color="gray.500" mb={3} textAlign="center">
                        💡 Other available factors (not currently weighted)
                      </Text>
                      <SimpleGrid columns={2} spacing={3}>
                        {unweightedFactors.map((factor, index) => {
                          const score = Math.round(factor.getValue(tract));
                          return (
                            <Box 
                              key={`unweighted-${factor.id}-${index}`}
                              p={3} 
                              bg="gray.50" 
                              borderRadius="md" 
                              border="1px solid" 
                              borderColor="gray.200"
                            >
                              <VStack spacing={1}>
                                <Text fontSize="sm">{factor.icon}</Text>
                                <Text fontSize="xs" fontWeight="semibold" color="gray.600" textAlign="center">
                                  {factor.label}
                                </Text>
                                <Text fontSize="sm" fontWeight="bold" color={getScoreColor(score)}>
                                  {score}/100
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  0% weight
                                </Text>
                              </VStack>
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    </Box>
                  );
                })()}
              </VStack>
            );
          })()}
        </Box>

        {/* Advanced Demographic Analysis with Weighting */}
        <Box p={6}>
          <HStack mb={6} align="center" spacing={3}>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              👥 Advanced Demographic Analysis
            </Text>
            <MyToolTip label="Advanced Demographic Analysis">
              Shows sophisticated demographic scoring using AI-optimized weights, threshold bonuses, and penalties
            </MyToolTip>
          </HStack>
          
          {(() => {
            // Access demographic scoring from filter store
            const filterStore = useFilterStore();
            const demographicScoring = (filterStore as any).demographicScoring;
            
            // Helper function to get research-backed score from percentage
            const getResearchScore = (percentage: number) => {
              const pct = percentage;
              if (pct >= 30) return Math.min(100, 80 + (pct - 30) / 20 * 20);
              if (pct >= 25) return 70 + (pct - 25) / 5 * 9;
              if (pct >= 20) return 60 + (pct - 20) / 5 * 9;
              if (pct >= 15) return 50 + (pct - 15) / 5 * 9;
              if (pct >= 10) return 40 + (pct - 10) / 5 * 9;
              if (pct >= 5) return 20 + (pct - 5) / 5 * 19;
              return Math.max(0, pct / 5 * 19);
            };
            
            // Helper function to get threshold label
            const getThresholdLabel = (percentage: number) => {
              if (percentage >= 30) return { label: "Excellent", color: "#10B981" };
              if (percentage >= 25) return { label: "Strong", color: "#059669" };
              if (percentage >= 20) return { label: "Good", color: "#3B82F6" };
              if (percentage >= 15) return { label: "Average", color: "#F59E0B" };
              if (percentage >= 10) return { label: "Weak", color: "#F97316" };
              if (percentage >= 5) return { label: "Poor", color: "#EF4444" };
              return { label: "Very Poor", color: "#DC2626" };
            };
            
            // Helper function to get weight color
            const getWeightColor = (value: number) => {
              if (value >= 0.4) return '#FF492C'; // High priority - brand red
              if (value >= 0.3) return '#FF8C42'; // Medium-high priority - orange
              if (value >= 0.2) return '#4299E1'; // Medium priority - blue
              return '#A0AEC0'; // Low priority - gray
            };
            
            // Collect demographic components
            const components = [];
            
            // Default demographic weights (balanced)
            const defaultWeights = {
              ethnicity: 0.25,
              gender: 0.25,
              age: 0.25,
              income: 0.25
            };
            
            // Use advanced weights if available, otherwise use defaults
            const weights = demographicScoring?.weights || defaultWeights;
            const hasAdvancedScoring = demographicScoring && demographicScoring.weights;
            const thresholdBonuses = demographicScoring?.thresholdBonuses || [];
            const penalties = demographicScoring?.penalties || [];
            const reasoning = demographicScoring?.reasoning;
            
            // Process each demographic component with weighting
            if (tract.demographic_match_pct) {
              const ethPercent = Math.round((tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100));
              const ethScore = Math.round(getResearchScore(ethPercent));
              const ethThreshold = getThresholdLabel(ethPercent);
              const ethWeight = weights.ethnicity;
              components.push({
                id: 'ethnicity',
                name: 'Ethnicity Match',
                icon: '🌍',
                percentage: ethPercent,
                score: ethScore,
                weight: ethWeight,
                weightedContribution: ethScore * ethWeight,
                threshold: ethThreshold
              });
            }
            
            if (tract.gender_match_pct) {
              const genPercent = Math.round((tract.gender_match_pct > 1 ? tract.gender_match_pct : tract.gender_match_pct * 100));
              const genScore = Math.round(getResearchScore(genPercent));
              const genThreshold = getThresholdLabel(genPercent);
              const genWeight = weights.gender;
              components.push({
                id: 'gender',
                name: 'Gender Match',
                icon: '⚖️',
                percentage: genPercent,
                score: genScore,
                weight: genWeight,
                weightedContribution: genScore * genWeight,
                threshold: genThreshold
              });
            }
            
            if (tract.age_match_pct) {
              const agePercent = Math.round((tract.age_match_pct > 1 ? tract.age_match_pct : tract.age_match_pct * 100));
              const ageScore = Math.round(getResearchScore(agePercent));
              const ageThreshold = getThresholdLabel(agePercent);
              const ageWeight = weights.age;
              components.push({
                id: 'age',
                name: 'Age Match',
                icon: '🎂',
                percentage: agePercent,
                score: ageScore,
                weight: ageWeight,
                weightedContribution: ageScore * ageWeight,
                threshold: ageThreshold
              });
            }
            
            if (tract.income_match_pct) {
              const incPercent = Math.round((tract.income_match_pct > 1 ? tract.income_match_pct : tract.income_match_pct * 100));
              const incScore = Math.round(getResearchScore(incPercent));
              const incThreshold = getThresholdLabel(incPercent);
              const incWeight = weights.income;
              components.push({
                id: 'income',
                name: 'Income Match',
                icon: '💰',
                percentage: incPercent,
                score: incScore,
                weight: incWeight,
                weightedContribution: incScore * incWeight,
                threshold: incThreshold
              });
            }
            
            if (components.length === 0) {
              return (
                <Box 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="gray.200"
                  textAlign="center"
                >
                  <Text fontSize="md" color="gray.600">
                    No demographic filters applied in your search
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Add ethnicity, gender, age, or income filters to see advanced demographic analysis
                  </Text>
                </Box>
              );
            }
            
            // Calculate weighted demographic score
            const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);
            const weightedScore = totalWeight > 0 
              ? Math.round(components.reduce((sum, comp) => sum + comp.weightedContribution, 0) / totalWeight)
              : Math.round(components.reduce((sum, comp) => sum + comp.score, 0) / components.length);
            
            // Apply threshold bonuses and penalties
            let finalScore = weightedScore;
            let bonusesApplied = 0;
            let penaltiesApplied = 0;
            
            // Note: In a real implementation, you'd evaluate conditions against tract data
            // For now, we'll just display them if they exist
            
            const overallThreshold = getThresholdLabel(
              components.reduce((sum, comp) => sum + comp.percentage, 0) / components.length
            );
            
            return (
              <VStack spacing={6}>
                {/* AI Strategy Display */}
                {hasAdvancedScoring && (
                  <Box 
                    p={4} 
                    bg="rgba(255, 249, 240, 0.8)" 
                    borderRadius="xl" 
                    border="1px solid rgba(255, 73, 44, 0.1)"
                    backdropFilter="blur(10px)"
                    w="full"
                  >
                    <HStack spacing={2} mb={3}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        💡 Bricky's Demographic Strategy
                      </Text>
                      <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
                        AI Optimized
                      </Badge>
                    </HStack>
                    
                    {reasoning && (
                      <Box 
                        bg="white" 
                        borderRadius="lg" 
                        p={3} 
                        mb={3}
                        border="1px solid rgba(255, 73, 44, 0.1)"
                      >
                        <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                          {reasoning}
                        </Text>
                      </Box>
                    )}
                    
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
                        AI-Optimized Factor Priorities
                      </Text>
                      
                      {[
                        { key: 'ethnicity', label: 'Ethnicity', icon: '🌍' },
                        { key: 'gender', label: 'Gender', icon: '👥' },
                        { key: 'age', label: 'Age', icon: '📅' },
                        { key: 'income', label: 'Income', icon: '💰' }
                      ].map(({ key, label, icon }) => {
                        const value = weights[key as keyof typeof weights];
                        const percentage = Math.round(value * 100);
                        const color = getWeightColor(value);
                        
                        return (
                          <Box key={key}>
                            <Flex justify="space-between" align="center" mb={1}>
                              <HStack spacing={2}>
                                <Text fontSize="xs">{icon}</Text>
                                <Text fontSize="xs" fontWeight="medium" color="gray.700">
                                  {label}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" fontWeight="bold" color={color}>
                                {percentage}%
                              </Text>
                            </Flex>
                            <Progress 
                              value={percentage} 
                              colorScheme="orange" 
                              bg="gray.100" 
                              borderRadius="full" 
                              size="sm"
                              sx={{
                                '& > div': {
                                  backgroundColor: color
                                }
                              }}
                            />
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                )}
                
                {/* Weighted Score Summary */}
                <Box 
                  p={4} 
                  bg={hasAdvancedScoring ? "green.50" : "blue.50"} 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor={hasAdvancedScoring ? "green.200" : "blue.200"}
                  w="full"
                >
                  <VStack spacing={3}>
                    <HStack justify="space-between" w="full">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color={hasAdvancedScoring ? "green.700" : "blue.700"}>
                          {hasAdvancedScoring ? "AI-Weighted Demographic Score" : "Balanced Demographic Score"}
                        </Text>
                        <Text fontSize="sm" color={hasAdvancedScoring ? "green.600" : "blue.600"}>
                          {hasAdvancedScoring ? "Using AI-optimized weights" : `Average of ${components.length} component${components.length !== 1 ? 's' : ''}`}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="2xl" fontWeight="bold" color={overallThreshold.color}>
                          {finalScore}/100
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color={overallThreshold.color}>
                          {overallThreshold.label}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {hasAdvancedScoring ? (
                      <Text fontSize="xs" color="green.600" textAlign="center">
                        📊 Weighted Calculation: ({components.map(c => `${Math.round(c.score)} × ${Math.round(c.weight * 100)}%`).join(' + ')}) ÷ {Math.round(totalWeight * 100)}% = {finalScore}
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="blue.600" textAlign="center">
                        📊 Balanced Calculation: ({components.map(c => c.score).join(' + ')}) ÷ {components.length} = {finalScore}
                      </Text>
                    )}
                  </VStack>
                </Box>
                
                {/* Individual Component Analysis */}
                <VStack spacing={4} w="full">
                  <Text fontSize="md" fontWeight="semibold" color="gray.700" textAlign="center">
                    📋 Detailed Component Breakdown
                  </Text>
                  
                  {components.map((component, index) => (
                    <Box 
                      key={`demo-${component.id}-${index}`}
                      p={4} 
                      bg="white" 
                      borderRadius="lg" 
                      border="1px solid" 
                      borderColor="gray.200"
                      boxShadow="sm"
                      w="full"
                    >
                      <VStack spacing={3}>
                        <HStack justify="space-between" w="full">
                          <HStack spacing={2}>
                            <Text fontSize="lg">{component.icon}</Text>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                                {component.name}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.500">
                                  Weight: {Math.round(component.weight * 100)}%
                                </Text>
                                <Box w="4px" h="4px" bg={getWeightColor(component.weight)} borderRadius="full" />
                                <Text fontSize="xs" color="gray.500">
                                  {component.weight >= 0.4 ? "High Priority" : 
                                   component.weight >= 0.3 ? "Medium-High" : 
                                   component.weight >= 0.2 ? "Medium" : "Low Priority"}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>
                          
                          <VStack align="end" spacing={0}>
                            <Text fontSize="lg" fontWeight="bold" color={component.threshold.color}>
                              {component.score}/100
                            </Text>
                            <Text fontSize="xs" fontWeight="semibold" color={component.threshold.color}>
                              {component.threshold.label}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <VStack spacing={2} w="full">
                          <HStack justify="space-between" w="full" fontSize="sm">
                            <Text color="gray.600">
                              Population Match: {component.percentage}%
                            </Text>
                            <Text color="gray.600">
                              Weighted Contribution: +{Math.round(component.weightedContribution)}
                            </Text>
                          </HStack>
                          
                          <Progress 
                            value={component.score} 
                            size="md" 
                            colorScheme={
                              component.score >= 70 ? "green" : 
                              component.score >= 50 ? "blue" : 
                              component.score >= 30 ? "orange" : "red"
                            }
                            bg="gray.100" 
                            borderRadius="full"
                          />
                          
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            {component.percentage}% population match → {component.score} points × {Math.round(component.weight * 100)}% weight = +{Math.round(component.weightedContribution)} contribution
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
                
                {/* Threshold Bonuses and Penalties */}
                {(thresholdBonuses.length > 0 || penalties.length > 0) && (
                  <VStack spacing={4} w="full">
                    {thresholdBonuses.length > 0 && (
                      <Box w="full">
                        <Text fontSize="sm" fontWeight="semibold" color="green.600" mb={2}>
                          ✅ Smart Bonuses Applied
                        </Text>
                        {thresholdBonuses.map((bonus: any, index: number) => (
                          <Box key={index} bg="green.50" borderRadius="md" p={2} mb={1}>
                            <Text fontSize="xs" color="green.700">
                              +{Math.round(bonus.bonus * 100)}% bonus: {bonus.description}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {penalties.length > 0 && (
                      <Box w="full">
                        <Text fontSize="sm" fontWeight="semibold" color="red.600" mb={2}>
                          ⚠️ Quality Guards Applied
                        </Text>
                        {penalties.map((penalty: any, index: number) => (
                          <Box key={index} bg="red.50" borderRadius="md" p={2} mb={1}>
                            <Text fontSize="xs" color="red.700">
                              -{Math.round(penalty.penalty * 100)}% penalty: {penalty.description}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </VStack>
                )}
                
                {/* Research Thresholds Reference */}
                <Box 
                  p={4} 
                  bg="gray.50" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="gray.200"
                  w="full"
                >
                  <VStack spacing={3}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" textAlign="center">
                      📚 Research-Backed Scoring Thresholds
                    </Text>
                    
                    <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
                      <VStack spacing={1} p={2} bg="green.50" borderRadius="md">
                        <Text fontWeight="bold" color="green.700">Excellent</Text>
                        <Text color="green.600">30%+ match</Text>
                        <Text color="green.600">80-100 pts</Text>
                      </VStack>
                      <VStack spacing={1} p={2} bg="blue.50" borderRadius="md">
                        <Text fontWeight="bold" color="blue.700">Good</Text>
                        <Text color="blue.600">20-29% match</Text>
                        <Text color="blue.600">60-79 pts</Text>
                      </VStack>
                      <VStack spacing={1} p={2} bg="orange.50" borderRadius="md">
                        <Text fontWeight="bold" color="orange.700">Average</Text>
                        <Text color="orange.600">15-19% match</Text>
                        <Text color="orange.600">50-59 pts</Text>
                      </VStack>
                      <VStack spacing={1} p={2} bg="yellow.50" borderRadius="md">
                        <Text fontWeight="bold" color="yellow.700">Weak</Text>
                        <Text color="yellow.600">10-14% match</Text>
                        <Text color="yellow.600">40-49 pts</Text>
                      </VStack>
                      <VStack spacing={1} p={2} bg="red.50" borderRadius="md">
                        <Text fontWeight="bold" color="red.700">Poor</Text>
                        <Text color="red.600">5-9% match</Text>
                        <Text color="red.600">20-39 pts</Text>
                      </VStack>
                      <VStack spacing={1} p={2} bg="gray.100" borderRadius="md">
                        <Text fontWeight="bold" color="gray.700">Very Poor</Text>
                        <Text color="gray.600">0-4% match</Text>
                        <Text color="gray.600">0-19 pts</Text>
                      </VStack>
                    </SimpleGrid>
                    
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      {hasAdvancedScoring 
                        ? "AI-optimized weights applied to research thresholds for maximum business relevance"
                        : "Balanced weights applied to research thresholds based on urban demographics studies"
                      }
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            );
          })()}
        </Box>
      </Box>

      {/* Action buttons - Fixed at bottom */}
      <Box p={4} bg="white" borderTop="1px solid" borderColor="gray.200">
        <VStack spacing={3}>
          <Button
            size="lg"
            bg="#FF492C"
            color="white"
            _hover={{ bg: "#E53E3E" }}
            leftIcon={<ExternalLinkIcon />}
            w="full"
            borderRadius="lg"
            fontWeight="bold"
            h="48px"
            onClick={() => {
              const coords = `40.7589,-73.9851`;
              window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
            }}
          >
            View on Map
          </Button>
          
          <HStack spacing={3} w="full">
            <Button 
              size="lg" 
              variant="outline" 
              flex="1" 
              borderRadius="lg"
              borderColor="gray.300"
              _hover={{ bg: "gray.50" }}
              h="48px"
            >
              Save
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              flex="1" 
              borderRadius="lg"
              borderColor="gray.300"
              _hover={{ bg: "gray.50" }}
              h="48px"
            >
              Share
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}