// src/components/features/search/TractDetailPanel/KeyMetricPills.tsx
'use client';

import { Box, VStack, Text, HStack, Badge } from '@chakra-ui/react';
import { TractResult, WeightConfig } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

interface KeyMetricPillsProps {
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

function getScoreBg(score: number): string {
  if (score >= 80) return "green.50"; 
  if (score >= 60) return "blue.50";   
  if (score >= 40) return "orange.50"; 
  if (score >= 20) return "orange.100"; 
  return "red.50"; 
}

function getScoreBorder(score: number): string {
  if (score >= 80) return "green.200"; 
  if (score >= 60) return "blue.200";   
  if (score >= 40) return "orange.200"; 
  if (score >= 20) return "orange.300"; 
  return "red.200"; 
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
    label: 'Safety',
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
    label: 'Rent Value',
    icon: '💰',
    getValue: (tract) => tract.rent_score || 0,
    color: '#ED8936'
  },
  {
    id: 'poi',
    label: 'Amenities',
    icon: '📍',
    getValue: (tract) => tract.poi_score || 0,
    color: '#9F7AEA'
  }
];

export function KeyMetricPills({ tract, rentText, weights }: KeyMetricPillsProps) {
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
      .filter((config): config is WeightConfig => config !== undefined)
      .slice(0, 3);
  };
  
  const topMetrics = getTopMetrics();
  
  return (
    <Box p={6} bg="gray.50">
      <VStack spacing={4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800" textAlign="center">
          🎯 Key Metrics
        </Text>
        
        {/* Rent - Always first and prominent */}
        <Box 
          p={4} 
          bg="white" 
          borderRadius="xl" 
          border="2px solid" 
          borderColor="gray.300"
          w="full"
          boxShadow="sm"
        >
          <VStack spacing={2}>
            <HStack spacing={2}>
              <Text fontSize="2xl">🏢</Text>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Rent Cost
              </Text>
            </HStack>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              ${rentText}
            </Text>
            <Text fontSize="sm" color="gray.600">
              per square foot
            </Text>
          </VStack>
        </Box>
        
        {/* Top 3 Metrics as Pills */}
        <VStack spacing={3} w="full">
          {topMetrics.map((metric: WeightConfig, index: number) => {
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
            const scoreBg = getScoreBg(scoreForColor);
            const scoreBorder = getScoreBorder(scoreForColor);
            
            return (
              <Box 
                key={`pill-${metric.id}-${index}`}
                p={4} 
                bg={scoreBg}
                borderRadius="xl" 
                border="1px solid" 
                borderColor={scoreBorder}
                w="full"
                _hover={{ transform: "scale(1.02)", transition: "all 0.2s" }}
                cursor="default"
              >
                <HStack justify="space-between" w="full">
                  <HStack spacing={3}>
                    <Text fontSize="xl">{metric.icon}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="md" fontWeight="semibold" color="gray.700">
                        {metric.label}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {isPercentage ? "match rate" : "score out of 100"}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <VStack align="end" spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color={scoreColor}>
                      {displayValue}
                    </Text>
                    {/* Score quality badge */}
                    <Badge 
                      bg={scoreColor} 
                      color="white" 
                      fontSize="xs" 
                      borderRadius="full"
                      px={2}
                    >
                      {scoreForColor >= 80 ? "Excellent" : 
                       scoreForColor >= 60 ? "Good" : 
                       scoreForColor >= 40 ? "Fair" : 
                       scoreForColor >= 20 ? "Poor" : "Very Poor"}
                    </Badge>
                  </VStack>
                </HStack>
              </Box>
            );
          })}
        </VStack>
        
        {/* Quick Summary */}
        <Box 
          p={3} 
          bg="blue.50" 
          borderRadius="lg" 
          border="1px solid" 
          borderColor="blue.200"
          w="full"
        >
          <Text fontSize="sm" color="blue.700" textAlign="center" lineHeight="1.5">
            <strong>Quick Take:</strong> {
              topMetrics.filter(m => {
                const val = m.id === 'demographic' && tract.demographic_match_pct 
                  ? (tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100)
                  : m.getValue(tract);
                return val >= 70;
              }).length >= 2
                ? "💚 Strong performance across key metrics"
                : topMetrics.filter(m => {
                    const val = m.id === 'demographic' && tract.demographic_match_pct 
                      ? (tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100)
                      : m.getValue(tract);
                    return val >= 50;
                  }).length >= 2
                ? "🟡 Mixed performance with room for improvement"
                : "🔴 Consider other locations for better alignment"
            }
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}