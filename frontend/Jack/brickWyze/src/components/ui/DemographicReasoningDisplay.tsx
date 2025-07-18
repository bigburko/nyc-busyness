// src/components/ui/DemographicReasoningDisplay.tsx
'use client';

import { Box, Text, VStack, HStack, Progress, Badge, Flex } from '@chakra-ui/react';
import { DemographicScoring } from '../../stores/filterStore';

interface DemographicReasoningDisplayProps {
  demographicScoring: DemographicScoring;
  lastReasoning?: string;
}

const DemographicReasoningDisplay: React.FC<DemographicReasoningDisplayProps> = ({
  demographicScoring,
  lastReasoning
}) => {
  const { weights, thresholdBonuses, penalties, reasoning } = demographicScoring;
  
  // Don't show if using default balanced weights and no reasoning
  const isDefaultWeights = (
    weights.ethnicity === 0.25 && 
    weights.gender === 0.25 && 
    weights.age === 0.25 && 
    weights.income === 0.25
  );
  
  const hasCustomization = !isDefaultWeights || thresholdBonuses.length > 0 || penalties.length > 0;
  const displayReasoning = reasoning || lastReasoning;
  
  if (!hasCustomization && !displayReasoning) {
    return null; // Don't show anything for default state
  }

  const formatPercentage = (value: number) => Math.round(value * 100);

  const getWeightColor = (value: number) => {
    if (value >= 0.4) return '#FF492C'; // High priority - brand red
    if (value >= 0.3) return '#FF8C42'; // Medium-high priority - orange
    if (value >= 0.2) return '#4299E1'; // Medium priority - blue
    return '#A0AEC0'; // Low priority - gray
  };

  return (
    <Box 
      bg="rgba(255, 249, 240, 0.8)" 
      borderRadius="xl" 
      p={4} 
      border="1px solid rgba(255, 73, 44, 0.1)"
      backdropFilter="blur(10px)"
      mt={3}
    >
      {/* Header */}
      <HStack spacing={2} mb={3}>
        <Text fontSize="sm" fontWeight="bold" color="gray.700">
          💡 Bricky&apos;s Demographic Strategy
        </Text>
        {hasCustomization && (
          <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
            AI Optimized
          </Badge>
        )}
      </HStack>

      {/* Reasoning Text */}
      {displayReasoning && (
        <Box 
          bg="white" 
          borderRadius="lg" 
          p={3} 
          mb={3}
          border="1px solid rgba(255, 73, 44, 0.1)"
        >
          <Text fontSize="sm" color="gray.700" lineHeight="1.5">
            {displayReasoning}
          </Text>
        </Box>
      )}

      {/* Weight Breakdown */}
      {hasCustomization && (
        <VStack spacing={3} align="stretch">
          <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
            Demographic Factor Priorities
          </Text>
          
          {[
            { key: 'ethnicity', label: 'Ethnicity', icon: '🌍' },
            { key: 'gender', label: 'Gender', icon: '👥' },
            { key: 'age', label: 'Age', icon: '📅' },
            { key: 'income', label: 'Income', icon: '💰' }
          ].map(({ key, label, icon }) => {
            const value = weights[key as keyof typeof weights];
            const percentage = formatPercentage(value);
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

          {/* Threshold Bonuses */}
          {thresholdBonuses.length > 0 && (
            <Box mt={2}>
              <Text fontSize="xs" fontWeight="semibold" color="green.600" mb={2}>
                ✅ Smart Bonuses Applied
              </Text>
              {thresholdBonuses.map((bonus, index) => (
                <Box key={index} bg="green.50" borderRadius="md" p={2} mb={1}>
                  <Text fontSize="xs" color="green.700">
                    +{Math.round(bonus.bonus * 100)}% bonus: {bonus.description}
                  </Text>
                </Box>
              ))}
            </Box>
          )}

          {/* Penalties */}
          {penalties.length > 0 && (
            <Box mt={2}>
              <Text fontSize="xs" fontWeight="semibold" color="red.600" mb={2}>
                ⚠️ Quality Guards
              </Text>
              {penalties.map((penalty, index) => (
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
    </Box>
  );
};

export default DemographicReasoningDisplay;