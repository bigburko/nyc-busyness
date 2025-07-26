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
      bg="gray.50"
      borderRadius="2xl" 
      border="2px solid" 
      borderColor="blue.200"
      boxShadow="sm"
    >
      <VStack align="start" spacing={4}>
        <HStack spacing={3}>
          <Box bg="blue.100" p={3} borderRadius="xl">
            <Text fontSize="xl">🏢</Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Similar Successful Businesses
          </Text>
        </HStack>
        
        <VStack align="start" spacing={3} w="full">
          {analysis.competitorExamples.map((example, index) => (
            <Text key={index} fontSize="sm" color="gray.700" lineHeight="1.6">
              {example}
            </Text>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};