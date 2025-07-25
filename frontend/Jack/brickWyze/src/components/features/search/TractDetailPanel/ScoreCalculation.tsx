// src/components/features/search/TractDetailPanel/ScoreCalculation.tsx
'use client';

import { 
  Box, VStack, HStack, Text, Progress, SimpleGrid
} from '@chakra-ui/react';
import MyToolTip from '../../../ui/MyToolTip';
import { TractResult, WeightConfig } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

interface ScoreCalculationProps {
  tract: TractResult;
  weights: Weight[];
  resilienceScore: number;
}

interface ContributionItem extends WeightConfig {
  score: number;
  weight: number;
  contribution: number;
  contributionPercent: number;
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

export function ScoreCalculation({ tract, weights, resilienceScore }: ScoreCalculationProps) {
  // Get current weights from filter store
  const currentWeights = weights.filter((w: Weight) => w.value > 0);
  
  // Default weights when none are set
  const DEFAULT_WEIGHTS: Weight[] = [
    { id: 'foot_traffic', value: 45 },
    { id: 'crime', value: 25 },
    { id: 'flood_risk', value: 15 },
    { id: 'rent_score', value: 10 },
    { id: 'poi', value: 5 }
  ];
  
  // Use current weights or defaults
  const activeWeights = currentWeights.length > 0 ? currentWeights : DEFAULT_WEIGHTS;
  
  // Calculate contributions
  const contributions = activeWeights
    .map((weight: Weight): ContributionItem | null => {
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
    })
    .filter((item): item is ContributionItem => item !== null);
  
  // Sort by contribution (highest first)
  contributions.sort((a: ContributionItem, b: ContributionItem) => b.contribution - a.contribution);
  
  return (
    <Box p={6}>
      <HStack mb={6} align="center" spacing={3}>
        <Text fontSize="xl" fontWeight="bold" color="gray.800">
          📊 Score Calculation
        </Text>
        <MyToolTip label="Score Calculation">
          Shows how your current weights contribute to the final resilience score, with exact calculations
        </MyToolTip>
      </HStack>
      
      <VStack spacing={6}>
        {currentWeights.length === 0 ? (
          <>
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
              {contributions.map((item: ContributionItem, index: number) => (
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
          </>
        ) : (
          <>
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
              {contributions.map((item: ContributionItem, index: number) => (
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
                !activeWeights.some((w: Weight) => w.id === config.id)
              );
              
              if (unweightedFactors.length === 0) return null;
              
              return (
                <Box w="full" mt={4}>
                  <Text fontSize="sm" color="gray.500" mb={3} textAlign="center">
                    💡 Other available factors (not currently weighted)
                  </Text>
                  <SimpleGrid columns={2} spacing={3}>
                    {unweightedFactors.map((factor: WeightConfig, index: number) => {
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
          </>
        )}
      </VStack>
    </Box>
  );
}