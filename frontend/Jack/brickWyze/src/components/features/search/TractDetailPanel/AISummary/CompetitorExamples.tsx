// src/components/features/search/TractDetailPanel/components/CompetitorExamples.tsx

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { AIBusinessAnalysis } from '../../../../../types/AIAnalysisTypes';

interface CompetitorExamplesProps {
  analysis: AIBusinessAnalysis;
}

export const CompetitorExamples = ({ analysis }: CompetitorExamplesProps) => {
  // Only render if there are competitor examples
  if (!analysis.competitorExamples || analysis.competitorExamples.length === 0) {
    return null;
  }

  return (
    <Box 
      p={6} 
      bg="linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)"
      borderRadius="xl" 
      border="2px solid" 
      borderColor="emerald.200"
      boxShadow="sm"
    >
      <VStack align="start" spacing={4}>
        <HStack spacing={3}>
          <Box bg="emerald.100" p={2} borderRadius="lg">
            <Text fontSize="lg">🏢</Text>
          </Box>
          <Text fontSize="md" fontWeight="bold" color="emerald.800">
            Similar Successful Businesses
          </Text>
        </HStack>
        <VStack align="start" spacing={2}>
          {analysis.competitorExamples.map((example, index) => (
            <HStack key={index} spacing={2}>
              <Box w="2" h="2" bg="emerald.400" borderRadius="full" />
              <Text fontSize="sm" color="emerald.700" fontWeight="medium">
                {example}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};