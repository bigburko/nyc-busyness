// src/components/ui/DemographicReasoningDisplay.tsx - ENHANCED: Shows weight logic warnings
'use client';

import { Box, Text, VStack, HStack, Progress, Badge, Flex, Button, Alert, AlertIcon } from '@chakra-ui/react';
import { DemographicScoring } from '../../stores/filterStore';
import { useFilterStore } from '../../stores/filterStore';

interface DemographicReasoningDisplayProps {
  demographicScoring: DemographicScoring;
  lastReasoning?: string;
  isPersistent?: boolean; // ✅ NEW: Show even in default state when persistent
  onReset?: () => void;   // ✅ NEW: Reset to default function
}

const DemographicReasoningDisplay: React.FC<DemographicReasoningDisplayProps> = ({
  demographicScoring,
  lastReasoning,
  isPersistent = false,
  onReset
}) => {
  const { weights, thresholdBonuses, penalties, reasoning } = demographicScoring;
  
  // ✅ NEW: Get current ethnicities to validate weight logic
  const selectedEthnicities = useFilterStore(state => state.selectedEthnicities);
  const hasEthnicities = selectedEthnicities && selectedEthnicities.length > 0;
  
  // Check if using default balanced weights
  const isDefaultWeights = (
    weights.ethnicity === 0.25 && 
    weights.gender === 0.25 && 
    weights.age === 0.25 && 
    weights.income === 0.25
  );
  
  // ✅ NEW: Detect weight logic issues
  const hasWeightLogicIssue = !hasEthnicities && weights.ethnicity > 0;
  
  // ✅ FIXED: Handle arrays properly
  const hasCustomization = !isDefaultWeights || 
                           (Array.isArray(thresholdBonuses) && thresholdBonuses.length > 0) || 
                           (Array.isArray(penalties) && penalties.length > 0);
  
  const displayReasoning = reasoning || lastReasoning;
  
  // ✅ NEW: Show in persistent mode even with default weights
  if (!isPersistent && !hasCustomization && !displayReasoning) {
    return null; // Don't show pop-up for default state
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
      bg={isPersistent ? "gray.50" : "rgba(255, 249, 240, 0.8)"} 
      borderRadius="xl" 
      p={4} 
      border={isPersistent ? "1px solid #E2E8F0" : "1px solid rgba(255, 73, 44, 0.1)"}
      backdropFilter={isPersistent ? "none" : "blur(10px)"}
      mt={isPersistent ? 0 : 3}
    >
      {/* Header */}
      <HStack spacing={2} mb={3} justify="space-between">
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color="gray.700">
            {isPersistent ? "📊 Current Strategy" : "💡 Bricky's Demographic Strategy"}
          </Text>
          {hasCustomization && (
            <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
              AI Optimized
            </Badge>
          )}
          {isPersistent && isDefaultWeights && (
            <Badge bg="gray.500" color="white" fontSize="xs" borderRadius="full">
              Balanced
            </Badge>
          )}
          {/* ✅ NEW: Weight logic issue warning */}
          {hasWeightLogicIssue && (
            <Badge bg="orange.500" color="white" fontSize="xs" borderRadius="full">
              Logic Issue
            </Badge>
          )}
        </HStack>
        
        {/* ✅ NEW: Reset button for persistent mode */}
        {isPersistent && hasCustomization && onReset && (
          <Button size="xs" variant="ghost" onClick={onReset} color="gray.600">
            Reset
          </Button>
        )}
      </HStack>

      {/* ✅ NEW: Weight logic warning */}
      {hasWeightLogicIssue && (
        <Alert status="warning" borderRadius="lg" mb={3} size="sm">
          <AlertIcon />
          <Text fontSize="xs">
            Ethnicity weighted {formatPercentage(weights.ethnicity)}% but no ethnicities selected. 
            Consider selecting ethnicities or resetting strategy.
          </Text>
        </Alert>
      )}

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

      {/* ✅ NEW: Default state message for persistent mode */}
      {isPersistent && isDefaultWeights && !displayReasoning && (
        <Box 
          bg="white" 
          borderRadius="lg" 
          p={3} 
          mb={3}
          border="1px solid #E2E8F0"
        >
          <Text fontSize="sm" color="gray.600" lineHeight="1.5">
            Using balanced demographic weighting. Ask Bricky to optimize for specific business needs!
          </Text>
        </Box>
      )}

      {/* ✅ NEW: Smart demographic guidance */}
      {isPersistent && !hasEthnicities && weights.ethnicity === 0 && (
        <Box 
          bg="blue.50" 
          borderRadius="lg" 
          p={3} 
          mb={3}
          border="1px solid #BEE3F8"
        >
          <Text fontSize="sm" color="blue.700" lineHeight="1.5">
            💡 <Text as="span" fontWeight="semibold">Tip:</Text> Select ethnicities above to enable 
            cultural targeting for heritage businesses like ethnic restaurants or cultural shops.
          </Text>
        </Box>
      )}

      {/* Weight Breakdown - ✅ NOW SHOWS EVEN FOR DEFAULT WEIGHTS in persistent mode */}
      {(hasCustomization || isPersistent) && (
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
              Demographic Factor Priorities
            </Text>
            {/* ✅ NEW: Ethnicity status indicator */}
            <Text fontSize="xs" color="gray.500">
              {hasEthnicities ? `${selectedEthnicities.length} selected` : 'None selected'}
            </Text>
          </HStack>
          
          {[
            { key: 'ethnicity', label: 'Ethnicity', icon: '🌍' },
            { key: 'gender', label: 'Gender', icon: '👥' },
            { key: 'age', label: 'Age', icon: '📅' },
            { key: 'income', label: 'Income', icon: '💰' }
          ].map(({ key, label, icon }) => {
            const value = weights[key as keyof typeof weights];
            const percentage = formatPercentage(value);
            const color = getWeightColor(value);
            const isEthnicityWithIssue = key === 'ethnicity' && hasWeightLogicIssue;
            
            return (
              <Box key={key}>
                <Flex justify="space-between" align="center" mb={1}>
                  <HStack spacing={2}>
                    <Text fontSize="xs">{icon}</Text>
                    <Text fontSize="xs" fontWeight="medium" color="gray.700">
                      {label}
                    </Text>
                    {/* ✅ NEW: Warning icon for ethnicity issues */}
                    {isEthnicityWithIssue && (
                      <Text fontSize="xs" color="orange.500">⚠️</Text>
                    )}
                  </HStack>
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={isEthnicityWithIssue ? "orange.500" : color}
                  >
                    {percentage}%
                  </Text>
                </Flex>
                <Progress 
                  value={percentage} 
                  colorScheme={isEthnicityWithIssue ? "orange" : "orange"} 
                  bg="gray.100" 
                  borderRadius="full" 
                  size="sm"
                  sx={{
                    '& > div': {
                      backgroundColor: isEthnicityWithIssue ? "#F6AD55" : color
                    }
                  }}
                />
              </Box>
            );
          })}

          {/* ✅ FIXED: Handle thresholdBonuses as array */}
          {Array.isArray(thresholdBonuses) && thresholdBonuses.length > 0 && (
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

          {/* ✅ FIXED: Handle penalties as array */}
          {Array.isArray(penalties) && penalties.length > 0 && (
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