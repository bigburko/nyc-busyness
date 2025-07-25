// src/components/features/search/TractDetailPanel/QuickStats.tsx
'use client';

import { Box, VStack, Text, SimpleGrid } from '@chakra-ui/react';
import { TractResult, WeightConfig } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

interface QuickStatsProps {
  tract: TractResult;
  rentText: string;
  weights: Weight[];
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

export function QuickStats({ tract, rentText, weights }: QuickStatsProps) {
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
  
  return (
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
  );
}