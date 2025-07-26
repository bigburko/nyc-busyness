// src/components/features/search/TractDetailPanel/components/BottomLineSection.tsx

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { AIBusinessAnalysis } from '../../../../../types/AIAnalysisTypes';

interface BottomLineSectionProps {
  analysis: AIBusinessAnalysis;
}

export const BottomLineSection = ({ analysis }: BottomLineSectionProps) => {
  return (
    <Box 
      p={6} 
      bg="orange.50"
      borderRadius="2xl" 
      border="3px solid" 
      borderColor="orange.400"
      boxShadow="lg"
    >
      <VStack align="start" spacing={4}>
        <HStack spacing={3}>
          <Box bg="orange.100" p={3} borderRadius="xl">
            <Text fontSize="xl">🎯</Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="orange.900">
            Bottom Line
          </Text>
        </HStack>
        
        <Text fontSize="sm" color="orange.800" lineHeight="1.6" fontWeight="medium">
          {analysis.bottomLine}
        </Text>
      </VStack>
    </Box>
  );
};