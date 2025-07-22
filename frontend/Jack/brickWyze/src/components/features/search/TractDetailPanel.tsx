// src/components/features/search/TractDetailPanel.tsx - COMPLETE WITH ENHANCED FOOT TRAFFIC CHART
'use client';

import { 
  Box, VStack, HStack, Text, Button, IconButton, SimpleGrid, Progress, Flex
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';

// ✅ FIXED: Use exact interface that matches your existing data structure
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
  
  // ✅ NEW: Optional foot traffic timeline data (will be undefined if not available)
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

// Score meter component - ✅ FIXED: Handles 0-100 scale properly
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
  // ✅ FIXED: Scores are already 0-100, no conversion needed
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

// ✅ ENHANCED: Foot traffic chart with period data support
function FootTrafficChart({ tract }: { tract: TractResult }) {
  console.log('🔍 [TractDetailPanel FootTrafficChart] Processing data for:', tract.tract_name);
  console.log('🔍 [TractDetailPanel FootTrafficChart] foot_traffic_by_period:', tract.foot_traffic_by_period);
  console.log('🔍 [TractDetailPanel FootTrafficChart] foot_traffic_timeline:', tract.foot_traffic_timeline);
  
  const currentScore = Math.round(tract.foot_traffic_score || 50);
  
  // Check if we have period data (the rich data from your API)
  const hasperiodData = tract.foot_traffic_by_period && 
    Object.keys(tract.foot_traffic_by_period).length > 0;
  
  // Check if we have timeline data (simpler fallback)
  const hasTimelineData = tract.foot_traffic_timeline && 
    Object.keys(tract.foot_traffic_timeline).length > 0;

  console.log('🔍 [TractDetailPanel FootTrafficChart] hasperiodData:', hasperiodData);
  console.log('🔍 [TractDetailPanel FootTrafficChart] hasTimelineData:', hasTimelineData);

  // If we have the rich period data, use it!
  if (hasperiodData && tract.foot_traffic_by_period) {
    const periods = tract.foot_traffic_by_period;
    const years = ['2019', '2020', '2021', '2022', '2023', '2024', 'pred_2025', 'pred_2026', 'pred_2027'];
    
    // Process period data into chart format
    const chartData = years.map(year => {
      const morning = periods.morning?.[year] || 0;
      const afternoon = periods.afternoon?.[year] || 0;  
      const evening = periods.evening?.[year] || 0;
      
      return {
        year: year.replace('pred_', ''),
        morning: Math.round(morning),
        afternoon: Math.round(afternoon), 
        evening: Math.round(evening),
        isPrediction: year.startsWith('pred_')
      };
    }).filter(item => item.morning > 0 || item.afternoon > 0 || item.evening > 0);
    
    console.log('🔍 [TractDetailPanel FootTrafficChart] Processed chart data:', chartData);
    
    if (chartData.length === 0) {
      return (
        <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.800">
            🚶 Foot Traffic Score
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
            {currentScore}/100
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            Period data available but no valid years found
          </Text>
        </Box>
      );
    }

    const maxValue = Math.max(
      ...chartData.flatMap(d => [d.morning, d.afternoon, d.evening])
    );
    const minValue = Math.min(
      ...chartData.flatMap(d => [d.morning, d.afternoon, d.evening])
    );
    
    // Logarithmic scaling for better visualization
    const getHeight = (value: number) => {
      if (value <= 0) return 20;
      const logValue = Math.log10(value + 1);
      const maxLog = Math.log10(maxValue + 1);
      const minLog = Math.log10(minValue + 1);
      const range = maxLog - minLog;
      
      if (range === 0) return 60;
      
      const normalizedValue = (logValue - minLog) / range;
      return Math.max(30, 30 + (normalizedValue * 100));
    };

    return (
      <Box w="full">
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          🚶 Foot Traffic by Time Period (9-Year View) 📊
        </Text>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
          {/* Chart */}
          <Box overflowX="auto" mb={4}>
            <Flex justify="space-between" align="end" h="200px" mb={3} px={1} minW="400px">
              {chartData.map((item, index) => {
                const isPast = parseInt(item.year) < 2025;
                const isCurrent = item.year === '2025';
                
                return (
                  <VStack key={`ft-period-${item.year}`} spacing={2} flex="1" align="center" minW="35px">
                    {/* Values on top */}
                    <VStack spacing={0}>
                      <Text fontSize="8px" fontWeight="bold" color="#F59E0B" lineHeight="1">
                        {item.morning}
                      </Text>
                      <Text fontSize="8px" fontWeight="bold" color="#3B82F6" lineHeight="1">
                        {item.afternoon}  
                      </Text>
                      <Text fontSize="8px" fontWeight="bold" color="#6366F1" lineHeight="1">
                        {item.evening}
                      </Text>
                    </VStack>
                    
                    {/* Bars */}
                    <HStack spacing="1px" align="end">
                      {/* Morning */}
                      <Box
                        bg={isPast ? "#FCD34D" : isCurrent ? "#F59E0B" : "#FDE68A"}
                        h={`${getHeight(item.morning)}px`}
                        w="8px"
                        borderRadius="sm"
                        opacity={isPast ? 0.7 : 1}
                      />
                      
                      {/* Afternoon */}
                      <Box
                        bg={isPast ? "#60A5FA" : isCurrent ? "#3B82F6" : "#93C5FD"}
                        h={`${getHeight(item.afternoon)}px`}
                        w="8px"
                        borderRadius="sm"
                        opacity={isPast ? 0.7 : 1}
                      />
                      
                      {/* Evening */}
                      <Box
                        bg={isPast ? "#8B5CF6" : isCurrent ? "#6366F1" : "#A5B4FC"}
                        h={`${getHeight(item.evening)}px`}
                        w="8px"
                        borderRadius="sm"
                        opacity={isPast ? 0.7 : 1}
                      />
                    </HStack>
                    
                    {/* Year label */}
                    <Text fontSize="xs" color="gray.500" fontWeight={isCurrent ? "bold" : "normal"}>
                      {item.year}
                    </Text>
                  </VStack>
                );
              })}
            </Flex>
          </Box>
          
          {/* Legend */}
          <VStack spacing={2}>
            <HStack justify="center" spacing={6} fontSize="xs" color="gray.600">
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#F59E0B" borderRadius="sm" />
                <Text>🌅 Morning</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#3B82F6" borderRadius="sm" />
                <Text>☀️ Afternoon</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#6366F1" borderRadius="sm" />
                <Text>🌙 Evening</Text>
              </HStack>
            </HStack>
            
            <HStack justify="center" spacing={4} fontSize="xs" color="gray.600">
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="gray.400" borderRadius="sm" opacity={0.7} />
                <Text>Historical</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#F59E0B" borderRadius="sm" />
                <Text fontWeight="bold">Current</Text>
              </HStack>
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#93C5FD" borderRadius="sm" />
                <Text>Forecast</Text>
              </HStack>
            </HStack>
          </VStack>
          
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={3}>
            Period-based data - Current overall: {currentScore}/100
          </Text>
          
          {/* Debug info */}
          <Box mt={2} p={2} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <Text fontSize="xs" color="blue.700">
              📊 Chart Data: {chartData.length} years, Using foot_traffic_by_period data
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // Fallback: Use timeline data if available 
  if (hasTimelineData && tract.foot_traffic_timeline) {
    const timeline = tract.foot_traffic_timeline;
    const chartData = [
      { year: '2019', value: Math.round(timeline['2019'] || 0) },
      { year: '2020', value: Math.round(timeline['2020'] || 0) },
      { year: '2021', value: Math.round(timeline['2021'] || 0) },
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
      const normalizedValue = (value - minValue) / range;
      return Math.max(40, 40 + (normalizedValue * 120));
    };

    return (
      <Box w="full">
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          🚶 Foot Traffic Trend (9-Year View) 📊
        </Text>

        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
          <Flex justify="space-between" align="end" h="200px" mb={3} px={1}>
            {chartData.map((item, index) => {
              const isPast = index < 6;
              const isCurrent = index === 6; 
              const height = getHeight(item.value);
              
              return (
                <VStack key={`ft-timeline-${item.year}`} spacing={1} flex="1" align="center">
                  <Text fontSize="9px" fontWeight="bold" color="gray.700" lineHeight="1">
                    {item.value}
                  </Text>
                  <Box
                    bg={isPast ? "#6B7280" : isCurrent ? "#4299E1" : "#60A5FA"}
                    h={`${height}px`}
                    w="18px"
                    borderRadius="md"
                    boxShadow="sm"
                  />
                  <Text fontSize="xs" color="gray.500" fontWeight={isCurrent ? "bold" : "normal"}>
                    {item.year}
                  </Text>
                </VStack>
              );
            })}
          </Flex>
          
          <HStack justify="center" spacing={4} fontSize="xs" color="gray.600" py={2}>
            <HStack spacing={1}>
              <Box w="8px" h="8px" bg="#6B7280" borderRadius="sm" />
              <Text>Historical</Text>
            </HStack>
            <HStack spacing={1}>
              <Box w="8px" h="8px" bg="#4299E1" borderRadius="sm" />
              <Text fontWeight="bold">Current</Text>
            </HStack>
            <HStack spacing={1}>
              <Box w="8px" h="8px" bg="#60A5FA" borderRadius="sm" />
              <Text>Forecast</Text>
            </HStack>
          </HStack>
          
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
            Timeline data - Current: {currentScore}/100
          </Text>
        </Box>
      </Box>
    );
  }

  // Final fallback: Show current score only
  return (
    <Box w="full" p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
      <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.800">
        🚶 Foot Traffic Score
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
        {currentScore}/100
      </Text>
      <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
        No historical data available
      </Text>
    </Box>
  );
}

// ✅ FIXED: Crime trend chart - Updated for 0-100 scale
function CrimeTrendChart({ tract }: { tract: TractResult }) {
  // ✅ FIXED: Scores are already 0-100 scale
  const currentScore = Math.round(tract.crime_score || 50);
  
  const hasRealData = tract.crime_timeline && Object.keys(tract.crime_timeline).length > 0;
  
  let chartData = [];
  
  if (hasRealData && tract.crime_timeline) {
    // ✅ FIXED: Timeline data is already 0-100 scale
    chartData = [
      { year: '2021', value: Math.round(tract.crime_timeline.year_2021 || 0) },
      { year: '2022', value: Math.round(tract.crime_timeline.year_2022 || 0) },
      { year: '2023', value: Math.round(tract.crime_timeline.year_2023 || 0) },
      { year: '2024', value: Math.round(tract.crime_timeline.year_2024 || 0) },
      { year: '2025', value: Math.round(tract.crime_timeline.pred_2025 || 0) },
      { year: '2026', value: Math.round(tract.crime_timeline.pred_2026 || 0) },
      { year: '2027', value: Math.round(tract.crime_timeline.pred_2027 || 0) },
    ];
  } else {
    // Fallback to calculated data
    chartData = [
      { year: '2021', value: Math.round(currentScore * 0.75) },
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
    const range = maxValue - minValue;
    if (range < 5) {
      // For small ranges, use fixed heights
      return 80;
    }
    const normalizedValue = (value - minValue) / range;
    return Math.max(60, 60 + (normalizedValue * 100));
  };

  return (
    <Box w="full">
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
        🛡️ Safety Score Trend (7-Year View) {hasRealData ? '📊' : '🔮'}
      </Text>

      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
        <Flex justify="space-between" align="end" h="180px" mb={3} px={1}>
          {chartData.map((item, index) => {
            const isPast = index < 4;
            const isCurrent = index === 4;
            const height = getHeight(item.value);
            
            return (
              <VStack key={`crime-chart-${item.year}`} spacing={1} flex="1" align="center">
                <Text fontSize="9px" fontWeight="bold" color="gray.700" lineHeight="1">
                  {item.value}
                </Text>
                <Box
                  bg={isPast ? "#9CA3AF" : isCurrent ? "#10B981" : "#60A5FA"}
                  h={`${height}px`}
                  w="20px"
                  borderRadius="md"
                  boxShadow="sm"
                />
                <Text fontSize="xs" color="gray.500" fontWeight={isCurrent ? "bold" : "normal"}>
                  {item.year}
                </Text>
              </VStack>
            );
          })}
        </Flex>
        
        <HStack justify="center" spacing={4} fontSize="xs" color="gray.600" py={2}>
          <HStack spacing={1}>
            <Box w="8px" h="8px" bg="#9CA3AF" borderRadius="sm" />
            <Text>Historical</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w="8px" h="8px" bg="#10B981" borderRadius="sm" />
            <Text fontWeight="bold">Current</Text>
          </HStack>
          <HStack spacing={1}>
            <Box w="8px" h="8px" bg="#60A5FA" borderRadius="sm" />
            <Text>Forecast</Text>
          </HStack>
        </HStack>
        
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
          {hasRealData ? 'Real data from API' : 'Simulated data'} - Current: {currentScore}/100
        </Text>
      </Box>
    </Box>
  );
}

// Get color based on resilience score
function getResilienceColor(score: number): string {
  if (score >= 80) return "#10B981"; // High (green)
  if (score >= 60) return "#3B82F6"; // Good (blue)  
  if (score >= 40) return "#F59E0B"; // Fair (yellow)
  if (score >= 20) return "#F97316"; // Low (orange)
  return "#EF4444"; // Very Low (red)
}

function getResilienceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Low";
  return "Very Low";
}

export default function TractDetailPanel({ tract, onClose }: TractDetailPanelProps) {
  // ✅ FIXED: Scores are already 0-100 scale
  const resilienceScore = Math.round(tract.custom_score || 0);
  const rentText = tract.avg_rent ? `${tract.avg_rent.toFixed(2)}` : 'N/A';
  const resilienceColor = getResilienceColor(resilienceScore);
  const resilienceLabel = getResilienceLabel(resilienceScore);
  
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

        {/* Tract info section */}
        <Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              🏘️ {tract.tract_name}
            </Text>
            <Text fontSize="lg" color="gray.600" fontWeight="medium">
              {tract.nta_name}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Census Tract {tract.geoid}
            </Text>
          </VStack>
        </Box>

        {/* Quick stats grid - ✅ FIXED: Updated for 0-100 scale */}
        <Box p={6} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
          <SimpleGrid columns={2} spacing={6}>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                🏠 ${rentText}
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Rent PSF
              </Text>
              <Text fontSize="xs" color="gray.500">
                per sq ft
              </Text>
            </VStack>
            
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="#4299E1">
                🚶 {Math.round(tract.foot_traffic_score || 0)}
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Foot Traffic
              </Text>
              <Text fontSize="xs" color="gray.500">
                out of 100
              </Text>
            </VStack>
            
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                👥 {(() => {
                  const rawValue = tract.demographic_match_pct || 0;
                  const displayValue = rawValue > 1 ? Math.round(rawValue) : Math.round(rawValue * 100);
                  return `${Math.min(displayValue, 100)}%`;
                })()}
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Ethnicity Fit
              </Text>
              <Text fontSize="xs" color="gray.500">
                match rate
              </Text>
            </VStack>
            
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="#10B981">
                🛡️ {Math.round(tract.crime_score || 0)}
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Safety Score
              </Text>
              <Text fontSize="xs" color="gray.500">
                out of 100
              </Text>
            </VStack>
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

        {/* Score breakdown - ✅ FIXED: Updated for 0-100 scale */}
        <Box p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
            📊 Score Breakdown
          </Text>
          <VStack spacing={6}>
            <ScoreMeter
              label="Foot Traffic"
              score={tract.foot_traffic_score || 0} // Already 0-100
              color="#4299E1"
              icon="🚶"
            />
            <ScoreMeter
              label="Demographics"
              score={tract.demographic_score || 0} // Already 0-100
              color="#48BB78"
              icon="👥"
            />
            <ScoreMeter
              label="Safety Score"
              score={tract.crime_score || 0} // Already 0-100
              color="#10B981"
              icon="🛡️"
            />
            <ScoreMeter
              label="Flood Risk"
              score={tract.flood_risk_score || 0} // Already 0-100
              color="#38B2AC"
              icon="🌊"
            />
            <ScoreMeter
              label="Rent Score"
              score={tract.rent_score || 0} // Already 0-100
              color="#ED8936"
              icon="💰"
            />
            <ScoreMeter
              label="Points of Interest"
              score={tract.poi_score || 0} // Already 0-100
              color="#9F7AEA"
              icon="📍"
            />
          </VStack>
        </Box>

        {/* Demographic details - ✅ FIXED: Proper percentage calculations */}
        <Box p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
            👥 Demographic Details
          </Text>
          <VStack spacing={6}>
            {tract.age_match_pct && (
              <ScoreMeter
                label="Age Match"
                score={(() => {
                  const raw = tract.age_match_pct || 0;
                  return raw > 1 ? Math.min(raw, 100) : Math.min(raw * 100, 100);
                })()}
                color="#4299E1"
                icon="🎂"
              />
            )}
            {tract.income_match_pct && (
              <ScoreMeter
                label="Income Match"
                score={(() => {
                  const raw = tract.income_match_pct || 0;
                  return raw > 1 ? Math.min(raw, 100) : Math.min(raw * 100, 100);
                })()}
                color="#48BB78"
                icon="💵"
              />
            )}
            {tract.gender_match_pct && (
              <ScoreMeter
                label="Gender Match"
                score={(() => {
                  const raw = tract.gender_match_pct || 0;
                  return raw > 1 ? Math.min(raw, 100) : Math.min(raw * 100, 100);
                })()}
                color="#ED8936"
                icon="⚖️"
              />
            )}
          </VStack>
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