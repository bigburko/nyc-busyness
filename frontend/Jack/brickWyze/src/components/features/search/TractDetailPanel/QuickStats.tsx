// src/components/features/search/TractDetailPanel/QuickStats.tsx
'use client';

import { Box, VStack, SimpleGrid, Text } from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

interface QuickStatsProps {
  tract: TractResult;
  rentText: string;
  weights: Weight[];
  rentRange?: [number, number];
}

interface WeightConfig {
  id: string;
  label: string;
  icon: string;
  getValue: (tract: TractResult) => number;
  color: string;
}

interface RentInfo {
  label: string;
  color: string;
}

interface DemographicMatchInfo {
  label: string;
  color: string;
}

// Helper function to get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'green.600';
  if (score >= 60) return 'blue.600';
  if (score >= 40) return 'orange.600';
  return 'red.600';
};

// Helper function to get rent position info
const getRentPositionInfo = (currentRent: number, rentRange: [number, number]): RentInfo => {
  const [min, max] = rentRange;
  const midpoint = (min + max) / 2;
  
  if (currentRent <= min + (max - min) * 0.25) {
    return { label: 'Low-cost area', color: 'green.600' };
  }
  if (currentRent <= midpoint) {
    return { label: 'Affordable', color: 'blue.600' };
  }
  if (currentRent <= max - (max - min) * 0.25) {
    return { label: 'Premium area', color: 'orange.600' };
  }
  return { label: 'High-end market', color: 'red.600' };
};

// Helper function for demographic match info
const getDemographicMatchInfo = (score: number): DemographicMatchInfo => {
  if (score >= 70) return { label: 'Excellent', color: 'green.600' };
  if (score >= 50) return { label: 'Good', color: 'blue.600' };
  if (score >= 30) return { label: 'Fair', color: 'orange.600' };
  return { label: 'Poor', color: 'red.600' };
};

// Weight configurations
const WEIGHT_CONFIGS: WeightConfig[] = [
  {
    id: 'foot_traffic',
    label: 'Foot Traffic',
    icon: '',
    getValue: (tract) => tract.foot_traffic_score || 0,
    color: '#F59E0B'
  },
  {
    id: 'demographic',
    label: 'Demographics',
    icon: '',
    getValue: (tract) => tract.demographic_score || 0,
    color: '#8B5CF6'
  },
  {
    id: 'crime',
    label: 'Safety',
    icon: '',
    getValue: (tract) => tract.crime_score || 0,
    color: '#10B981'
  },
  {
    id: 'flood_risk',
    label: 'Flood Risk',
    icon: '',
    getValue: (tract) => tract.flood_risk_score || 0,
    color: '#06B6D4'
  },
  {
    id: 'rent_score',
    label: 'Rent Score',
    icon: '',
    getValue: (tract) => tract.rent_score || 0,
    color: '#EF4444'
  },
  {
    id: 'poi',
    label: 'POI Score',
    icon: '',
    getValue: (tract) => tract.poi_score || 0,
    color: '#F97316'
  }
];

export function QuickStats({ tract, rentText, weights, rentRange = [26, 160] }: QuickStatsProps) {
  // ✅ FIXED: Complete safety checks for all potential undefined/null values
  const getTopMetrics = (): WeightConfig[] => {
    // Add comprehensive null checks for weights array
    if (!weights || !Array.isArray(weights) || weights.length === 0) {
      console.warn('⚠️ [QuickStats] Weights is undefined or empty, using default metrics');
      return WEIGHT_CONFIGS.filter(config => 
        ['foot_traffic', 'demographic', 'crime'].includes(config.id)
      );
    }

    // Filter and sort weights by value (highest first) with additional safety checks
    const activeWeights = weights
      .filter((w: Weight) => {
        // ✅ FIXED: Enhanced validation for weight objects
        return w && 
               typeof w === 'object' && 
               typeof w.id === 'string' && 
               typeof w.value === 'number' && 
               w.value > 0 &&
               w.id.length > 0; // Ensure id is not empty string
      })
      .sort((a: Weight, b: Weight) => b.value - a.value)
      .slice(0, 3);
    
    // If no valid weights are found, use defaults
    if (activeWeights.length === 0) {
      console.warn('⚠️ [QuickStats] No valid weights found, using default metrics');
      return WEIGHT_CONFIGS.filter(config => 
        ['foot_traffic', 'demographic', 'crime'].includes(config.id)
      );
    }
    
    // Map active weights to configs and filter out undefined values
    const mappedConfigs = activeWeights
      .map((weight: Weight) => WEIGHT_CONFIGS.find(config => config.id === weight.id))
      .filter((config): config is WeightConfig => config !== undefined) // Type-safe filter
      .slice(0, 3); // Ensure we only have 3

    // If mapping failed, fallback to defaults
    if (mappedConfigs.length === 0) {
      console.warn('⚠️ [QuickStats] Weight mapping failed, using default metrics');
      return WEIGHT_CONFIGS.filter(config => 
        ['foot_traffic', 'demographic', 'crime'].includes(config.id)
      );
    }

    return mappedConfigs;
  };
  
  // ✅ FIXED: Add null check for tract as well
  if (!tract) {
    return (
      <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px solid" borderColor="gray.100">
        <Text color="gray.500">Loading tract data...</Text>
      </Box>
    );
  }

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
          // ✅ FIXED: Add safety checks for metric object and tract values
          if (!metric || typeof metric.getValue !== 'function') {
            console.warn(`⚠️ [QuickStats] Invalid metric at index ${index}`);
            return null;
          }

          const value = Math.round(metric.getValue(tract) || 0); // Default to 0 if getValue returns undefined
          const isPercentage = metric.id === 'demographic' && 
                              tract.demographic_match_pct !== null && 
                              tract.demographic_match_pct !== undefined;
          
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
          
          // Get demographic match info for special styling
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
        }).filter(Boolean)} {/* ✅ FIXED: Filter out any null components */}
      </SimpleGrid>
    </Box>
  );
}