// src/components/features/search/TractDetailPanel/components/BusinessRecommendations.tsx

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { AIBusinessAnalysis } from '../../../../../types/AIAnalysisTypes';

interface BusinessRecommendationsProps {
  analysis: AIBusinessAnalysis;
}

export const BusinessRecommendations = ({ analysis }: BusinessRecommendationsProps) => {
  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={2} align="center">
        <Box w="4px" h="6" bg="blue.500" borderRadius="full" />
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Recommendations
        </Text>
      </HStack>

      <VStack spacing={6} align="stretch">
        {/* Business Types */}
        <Box 
          w="full"
          p={6} 
          bg="linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)"
          borderRadius="xl" 
          border="2px solid" 
          borderColor="purple.200"
          boxShadow="sm"
        >
          <VStack align="start" spacing={4}>
            <HStack spacing={3}>
              <Box bg="purple.100" p={2} borderRadius="lg">
                <Text fontSize="lg">🏪</Text>
              </Box>
              <Text fontSize="md" fontWeight="bold" color="purple.800">
                Recommended Business Types
              </Text>
            </HStack>
            <VStack align="start" spacing={2} w="full">
              {analysis.businessTypes.map((type, index) => (
                <HStack key={index} spacing={2}>
                  <Box w="2" h="2" bg="purple.400" borderRadius="full" />
                  <Text fontSize="sm" color="purple.700" fontWeight="medium">
                    {type}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </Box>
        
        {/* Market Strategy */}
        <Box 
          w="full"
          p={6} 
          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)"
          borderRadius="xl" 
          border="2px solid" 
          borderColor="blue.200"
          boxShadow="sm"
        >
          <VStack align="start" spacing={4}>
            <HStack spacing={3}>
              <Box bg="blue.100" p={2} borderRadius="lg">
                <Text fontSize="lg">📈</Text>
              </Box>
              <Text fontSize="md" fontWeight="bold" color="blue.800">
                Market Strategy
              </Text>
            </HStack>
            <Text fontSize="sm" color="blue.700" lineHeight="1.6" w="full">
              {analysis.marketStrategy}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </VStack>
  );
};