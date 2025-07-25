// src/components/features/search/components/ScoreHeader.tsx
'use client';

import { Box, VStack, Text } from '@chakra-ui/react';

interface ScoreHeaderProps {
  score: number;
}

function getResilienceColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#3B82F6";
  if (score >= 40) return "#F59E0B";
  if (score >= 20) return "#F97316";
  return "#EF4444";
}

function getResilienceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Low";
  return "Very Low";
}

export function ScoreHeader({ score }: ScoreHeaderProps) {
  const resilienceColor = getResilienceColor(score);
  const resilienceLabel = getResilienceLabel(score);
  
  return (
    <Box p={6} bg="white" borderBottom="2px solid" borderColor="gray.100">
      <VStack spacing={1} align="center" justify="center">
        <Text 
          fontSize="6xl" 
          fontWeight="black" 
          color={resilienceColor}
          lineHeight="0.8"
          textShadow="0 2px 4px rgba(0,0,0,0.1)"
        >
          {score}
        </Text>
        <Text 
          fontSize="sm" 
          color={resilienceColor}
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {resilienceLabel}
        </Text>
      </VStack>
    </Box>
  );
}