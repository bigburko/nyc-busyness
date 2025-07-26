// src/components/features/search/TractDetailPanel/components/BusinessInsightCard.tsx

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { BusinessInsight } from '../../../../../types/AIAnalysisTypes';
import { getInsightColor } from '../../../../../lib/aiAnalysisUtils';

interface BusinessInsightCardProps {
  insight: BusinessInsight;
  index: number;
}

export const BusinessInsightCard = ({ insight, index }: BusinessInsightCardProps) => {
  return (
    <Box 
      key={index}
      p={6} 
      bg="white"
      borderRadius="xl"
      border="2px solid"
      borderColor={`${getInsightColor(insight.type)}.200`}
      boxShadow="md"
      position="relative"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "lg"
      }}
      transition="all 0.2s"
    >
      <VStack spacing={4} align="stretch">
        {/* Header Section - Title and Badge */}
        <HStack spacing={4} align="center" justify="space-between">
          <HStack spacing={3} flex="1">
            <Box
              bg={`${getInsightColor(insight.type)}.100`}
              p={3}
              borderRadius="xl"
              fontSize="xl"
            >
              {insight.icon}
            </Box>
            <Text fontSize="lg" fontWeight="bold" color="gray.800" flex="1">
              {insight.title}
            </Text>
          </HStack>
          
          {/* Insight Type Badge */}
          <Box
            bg={`${getInsightColor(insight.type)}.100`}
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="semibold"
            color={`${getInsightColor(insight.type)}.700`}
            textTransform="capitalize"
          >
            {insight.type}
          </Box>
        </HStack>

        {/* Description Section */}
        <Box w="full">
          <Text 
            fontSize="sm" 
            color="gray.600"
            lineHeight="1.6"
            w="full"
          >
            {insight.description}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};