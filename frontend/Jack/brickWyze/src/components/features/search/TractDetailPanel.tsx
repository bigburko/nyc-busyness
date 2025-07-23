// src/components/features/search/TractDetailPanel.tsx - CLEANED VERSION
'use client';

import { 
  Box, VStack, HStack, Text, Button, IconButton, SimpleGrid, Progress, Flex
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useFilterStore } from '../../../stores/filterStore';

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
            🚶 Foot Traffic by Time Period
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
            🚶 Foot Traffic Score
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
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          🚶 Foot Traffic by Time Period (6-Year View) 📊
        </Text>

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
                <Text>🌅 Morning</Text>
              </HStack>
            )}
            {activePeriods.includes('afternoon') && (
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#3B82F6" borderRadius="sm" />
                <Text>☀️ Afternoon</Text>
              </HStack>
            )}
            {activePeriods.includes('evening') && (
              <HStack spacing={1}>
                <Box w="8px" h="8px" bg="#6366F1" borderRadius="sm" />
                <Text>🌙 Evening</Text>
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
        <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
          🚶 Foot Traffic Trend (6-Year View) 📊
        </Text>

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
      <Text fontSize="lg" fontWeight="bold" mb={2} color="gray.800">
        🚶 Foot Traffic Score
      </Text>
      <Text fontSize="3xl" fontWeight="bold" color="#4299E1" textAlign="center">
        {currentScore}/100
      </Text>
    </Box>
  );
}

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
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
        🛡️ Safety Score Trend (6-Year View) {hasRealData ? '📊' : '🔮'}
      </Text>

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

export default function TractDetailPanel({ tract, onClose }: TractDetailPanelProps) {
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

        {/* Quick stats grid */}
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

        {/* Score breakdown */}
        <Box p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
            📊 Score Breakdown
          </Text>
          <VStack spacing={6}>
            <ScoreMeter
              label="Foot Traffic"
              score={tract.foot_traffic_score || 0}
              color="#4299E1"
              icon="🚶"
            />
            <ScoreMeter
              label="Demographics"
              score={tract.demographic_score || 0}
              color="#48BB78"
              icon="👥"
            />
            <ScoreMeter
              label="Safety Score"
              score={tract.crime_score || 0}
              color="#10B981"
              icon="🛡️"
            />
            <ScoreMeter
              label="Flood Risk"
              score={tract.flood_risk_score || 0}
              color="#38B2AC"
              icon="🌊"
            />
            <ScoreMeter
              label="Rent Score"
              score={tract.rent_score || 0}
              color="#ED8936"
              icon="💰"
            />
            <ScoreMeter
              label="Points of Interest"
              score={tract.poi_score || 0}
              color="#9F7AEA"
              icon="📍"
            />
          </VStack>
        </Box>

        {/* Demographic details */}
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