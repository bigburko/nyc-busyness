// src/components/features/search/TractDetailPanel/components/HeadlineSection.tsx

import { Box, VStack, Text } from '@chakra-ui/react';
import { AIBusinessAnalysis } from '../../../../../types/AIAnalysisTypes';

interface HeadlineSectionProps {
  analysis: AIBusinessAnalysis;
}

export const HeadlineSection = ({ analysis }: HeadlineSectionProps) => {
  return (
    <Box 
      p={6} 
      bg="linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)"
      borderRadius="2xl" 
      border="2px solid"
      borderColor="purple.100"
      position="relative"
      overflow="hidden"
    >
      {/* Decorative background pattern */}
      <Box 
        position="absolute"
        top="-50px"
        right="-50px"
        w="100px"
        h="100px"
        bg="linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))"
        borderRadius="full"
        opacity={0.5}
      />
      
      <VStack spacing={4} align="start" position="relative">
        <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1.3">
          {analysis.headline}
        </Text>
        <Box 
          bg="white" 
          borderRadius="xl" 
          p={4}
          border="1px solid"
          borderColor="purple.200"
          w="full"
          boxShadow="sm"
        >
          <Text fontSize="sm" color="gray.700" lineHeight="1.6" fontStyle="italic">
            &ldquo;{analysis.reasoning}&rdquo;
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};