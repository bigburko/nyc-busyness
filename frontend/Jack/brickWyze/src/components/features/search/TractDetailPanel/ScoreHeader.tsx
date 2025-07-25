// src/components/features/search/TractDetailPanel/ScoreHeader.tsx - UPDATED: Simplified Business-First Header
'use client';

import { Box, VStack, HStack, Text, Badge, Icon, Flex } from '@chakra-ui/react';
import { FaStar, FaMapMarkerAlt, FaHome, FaChartLine } from 'react-icons/fa';

interface ScoreHeaderProps {
  score: number;
  tractInfo?: {
    ntaName: string;
    tractNumber: string;
    avgRent?: number;
  };
}

function getResilienceColor(score: number): string {
  if (score >= 80) return "#10B981"; // green
  if (score >= 60) return "#3B82F6"; // blue
  if (score >= 40) return "#F59E0B"; // yellow
  if (score >= 20) return "#F97316"; // orange
  return "#EF4444"; // red
}

function getResilienceLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

function getColorScheme(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "yellow";
  if (score >= 20) return "orange";
  return "red";
}

export function ScoreHeader({ score, tractInfo }: ScoreHeaderProps) {
  const resilienceColor = getResilienceColor(score);
  const resilienceLabel = getResilienceLabel(score);
  const colorScheme = getColorScheme(score);
  
  // Calculate vs area average (placeholder - you can replace with real data)
  const areaAverage = 75;
  const vsAverage = score - areaAverage;
  const vsAverageText = vsAverage > 0 ? `+${vsAverage.toFixed(0)}` : `${vsAverage.toFixed(0)}`;
  
  // Format rent safely
  const rentText = tractInfo?.avgRent 
    ? `$${tractInfo.avgRent.toLocaleString()}`
    : 'Rent N/A';

  return (
    <Box
      p={6}
      bg="white"
    >
      {/* ⭐ Simplified Header Section */}
      <VStack spacing={4} w="full" mb={6}>
        {/* Top Row: Score + Location */}
        <Flex justify="space-between" align="center" w="full">
          <VStack spacing={1} align="center">
            <Badge
              colorScheme={colorScheme}
              fontSize="2xl"
              px={6}
              py={3}
              borderRadius="full"
              display="flex"
              alignItems="center"
              gap={2}
              fontWeight="bold"
            >
              <Icon as={FaStar} />
              {score}
            </Badge>
            <Text fontSize="xs" color="gray.600" fontWeight="medium">
              Score
            </Text>
          </VStack>

          {/* Location Info */}
          {tractInfo && (
            <VStack spacing={1} align="center" flex="1" mx={4}>
              <Flex align="center" gap={2}>
                <Icon as={FaMapMarkerAlt} color="gray.500" />
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                  Tract {tractInfo.tractNumber.slice(-6)}
                </Text>
              </Flex>
              <Text fontSize="md" color="gray.600" textAlign="center">
                {tractInfo.ntaName}
              </Text>
            </VStack>
          )}
        </Flex>

        {/* Bottom Row: Business Metrics */}
        <Flex justify="center" align="center" gap={8} w="full">
          {/* Rent */}
          <VStack spacing={1} align="center">
            <Flex align="center" gap={2}>
              <Icon as={FaHome} color="blue.500" size="lg" />
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                {rentText}
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              Monthly Rent
            </Text>
          </VStack>

          {/* Comparison */}
          <VStack spacing={1} align="center">
            <Flex align="center" gap={2}>
              <Icon 
                as={FaChartLine} 
                color={vsAverage > 0 ? "green.500" : "red.500"}
                size="lg"
              />
              <Text 
                fontSize="xl" 
                fontWeight="bold"
                color={vsAverage > 0 ? "green.600" : "red.600"}
              >
                {vsAverageText}
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              vs area avg
            </Text>
          </VStack>
        </Flex>
      </VStack>

      {/* Quick Status Row */}
      <HStack spacing={4} justify="center" wrap="wrap" w="full">
        <Badge
          colorScheme={colorScheme}
          variant="subtle"
          px={4}
          py={2}
          borderRadius="full"
          fontSize="md"
          fontWeight="semibold"
        >
          {resilienceLabel} Location
        </Badge>
        
        {tractInfo?.avgRent && (
          <Badge
            colorScheme={tractInfo.avgRent < 2000 ? 'green' : tractInfo.avgRent < 3000 ? 'yellow' : 'red'}
            variant="subtle"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="md"
            fontWeight="semibold"
          >
            {tractInfo.avgRent < 2000 ? 'Affordable' : 
             tractInfo.avgRent < 3000 ? 'Moderate' : 'Premium'} Rent
          </Badge>
        )}

        <Badge
          colorScheme={score > 70 ? 'green' : score > 50 ? 'yellow' : 'orange'}
          variant="subtle"
          px={4}
          py={2}
          borderRadius="full"
          fontSize="md"
          fontWeight="semibold"
        >
          {score > 70 ? 'Strong' : score > 50 ? 'Viable' : 'Consider'} Business Opportunity
        </Badge>
      </HStack>
    </Box>
  );
}