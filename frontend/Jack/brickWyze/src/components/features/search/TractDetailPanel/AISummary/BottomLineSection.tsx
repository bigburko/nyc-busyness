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
      bg="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)"
      borderRadius="xl" 
      border="2px solid" 
      borderColor="amber.300"
      boxShadow="lg"
      position="relative"
      overflow="hidden"
    >
      {/* Decorative accent */}
      <Box 
        position="absolute"
        top="0"
        left="0"
        w="full"
        h="1"
        bg="linear-gradient(90deg, #F59E0B, #D97706)"
      />
      
      <VStack align="start" spacing={4}>
        <HStack spacing={3}>
          <Box bg="amber.100" p={2} borderRadius="lg">
            <Text fontSize="lg">🎯</Text>
          </Box>
          <Text fontSize="md" fontWeight="bold" color="amber.800">
            Bottom Line
          </Text>
        </HStack>
        <Text fontSize="sm" color="amber.700" lineHeight="1.6" fontWeight="medium">
          {analysis.bottomLine}
        </Text>
      </VStack>
    </Box>
  );
};