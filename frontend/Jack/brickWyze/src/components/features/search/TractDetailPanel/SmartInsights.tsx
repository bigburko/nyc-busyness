// src/components/features/search/TractDetailPanel/SmartInsights.tsx
'use client';

import { Box, VStack, HStack, Text, Badge, Progress } from '@chakra-ui/react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { DemographicScoring, FilterStore } from '../../../../types/WeightTypes';

interface SmartInsightsProps {
  tract: TractResult;
}

// Helper function to get research-backed score from percentage
const getResearchScore = (percentage: number): number => {
  const pct = percentage;
  if (pct >= 30) return Math.min(100, 80 + (pct - 30) / 20 * 20);
  if (pct >= 25) return 70 + (pct - 25) / 5 * 9;
  if (pct >= 20) return 60 + (pct - 20) / 5 * 9;
  if (pct >= 15) return 50 + (pct - 15) / 5 * 9;
  if (pct >= 10) return 40 + (pct - 10) / 5 * 9;
  if (pct >= 5) return 20 + (pct - 5) / 5 * 19;
  return Math.max(0, pct / 5 * 19);
};

// Helper function to get threshold label and color
const getThresholdLabel = (percentage: number): { label: string; color: string } => {
  if (percentage >= 30) return { label: "Excellent Match", color: "#10B981" };
  if (percentage >= 20) return { label: "Good Match", color: "#3B82F6" };
  if (percentage >= 15) return { label: "Average Match", color: "#F59E0B" };
  if (percentage >= 10) return { label: "Weak Match", color: "#F97316" };
  return { label: "Poor Match", color: "#EF4444" };
};

export function SmartInsights({ tract }: SmartInsightsProps) {
  const filterStore = useFilterStore() as FilterStore;
  const demographicScoring: DemographicScoring | undefined = filterStore.demographicScoring;
  
  // Check if we have any demographic data
  const hasAnyDemographicData = tract.demographic_match_pct || tract.gender_match_pct || 
                                 tract.age_match_pct || tract.income_match_pct;
  
  if (!hasAnyDemographicData) {
    return (
      <Box p={6} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
        <Text fontSize="lg" fontWeight="bold" color="gray.700" mb={2}>
          💡 Smart Insights
        </Text>
        <Text fontSize="sm" color="gray.600">
          No demographic filters applied. Add filters to see AI-powered insights about this neighborhood.
        </Text>
      </Box>
    );
  }

  // Calculate overall demographic score
  const demographicComponents = [];
  
  if (tract.demographic_match_pct) {
    const pct = tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100;
    demographicComponents.push(pct);
  }
  if (tract.gender_match_pct) {
    const pct = tract.gender_match_pct > 1 ? tract.gender_match_pct : tract.gender_match_pct * 100;
    demographicComponents.push(pct);
  }
  if (tract.age_match_pct) {
    const pct = tract.age_match_pct > 1 ? tract.age_match_pct : tract.age_match_pct * 100;
    demographicComponents.push(pct);
  }
  if (tract.income_match_pct) {
    const pct = tract.income_match_pct > 1 ? tract.income_match_pct : tract.income_match_pct * 100;
    demographicComponents.push(pct);
  }

  const averageMatch = demographicComponents.length > 0 
    ? demographicComponents.reduce((sum, val) => sum + val, 0) / demographicComponents.length
    : 0;
  
  const overallScore = Math.round(getResearchScore(averageMatch));
  const threshold = getThresholdLabel(averageMatch);
  
  const hasAdvancedScoring = demographicScoring && demographicScoring.weights;
  const reasoning = demographicScoring?.reasoning;

  return (
    <Box p={6} bg="white">
      <VStack spacing={6}>
        <Text fontSize="xl" fontWeight="bold" color="gray.800">
          💡 Smart Insights
        </Text>

        {/* AI Strategy Display */}
        {hasAdvancedScoring && reasoning && (
          <Box 
            p={4} 
            bg="rgba(255, 249, 240, 0.8)" 
            borderRadius="xl" 
            border="1px solid rgba(255, 73, 44, 0.1)"
            w="full"
          >
            <HStack spacing={2} mb={3}>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                🧠 AI Analysis
              </Text>
              <Badge bg="#FF492C" color="white" fontSize="xs" borderRadius="full">
                Optimized
              </Badge>
            </HStack>
            
            <Box 
              bg="white" 
              borderRadius="lg" 
              p={3} 
              border="1px solid rgba(255, 73, 44, 0.1)"
            >
              <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                {reasoning}
              </Text>
            </Box>
          </Box>
        )}

        {/* Overall Match Score */}
        <Box 
          p={4} 
          bg="white" 
          borderRadius="lg" 
          border="2px solid" 
          borderColor={threshold.color}
          w="full"
          boxShadow="sm"
        >
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  🎯 Overall Demographic Match
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {hasAdvancedScoring ? "AI-optimized scoring" : "Balanced analysis"}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color={threshold.color}>
                  {overallScore}/100
                </Text>
                <Text fontSize="sm" fontWeight="semibold" color={threshold.color}>
                  {threshold.label}
                </Text>
              </VStack>
            </HStack>
            
            <Progress 
              value={overallScore} 
              size="lg" 
              colorScheme={
                overallScore >= 70 ? "green" : 
                overallScore >= 50 ? "blue" : 
                overallScore >= 30 ? "orange" : "red"
              }
              bg="gray.100" 
              borderRadius="full"
              w="full"
            />
            
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Average {Math.round(averageMatch)}% population match across {demographicComponents.length} factor{demographicComponents.length !== 1 ? 's' : ''}
            </Text>
          </VStack>
        </Box>

        {/* Quick Component Breakdown */}
        <VStack spacing={3} w="full">
          <Text fontSize="md" fontWeight="semibold" color="gray.700">
            📋 Match Breakdown
          </Text>
          
          {tract.demographic_match_pct && (
            <HStack justify="space-between" w="full" p={3} bg="gray.50" borderRadius="md">
              <HStack spacing={2}>
                <Text>🌍</Text>
                <Text fontSize="sm" color="gray.700">Ethnicity Match</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color="gray.800">
                {Math.round(tract.demographic_match_pct > 1 ? tract.demographic_match_pct : tract.demographic_match_pct * 100)}%
              </Text>
            </HStack>
          )}
          
          {tract.age_match_pct && (
            <HStack justify="space-between" w="full" p={3} bg="gray.50" borderRadius="md">
              <HStack spacing={2}>
                <Text>📅</Text>
                <Text fontSize="sm" color="gray.700">Age Match</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color="gray.800">
                {Math.round(tract.age_match_pct > 1 ? tract.age_match_pct : tract.age_match_pct * 100)}%
              </Text>
            </HStack>
          )}
          
          {tract.gender_match_pct && (
            <HStack justify="space-between" w="full" p={3} bg="gray.50" borderRadius="md">
              <HStack spacing={2}>
                <Text>⚖️</Text>
                <Text fontSize="sm" color="gray.700">Gender Match</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color="gray.800">
                {Math.round(tract.gender_match_pct > 1 ? tract.gender_match_pct : tract.gender_match_pct * 100)}%
              </Text>
            </HStack>
          )}
          
          {tract.income_match_pct && (
            <HStack justify="space-between" w="full" p={3} bg="gray.50" borderRadius="md">
              <HStack spacing={2}>
                <Text>💰</Text>
                <Text fontSize="sm" color="gray.700">Income Match</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="bold" color="gray.800">
                {Math.round(tract.income_match_pct > 1 ? tract.income_match_pct : tract.income_match_pct * 100)}%
              </Text>
            </HStack>
          )}
        </VStack>
      </VStack>
    </Box>
  );
}