// src/components/features/search/TractDetailPanel.tsx
'use client';

import { 
  Box, VStack, HStack, Text, Button, IconButton, SimpleGrid, Progress, Flex
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';

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
  flood_risk_score?: number; // ✅ FIXED: Made optional to match other components
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
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

// Score meter component
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
  const percentage = Math.min((score / max) * 100, 100);
  
  return (
    <Box w="full">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          {icon} {label}
        </Text>
        <Text fontSize="md" fontWeight="bold" color={color}>
          {Math.round(score)}/{max}
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

// ✅ SIMPLE Crime trend chart - timeline data is already 0-100, other scores are 0-1
function CrimeTrendChart({ tract }: { tract: TractResult }) {
  // ✅ FIX: Current score needs * 100, but timeline data is already 0-100
  const currentScore = Math.round((tract.crime_score || 0.1) * 100);
  
  // Check if we have real crime timeline data
  const hasRealData = tract.crime_timeline && Object.keys(tract.crime_timeline).length > 0;
  
  let chartData = [];
  
  if (hasRealData && tract.crime_timeline) {
    // ✅ FIX: Timeline data might be 0-10 scale, divide by 10 to get 0-100
    chartData = [
      { year: '2021', value: Math.round((tract.crime_timeline.year_2021 || 0) / 10 * 100) },
      { year: '2022', value: Math.round((tract.crime_timeline.year_2022 || 0) / 10 * 100) },
      { year: '2023', value: Math.round((tract.crime_timeline.year_2023 || 0) / 10 * 100) },
      { year: '2024', value: Math.round((tract.crime_timeline.year_2024 || 0) / 10 * 100) },
      { year: '2025', value: Math.round((tract.crime_timeline.pred_2025 || 0) / 10 * 100) },
      { year: '2026', value: Math.round((tract.crime_timeline.pred_2026 || 0) / 10 * 100) },
      { year: '2027', value: Math.round((tract.crime_timeline.pred_2027 || 0) / 10 * 100) },
    ]; // ✅ FIX: Don't filter out zero values - keep all 7 years
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
  
  // ✅ FIX: Use logarithmic scaling to amplify small differences
  const range = maxValue - minValue;
  const hasVariation = range > 1;
  
  let effectiveMin, effectiveMax;
  
  if (!hasVariation) {
    // For identical/similar values, use log scaling around the average
    const avgValue = (maxValue + minValue) / 2;
    effectiveMin = Math.max(1, avgValue - 8); // Wider range for log scale
    effectiveMax = avgValue + 8;
  } else {
    // Use actual range with padding
    effectiveMin = Math.max(1, minValue - 3);
    effectiveMax = maxValue + 3;
  }
  
  // ✅ Logarithmic height calculation function
  const getLogHeight = (value: number) => {
    // Ensure value is at least 1 for log calculation
    const safeValue = Math.max(1, value);
    const safeMin = Math.max(1, effectiveMin);
    const safeMax = Math.max(2, effectiveMax);
    
    // Use natural log for scaling
    const logValue = Math.log(safeValue);
    const logMin = Math.log(safeMin);
    const logMax = Math.log(safeMax);
    
    // Scale to 60-180px range (much taller bars)
    const logRange = logMax - logMin;
    const normalizedLog = logRange > 0 ? (logValue - logMin) / logRange : 0.5;
    
    return Math.max(60, 60 + (normalizedLog * 120)); // 60px minimum, up to 180px
  };

  return (
    <Box w="full">
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
        🛡️ Safety Score Trend (7-Year View) {hasRealData ? '📊' : '🔮'}
      </Text>

      <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" boxShadow="sm">
        {/* ✅ FIX: Much taller container for bigger bars */}
        <Flex justify="space-between" align="end" h="220px" mb={3} px={1}>
          {chartData.map((item, index) => {
            const isPast = index < 4;
            const isCurrent = index === 4;
            // ✅ FIX: Use logarithmic height calculation
            const height = getLogHeight(item.value);
            
            return (
              <VStack key={`chart-${item.year}`} spacing={1} flex="1" align="center">
                {/* ✅ FIX: Smaller font and better spacing */}
                <Text fontSize="10px" fontWeight="bold" color="gray.700" lineHeight="1">
                  {item.value}
                </Text>
                <Box
                  bg={isPast ? "#9CA3AF" : isCurrent ? "#10B981" : "#60A5FA"}
                  h={`${height}px`}
                  w="22px"
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
        
        <HStack justify="center" spacing={6} fontSize="xs" color="gray.600" py={2}>
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
            <Text>2-Year Forecast</Text>
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
  // ✅ FIX: Scores are 0-1 decimals, need to multiply by 100
  const resilienceScore = Math.round((tract.custom_score || 0) * 100);
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
                🚶 {Math.round((tract.foot_traffic_score || 0) * 100)}
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
                  // ✅ FIX: Check if value is already a percentage (>1) or decimal (0-1)
                  const rawValue = tract.demographic_match_pct || 0;
                  let displayValue;
                  
                  if (rawValue > 1) {
                    // Already a percentage, just round it
                    displayValue = Math.round(rawValue);
                  } else {
                    // It's a decimal, convert to percentage
                    displayValue = Math.round(rawValue * 100);
                  }
                  
                  // Cap at 100% maximum
                  displayValue = Math.min(displayValue, 100);
                  
                  return `${displayValue}%`;
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
              {(() => {
                const safetyScore = Math.round((tract.crime_score || 0) * 100);
                
                // ✅ FIXED: Simpler trend detection
                let trendStatus = "Stable";
                let trendColor = "#6B7280"; // Gray for stable
                
                if (tract.crime_timeline) {
                  // Get the raw values and convert them properly
                  const raw2025 = tract.crime_timeline.pred_2025 || 0;
                  const raw2026 = tract.crime_timeline.pred_2026 || 0;
                  const raw2027 = tract.crime_timeline.pred_2027 || 0;
                  
                  // Convert to display values (same as chart)
                  const val2025 = Math.round((raw2025 / 10) * 100);
                  const val2026 = Math.round((raw2026 / 10) * 100);
                  const val2027 = Math.round((raw2027 / 10) * 100);
                  
                  // Compare 2025 to 2027 (2-year trend)
                  const trendChange = val2027 - val2025;
                  
                  console.log('🔍 Safety Trend Debug:', {
                    raw: { 2025: raw2025, 2026: raw2026, 2027: raw2027 },
                    converted: { 2025: val2025, 2026: val2026, 2027: val2027 },
                    change: trendChange
                  });
                  
                  // More sensitive thresholds
                  if (trendChange > 0.5) {
                    trendStatus = "Increasing";
                    trendColor = "#10B981"; // Green for improving
                  } else if (trendChange < -0.5) {
                    trendStatus = "Declining";
                    trendColor = "#E53E3E"; // Red for declining
                  }
                } else {
                  // Fallback to simple score-based check if no timeline
                  if (safetyScore > 85) {
                    trendStatus = "Increasing";
                    trendColor = "#10B981";
                  } else if (safetyScore < 50) {
                    trendStatus = "Declining";
                    trendColor = "#E53E3E";
                  }
                }
                
                return (
                  <>
                    <Text fontSize="2xl" fontWeight="bold" color={trendColor}>
                      🛡️ {trendStatus}
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Safety
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {safetyScore}/100
                    </Text>
                  </>
                );
              })()}
            </VStack>
          </SimpleGrid>
        </Box>

        {/* Score breakdown */}
        <Box p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={6} color="gray.800">
            📊 Score Breakdown
          </Text>
          <VStack spacing={6}>
            <ScoreMeter
              label="Foot Traffic"
              score={Math.round((tract.foot_traffic_score || 0) * 100)}
              color="#4299E1"
              icon="🚶"
            />
            <ScoreMeter
              label="Demographics"
              score={Math.round((tract.demographic_score || 0) * 100)}
              color="#48BB78"
              icon="👥"
            />
            <ScoreMeter
              label="Safety Score"
              score={Math.round((tract.crime_score || 0) * 100)}
              color="#10B981"
              icon="🛡️"
            />
            <ScoreMeter
              label="Flood Risk"
              score={Math.round((tract.flood_risk_score || 0) * 100)}
              color="#38B2AC"
              icon="🌊"
            />
            <ScoreMeter
              label="Rent Score"
              score={Math.round((tract.rent_score || 0) * 100)}
              color="#ED8936"
              icon="💰"
            />
            <ScoreMeter
              label="Points of Interest"
              score={Math.round((tract.poi_score || 0) * 100)}
              color="#9F7AEA"
              icon="📍"
            />
          </VStack>
        </Box>

        {/* Crime Trend Chart */}
        <Box p={6}>
          <CrimeTrendChart tract={tract} />
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