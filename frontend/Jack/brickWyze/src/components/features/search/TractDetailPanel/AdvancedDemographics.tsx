// Fixed AdvancedDemographics.tsx - Handles data correctly without double scoring

'use client';

import { 
  Box, VStack, HStack, Text, Progress, SimpleGrid, Badge, Flex
} from '@chakra-ui/react';
import { useFilterStore } from '../../../../stores/filterStore';
import MyToolTip from '../../../ui/MyToolTip';
import { TractResult } from '../../../../types/TractTypes';
import { DemographicScoring, DemographicWeights, ThresholdBonus, Penalty, FilterStore } from '../../../../types/WeightTypes';

interface AdvancedDemographicsProps {
  tract: TractResult;
}

interface DemographicComponent {
  id: string;
  name: string;
  icon: string;
  percentage: number;
  score: number;
  weight: number;
  weightedContribution: number;
  threshold: {
    label: string;
    color: string;
  };
}

// FIXED: Helper function to get research-backed score from percentage
// This should match the backend logic exactly
const getResearchScore = (percentage: number): number => {
  // Input is already a percentage (0-100), not decimal (0-1)
  const pct = percentage;
  
  if (pct >= 30) return Math.min(100, 80 + (pct - 30) / 20 * 20);
  if (pct >= 25) return 70 + (pct - 25) / 5 * 9;
  if (pct >= 20) return 60 + (pct - 20) / 5 * 9;
  if (pct >= 15) return 50 + (pct - 15) / 5 * 9;
  if (pct >= 10) return 40 + (pct - 10) / 5 * 9;
  if (pct >= 5) return 20 + (pct - 5) / 5 * 19;
  return Math.max(0, pct / 5 * 19);
};

// Helper function to get threshold label
const getThresholdLabel = (percentage: number): { label: string; color: string } => {
  if (percentage >= 30) return { label: "Excellent", color: "#10B981" };
  if (percentage >= 25) return { label: "Strong", color: "#059669" };
  if (percentage >= 20) return { label: "Good", color: "#3B82F6" };
  if (percentage >= 15) return { label: "Average", color: "#F59E0B" };
  if (percentage >= 10) return { label: "Weak", color: "#F97316" };
  if (percentage >= 5) return { label: "Poor", color: "#EF4444" };
  return { label: "Very Poor", color: "#DC2626" };
};

// Helper function to get weight color
const getWeightColor = (value: number): string => {
  if (value >= 0.4) return '#FF492C'; // High priority - brand red
  if (value >= 0.3) return '#FF8C42'; // Medium-high priority - orange
  if (value >= 0.2) return '#4299E1'; // Medium priority - blue
  return '#A0AEC0'; // Low priority - gray
};

export function AdvancedDemographics({ tract }: AdvancedDemographicsProps) {
  // Access demographic scoring from filter store
  const filterStore = useFilterStore() as FilterStore;
  const demographicScoring: DemographicScoring | undefined = filterStore.demographicScoring;
  
  // FIXED: Add debugging to see what data we're receiving
  console.log('🔍 [AdvancedDemographics] Received tract data:', {
    geoid: tract.geoid,
    demographic_match_pct: tract.demographic_match_pct,
    gender_match_pct: tract.gender_match_pct,
    age_match_pct: tract.age_match_pct,
    income_match_pct: tract.income_match_pct
  });
  
  // Collect demographic components
  const components: DemographicComponent[] = [];
  
  // Default demographic weights (balanced)
  const defaultWeights: DemographicWeights = {
    ethnicity: 0.25,
    gender: 0.25,
    age: 0.25,
    income: 0.25
  };
  
  // Use advanced weights if available, otherwise use defaults
  const weights = demographicScoring?.weights || defaultWeights;
  const hasAdvancedScoring = demographicScoring && demographicScoring.weights;
  const thresholdBonuses = demographicScoring?.thresholdBonuses || [];
  const penalties = demographicScoring?.penalties || [];
  const reasoning = demographicScoring?.reasoning;
  
  // FIXED: Process each demographic component with proper data handling
  if (tract.demographic_match_pct !== null && tract.demographic_match_pct !== undefined) {
    // Backend sends percentage as number (e.g., 45 for 45%)
    const ethPercent = Math.round(tract.demographic_match_pct);
    const ethScore = Math.round(getResearchScore(ethPercent));
    const ethThreshold = getThresholdLabel(ethPercent);
    const ethWeight = weights.ethnicity;
    
    console.log('🔍 [AdvancedDemographics] Ethnicity processing:', {
      raw_value: tract.demographic_match_pct,
      processed_percentage: ethPercent,
      calculated_score: ethScore
    });
    
    components.push({
      id: 'ethnicity',
      name: 'Ethnicity Match',
      icon: '🌍',
      percentage: ethPercent,
      score: ethScore,
      weight: ethWeight,
      weightedContribution: ethScore * ethWeight,
      threshold: ethThreshold
    });
  }
  
  if (tract.gender_match_pct !== null && tract.gender_match_pct !== undefined) {
    const genPercent = Math.round(tract.gender_match_pct);
    const genScore = Math.round(getResearchScore(genPercent));
    const genThreshold = getThresholdLabel(genPercent);
    const genWeight = weights.gender;
    
    console.log('🔍 [AdvancedDemographics] Gender processing:', {
      raw_value: tract.gender_match_pct,
      processed_percentage: genPercent,
      calculated_score: genScore
    });
    
    components.push({
      id: 'gender',
      name: 'Gender Match',
      icon: '⚖️',
      percentage: genPercent,
      score: genScore,
      weight: genWeight,
      weightedContribution: genScore * genWeight,
      threshold: genThreshold
    });
  }
  
  if (tract.age_match_pct !== null && tract.age_match_pct !== undefined) {
    const agePercent = Math.round(tract.age_match_pct);
    const ageScore = Math.round(getResearchScore(agePercent));
    const ageThreshold = getThresholdLabel(agePercent);
    const ageWeight = weights.age;
    
    console.log('🔍 [AdvancedDemographics] Age processing:', {
      raw_value: tract.age_match_pct,
      processed_percentage: agePercent,
      calculated_score: ageScore
    });
    
    components.push({
      id: 'age',
      name: 'Age Match',
      icon: '🎂',
      percentage: agePercent,
      score: ageScore,
      weight: ageWeight,
      weightedContribution: ageScore * ageWeight,
      threshold: ageThreshold
    });
  }
  
  if (tract.income_match_pct !== null && tract.income_match_pct !== undefined) {
    const incPercent = Math.round(tract.income_match_pct);
    const incScore = Math.round(getResearchScore(incPercent));
    const incThreshold = getThresholdLabel(incPercent);
    const incWeight = weights.income;
    
    console.log('🔍 [AdvancedDemographics] Income processing:', {
      raw_value: tract.income_match_pct,
      processed_percentage: incPercent,
      calculated_score: incScore
    });
    
    components.push({
      id: 'income',
      name: 'Income Match',
      icon: '💰',
      percentage: incPercent,
      score: incScore,
      weight: incWeight,
      weightedContribution: incScore * incWeight,
      threshold: incThreshold
    });
  }
  
  console.log('🔍 [AdvancedDemographics] Final components:', components.length, components.map(c => `${c.name}: ${c.percentage}% → ${c.score} pts`));
  
  if (components.length === 0) {
    return (
      <Box p={6}>
        <HStack mb={6} align="center" spacing={3}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            👥 Advanced Demographic Analysis
          </Text>
          <MyToolTip label="Advanced Demographic Analysis">
            Shows sophisticated demographic scoring using AI-optimized weights, threshold bonuses, and penalties
          </MyToolTip>
        </HStack>
        
        <Box 
          p={4} 
          bg="gray.50" 
          borderRadius="lg" 
          border="1px solid" 
          borderColor="gray.200"
          textAlign="center"
        >
          <Text fontSize="md" color="gray.600">
            No demographic filters applied in your search
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2}>
            Add ethnicity, gender, age, or income filters to see advanced demographic analysis
          </Text>
        </Box>
      </Box>
    );
  }
  
  // Calculate weighted demographic score
  const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);
  const weightedScore = totalWeight > 0 
    ? Math.round(components.reduce((sum, comp) => sum + comp.weightedContribution, 0) / totalWeight)
    : Math.round(components.reduce((sum, comp) => sum + comp.score, 0) / components.length);
  
  const finalScore = weightedScore;
  
  const overallThreshold = getThresholdLabel(
    components.reduce((sum, comp) => sum + comp.percentage, 0) / components.length
  );
  
  console.log('🔍 [AdvancedDemographics] Final calculation:', {
    totalWeight,
    weightedScore,
    finalScore,
    components_count: components.length
  });
  
  return (
    <Box p={6}>
      <HStack mb={6} align="center" spacing={3}>
        <Text fontSize="xl" fontWeight="bold" color="gray.800">
          👥 Advanced Demographic Analysis
        </Text>
        <MyToolTip label="Advanced Demographic Analysis">
          Shows sophisticated demographic scoring using AI-optimized weights, threshold bonuses, and penalties
        </MyToolTip>
      </HStack>
      
      <VStack spacing={6}>
        {/* AI Strategy Display */}
        {hasAdvancedScoring && (
          <Box 
            p={4} 
            bg="rgba(255, 249, 240, 0.8)" 
            borderRadius="xl" 
            border="1px solid rgba(255, 73, 44, 0.1)"
            backdropFilter="blur(10px)"
            w="full"
          >
            <HStack spacing={2} mb={3}>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                💡 Bricky&apos;s Demographic Strategy
              </Text>
              <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
                AI Optimized
              </Badge>
            </HStack>
            
            {reasoning && (
              <Box 
                bg="white" 
                borderRadius="lg" 
                p={3} 
                mb={3}
                border="1px solid rgba(255, 73, 44, 0.1)"
              >
                <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                  {reasoning}
                </Text>
              </Box>
            )}
            
            <VStack spacing={2} align="stretch">
              <Text fontSize="xs" fontWeight="semibold" color="gray.600" textTransform="uppercase">
                AI-Optimized Factor Priorities
              </Text>
              
              {[
                { key: 'ethnicity', label: 'Ethnicity', icon: '🌍' },
                { key: 'gender', label: 'Gender', icon: '👥' },
                { key: 'age', label: 'Age', icon: '📅' },
                { key: 'income', label: 'Income', icon: '💰' }
              ].map(({ key, label, icon }) => {
                const value = weights[key as keyof DemographicWeights];
                const percentage = Math.round(value * 100);
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
            </VStack>
          </Box>
        )}
        
        {/* Weighted Score Summary */}
        <Box 
          p={4} 
          bg={hasAdvancedScoring ? "green.50" : "blue.50"} 
          borderRadius="lg" 
          border="1px solid" 
          borderColor={hasAdvancedScoring ? "green.200" : "blue.200"}
          w="full"
        >
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={hasAdvancedScoring ? "green.700" : "blue.700"}>
                  {hasAdvancedScoring ? "AI-Weighted Demographic Score" : "Balanced Demographic Score"}
                </Text>
                <Text fontSize="sm" color={hasAdvancedScoring ? "green.600" : "blue.600"}>
                  {hasAdvancedScoring ? "Using AI-optimized weights" : `Average of ${components.length} component${components.length !== 1 ? 's' : ''}`}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color={overallThreshold.color}>
                  {finalScore}/100
                </Text>
                <Text fontSize="sm" fontWeight="semibold" color={overallThreshold.color}>
                  {overallThreshold.label}
                </Text>
              </VStack>
            </HStack>
            
            {hasAdvancedScoring ? (
              <Text fontSize="xs" color="green.600" textAlign="center">
                📊 Weighted Calculation: ({components.map(c => `${Math.round(c.score)} × ${Math.round(c.weight * 100)}%`).join(' + ')}) ÷ {Math.round(totalWeight * 100)}% = {finalScore}
              </Text>
            ) : (
              <Text fontSize="xs" color="blue.600" textAlign="center">
                📊 Balanced Calculation: ({components.map(c => c.score).join(' + ')}) ÷ {components.length} = {finalScore}
              </Text>
            )}
          </VStack>
        </Box>
        
        {/* Individual Component Analysis */}
        <VStack spacing={4} w="full">
          <Text fontSize="md" fontWeight="semibold" color="gray.700" textAlign="center">
            📋 Detailed Component Breakdown
          </Text>
          
          {components.map((component: DemographicComponent, index: number) => (
            <Box 
              key={`demo-${component.id}-${index}`}
              p={4} 
              bg="white" 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="gray.200"
              boxShadow="sm"
              w="full"
            >
              <VStack spacing={3}>
                <HStack justify="space-between" w="full">
                  <HStack spacing={2}>
                    <Text fontSize="lg">{component.icon}</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="md" fontWeight="semibold" color="gray.700">
                        {component.name}
                      </Text>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color="gray.500">
                          Weight: {Math.round(component.weight * 100)}%
                        </Text>
                        <Box w="4px" h="4px" bg={getWeightColor(component.weight)} borderRadius="full" />
                        <Text fontSize="xs" color="gray.500">
                          {component.weight >= 0.4 ? "High Priority" : 
                           component.weight >= 0.3 ? "Medium-High" : 
                           component.weight >= 0.2 ? "Medium" : "Low Priority"}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <VStack align="end" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color={component.threshold.color}>
                      {component.score}/100
                    </Text>
                    <Text fontSize="xs" fontWeight="semibold" color={component.threshold.color}>
                      {component.threshold.label}
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack spacing={2} w="full">
                  <HStack justify="space-between" w="full" fontSize="sm">
                    <Text color="gray.600">
                      Population Match: {component.percentage}%
                    </Text>
                    <Text color="gray.600">
                      Weighted Contribution: +{Math.round(component.weightedContribution)}
                    </Text>
                  </HStack>
                  
                  <Progress 
                    value={component.score} 
                    size="md" 
                    colorScheme={
                      component.score >= 70 ? "green" : 
                      component.score >= 50 ? "blue" : 
                      component.score >= 30 ? "orange" : "red"
                    }
                    bg="gray.100" 
                    borderRadius="full"
                  />
                  
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    {component.percentage}% population match → {component.score} points × {Math.round(component.weight * 100)}% weight = +{Math.round(component.weightedContribution)} contribution
                  </Text>
                </VStack>
              </VStack>
            </Box>
          ))}
        </VStack>
        
        {/* Threshold Bonuses and Penalties */}
        {(thresholdBonuses.length > 0 || penalties.length > 0) && (
          <VStack spacing={4} w="full">
            {thresholdBonuses.length > 0 && (
              <Box w="full">
                <Text fontSize="sm" fontWeight="semibold" color="green.600" mb={2}>
                  ✅ Smart Bonuses Applied
                </Text>
                {thresholdBonuses.map((bonus: ThresholdBonus, index: number) => (
                  <Box key={index} bg="green.50" borderRadius="md" p={2} mb={1}>
                    <Text fontSize="xs" color="green.700">
                      +{Math.round(bonus.bonus * 100)}% bonus: {bonus.description}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
            
            {penalties.length > 0 && (
              <Box w="full">
                <Text fontSize="sm" fontWeight="semibold" color="red.600" mb={2}>
                  ⚠️ Quality Guards Applied
                </Text>
                {penalties.map((penalty: Penalty, index: number) => (
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
        
        {/* Research Thresholds Reference */}
        <Box 
          p={4} 
          bg="gray.50" 
          borderRadius="lg" 
          border="1px solid" 
          borderColor="gray.200"
          w="full"
        >
          <VStack spacing={3}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700" textAlign="center">
              📚 Research-Backed Scoring Thresholds
            </Text>
            
            <SimpleGrid columns={3} spacing={2} w="full" fontSize="xs">
              <VStack spacing={1} p={2} bg="green.50" borderRadius="md">
                <Text fontWeight="bold" color="green.700">Excellent</Text>
                <Text color="green.600">30%+ match</Text>
                <Text color="green.600">80-100 pts</Text>
              </VStack>
              <VStack spacing={1} p={2} bg="blue.50" borderRadius="md">
                <Text fontWeight="bold" color="blue.700">Good</Text>
                <Text color="blue.600">20-29% match</Text>
                <Text color="blue.600">60-79 pts</Text>
              </VStack>
              <VStack spacing={1} p={2} bg="orange.50" borderRadius="md">
                <Text fontWeight="bold" color="orange.700">Average</Text>
                <Text color="orange.600">15-19% match</Text>
                <Text color="orange.600">50-59 pts</Text>
              </VStack>
              <VStack spacing={1} p={2} bg="yellow.50" borderRadius="md">
                <Text fontWeight="bold" color="yellow.700">Weak</Text>
                <Text color="yellow.600">10-14% match</Text>
                <Text color="yellow.600">40-49 pts</Text>
              </VStack>
              <VStack spacing={1} p={2} bg="red.50" borderRadius="md">
                <Text fontWeight="bold" color="red.700">Poor</Text>
                <Text color="red.600">5-9% match</Text>
                <Text color="red.600">20-39 pts</Text>
              </VStack>
              <VStack spacing={1} p={2} bg="gray.100" borderRadius="md">
                <Text fontWeight="bold" color="gray.700">Very Poor</Text>
                <Text color="gray.600">0-4% match</Text>
                <Text color="gray.600">0-19 pts</Text>
              </VStack>
            </SimpleGrid>
            
            <Text fontSize="xs" color="gray.500" textAlign="center">
              {hasAdvancedScoring 
                ? "AI-optimized weights applied to research thresholds for maximum business relevance"
                : "Balanced weights applied to research thresholds based on urban demographics studies"
              }
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}