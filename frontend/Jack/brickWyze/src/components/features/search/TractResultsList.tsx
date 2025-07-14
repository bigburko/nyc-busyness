// src/components/features/search/TractResultsList.tsx
'use client';

import { Box, Text, VStack, HStack, Badge, Flex } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score: number;
  rent_score?: number; // ✅ Make optional
  poi_score?: number; // ✅ Make optional
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
}

interface TractResultsListProps {
  searchResults: TractResult[];
  onTractSelect: (tract: TractResult) => void;
  selectedTractId?: string;
}

// Individual result card component - matches Google Maps style
function TractResultCard({ 
  tract, 
  isSelected, 
  onClick 
}: { 
  tract: TractResult; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const resilienceScore = Math.round(tract.custom_score * 100);
  const rentText = tract.avg_rent ? `$${tract.avg_rent}/sqft` : 'Rent: N/A';
  
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={isSelected ? "#FF492C" : "gray.200"}
      bg={isSelected ? "rgba(255, 73, 44, 0.05)" : "white"}
      _hover={{ 
        bg: isSelected ? "rgba(255, 73, 44, 0.08)" : "gray.50", 
        cursor: 'pointer',
        borderColor: "#FF492C"
      }}
      transition="all 0.2s"
      onClick={onClick}
      position="relative"
    >
      {/* Score badge - top right like Google */}
      <Badge
        position="absolute"
        top={2}
        right={2}
        bg="#FF492C"
        color="white"
        borderRadius="full"
        px={2}
        py={1}
        fontSize="xs"
        fontWeight="bold"
      >
        {resilienceScore}
      </Badge>

      {/* Main content */}
      <VStack align="start" spacing={1} pr={12}>
        <Text fontWeight="bold" fontSize="md" noOfLines={1} color="gray.800">
          🏘️ {tract.display_name}
        </Text>
        
        <Text fontSize="sm" color="gray.600" noOfLines={1}>
          {tract.nta_name}
        </Text>
        
        <HStack spacing={3} mt={1}>
          <Text fontSize="xs" color="gray.500">
            {rentText}
          </Text>
          <Text fontSize="xs" color="gray.500">
            ID: {tract.geoid.slice(-3)}
          </Text>
        </HStack>

        {/* Mini metrics row */}
        <HStack spacing={2} mt={1}>
          <Badge size="sm" bg="blue.100" color="blue.800">
            🚶 {Math.round(tract.foot_traffic_score * 10)}/100
          </Badge>
          <Badge size="sm" bg="green.100" color="green.800">
            👥 {Math.round(tract.demographic_score * 100)}/100
          </Badge>
        </HStack>
      </VStack>
    </Box>
  );
}

export default function TractResultsList({ 
  searchResults, 
  onTractSelect, 
  selectedTractId 
}: TractResultsListProps) {
  const [sortedResults, setSortedResults] = useState<TractResult[]>([]);

  // Sort results by resilience score (highest first)
  useEffect(() => {
    const sorted = [...searchResults].sort((a, b) => b.custom_score - a.custom_score);
    setSortedResults(sorted);
  }, [searchResults]);

  if (!searchResults || searchResults.length === 0) {
    return (
      <VStack align="center" justify="center" p={8} spacing={3}>
        <Text fontSize="lg" color="gray.500">
          🔍 No results found
        </Text>
        <Text fontSize="sm" color="gray.400" textAlign="center">
          Try adjusting your filters or search criteria
        </Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={0} h="100%">
      {/* Header - like Google Maps */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              📊 Census Tracts
            </Text>
            <Text fontSize="sm" color="gray.600">
              {sortedResults.length} results • Sorted by score
            </Text>
          </VStack>
          
          {/* Top score highlight */}
          {sortedResults[0] && (
            <Badge bg="#FF492C" color="white" px={3} py={1} borderRadius="full">
              Best: {Math.round(sortedResults[0].custom_score * 100)}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Scrollable results list */}
      <VStack 
        align="stretch" 
        spacing={2} 
        p={3}
        flex="1" 
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
          '&::-webkit-scrollbar-thumb': { background: '#FF492C', borderRadius: '3px' }
        }}
      >
        {sortedResults.map((tract, index) => (
          <TractResultCard
            key={tract.geoid}
            tract={tract}
            isSelected={selectedTractId === tract.geoid}
            onClick={() => onTractSelect(tract)}
          />
        ))}
      </VStack>

      {/* Footer stats */}
      <Box p={3} borderTop="1px solid" borderColor="gray.200" bg="gray.50">
        <HStack justify="space-between" fontSize="xs" color="gray.600">
          <Text>
            Avg Score: {Math.round(sortedResults.reduce((sum, t) => sum + t.custom_score * 100, 0) / sortedResults.length)}
          </Text>
          <Text>
            Range: {Math.round(sortedResults[sortedResults.length - 1]?.custom_score * 100)}-{Math.round(sortedResults[0]?.custom_score * 100)}
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
}