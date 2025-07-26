// src/components/features/search/TractDetailPanel/AISummary/AIAnalysisHeader.tsx

import { Box, VStack, Text, HStack } from '@chakra-ui/react';
import { TractResult } from '../../../../../types/TractTypes';
import { AIBusinessAnalysis, FilterStoreSlice } from '../../../../../types/AIAnalysisTypes';
import { BrickyAvatar } from './BrickyAvatar';
import { SpeechBubble } from './SpeechBubble';
import { generatePersonalizedSpeechText, getConfidenceColor } from '../../../../../lib/aiAnalysisUtils';

interface AIAnalysisHeaderProps {
  tract: TractResult;
  analysis: AIBusinessAnalysis;
  filterStore: FilterStoreSlice;
}

export const AIAnalysisHeader = ({ tract, analysis, filterStore }: AIAnalysisHeaderProps) => {
  return (
    <Box 
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      p={6} 
      color="white"
    >
      <VStack spacing={6} align="center">
        {/* Title Section - Full Width */}
        <VStack spacing={2} w="full">
          <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2" textAlign="center" w="full">
            Bricky's Business Intelligence
          </Text>
          <Text fontSize="md" opacity={0.9} lineHeight="1.3" textAlign="center" w="full">
            AI-powered market analysis for {tract.nta_name}
          </Text>
        </VStack>
        
        {/* Bricky with Speech Bubble - Horizontal Layout */}
        <HStack spacing={4} align="center" justify="center" w="full">
          {/* Bricky with Liquid Glass Background */}
          <BrickyAvatar 
            size="lg" 
            withGlassBackground={true}
            showDebugInfo={false}
          />
          
          {/* Custom Speech Bubble */}
          <Box flex="1" maxW="300px">
            <SpeechBubble
              bg={getConfidenceColor(analysis.confidence).bg}
              borderColor={getConfidenceColor(analysis.confidence).border}
              color="white"
              size="md"
              direction="left"
            >
              {generatePersonalizedSpeechText(analysis, tract, filterStore)}
            </SpeechBubble>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};