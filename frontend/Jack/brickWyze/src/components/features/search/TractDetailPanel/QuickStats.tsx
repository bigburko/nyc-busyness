// src/components/features/search/TractDetailPanel/QuickStats.tsx - Modern Version
'use client';

import { Box, VStack, Text, SimpleGrid, HStack, Badge } from '@chakra-ui/react';
import { TractResult, WeightConfig } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

interface QuickStatsProps {
  tract: TractResult;
  rentText: string;
  weights: Weight[];
  rentRange?: [number, number];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981"; // Green
  if (score >= 60) return "#3B82F6"; // Blue  
  if (score >= 40) return "#F59E0B"; // Orange
  if (score >= 20) return "#F97316"; // Dark Orange
  return "#EF4444"; // Red
}

function getDemographicMatchInfo(matchPercent: number) {
  // Based on research-backed scoring thresholds from the system
  let label = 'Average';
  let color = '#F59E0B'; // Orange
  
  if (matchPercent >= 30) {
    label = 'High';
    color = '#10B981'; // Green - Excellent (30%+ match)
  } else if (matchPercent >= 20) {
    label = 'Medium';
    color = '#3B82F6'; // Blue - Good (20-29% match)
  } else if (matchPercent < 15) {
    label = 'Low';
    color = '#EF4444'; // Red - Poor/Very Poor (0-14% match)
  }
  // 15-19% stays as Average/Orange
  
  return { label, color };
}

function getRentPositionInfo(currentRent: number, rentRange: [number, number]) {
  const [min, max] = rentRange;
  const range = max - min;
  const position = ((currentRent - min) / range) * 100;
  
  let label = 'Medium';
  let color = '#3B82F6'; // Blue
  let bgColor = 'blue.50';
  
  if (position <= 33) {
    label = 'Low';
    color = '#10B981'; // Green
    bgColor = 'green.50';
  } else if (position >= 67) {
    label = 'High';
    color = '#F59E0B'; // Orange
    bgColor = 'orange.50';
  }
  
  return { 
    label, 
    color, 
    bgColor, 
    percentage: Math.round(Math.max(0, Math.min(100, position))) 
  };
}

// Define all possible weight configurations
const WEIGHT_CONFIGS: WeightConfig[] = [
  {
    id: 'foot_traffic',
    label: 'Foot Traffic',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.foot_traffic_score || 0,
    color: '#F59E0B'
  },
  {
    id: 'demographic',
    label: 'Demographics',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.demographic_score || 0,
    color: '#8B5CF6'
  },
  {
    id: 'crime',
    label: 'Safety',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.crime_score || 0,
    color: '#10B981'
  },
  {
    id: 'flood_risk',
    label: 'Flood Risk',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.flood_risk_score || 0,
    color: '#06B6D4'
  },
  {
    id: 'rent_score',
    label: 'Rent Score',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.rent_score || 0,
    color: '#EF4444'
  },
  {
    id: 'poi',
    label: 'POI Score',
    icon: '', // Clean design without emojis
    getValue: (tract) => tract.poi_score || 0,
    color: '#F97316'
  }
];

export function QuickStats({ tract, rentText, weights, rentRange = [26, 160] }: QuickStatsProps) {
  // Get top 3 weighted metrics, or use defaults
  const getTopMetrics = (): WeightConfig[] => {
    // Filter and sort weights by value (highest first)
    const activeWeights = weights
      .filter((w: Weight) => w.value > 0)
      .sort((a: Weight, b: Weight) => b.value - a.value)
      .slice(0, 3);
    
    // If no weights are set, use defaults
    if (activeWeights.length === 0) {
      return WEIGHT_CONFIGS.filter(config => 
        ['foot_traffic', 'demographic', 'crime'].includes(config.id)
      );
    }
    
    // Map active weights to configs and filter out undefined values
    return activeWeights
      .map((weight: Weight) => WEIGHT_CONFIGS.find(config => config.id === weight.id))
      .filter((config): config is WeightConfig => config !== undefined) // Type-safe filter
      .slice(0, 3); // Ensure we only have 3
  };
  
  const topMetrics = getTopMetrics();
  const currentRent = tract.avg_rent || 0;
  const rentInfo = getRentPositionInfo(currentRent, rentRange);
  
  return (
    <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
      <SimpleGrid columns={2} spacing={6}>
        {/* Rent - Always first and prominent */}
        <Box p={4} bg="gray.50" borderRadius="lg" position="relative">
          <VStack spacing={3} align="start">
            <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wide">
              Rent PSF
            </Text>
            
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">
              ${rentText}
            </Text>
            
            <Text fontSize="xs" color={rentInfo.color} fontWeight="semibold">
              {rentInfo.label}
            </Text>
          </VStack>
        </Box>
        
        {/* Top 3 weighted metrics */}
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
          
          // Get demographic match info for special styling using research-backed thresholds
          const isDemographic = metric.id === 'demographic';
          const demographicInfo = isDemographic && isPercentage 
            ? getDemographicMatchInfo(scoreForColor) 
            : null;
          
          return (
            <Box key={`${metric.id}-${index}`} p={4} bg="gray.50" borderRadius="lg">
              <VStack spacing={3} align="start">
                <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wide">
                  {metric.label}
                </Text>
                
                <Text fontSize="2xl" fontWeight="bold" color={scoreColor}>
                  {displayValue}
                </Text>
                
                <Text fontSize="xs" color={demographicInfo ? demographicInfo.color : "gray.600"} fontWeight={demographicInfo ? "semibold" : "normal"}>
                  {isDemographic && demographicInfo 
                    ? `${demographicInfo.label} match` 
                    : (isPercentage ? "demographic match" : "score out of 100")
                  }
                </Text>
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}