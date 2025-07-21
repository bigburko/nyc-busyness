// src/components/features/search/TractResultsList.tsx - FIXED: Removed unused function

'use client';

import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { useState, useEffect } from 'react';

// ✅ FIXED: Use exact interface that matches your existing data structure
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
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  
  // ✅ NEW: Optional foot traffic timeline data
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
}

interface TractResultsListProps {
  searchResults: TractResult[];
  onTractSelect: (tract: TractResult) => void;
  selectedTractId?: string;
}

// ✅ FIXED: Removed unused getScoreColor function

// Get badge variant based on score
function getScoreBadgeColor(score: number): { bg: string; color: string } {
  if (score >= 80) return { bg: "green.100", color: "green.800" };
  if (score >= 60) return { bg: "blue.100", color: "blue.800" };
  if (score >= 40) return { bg: "yellow.100", color: "yellow.800" };
  if (score >= 20) return { bg: "orange.100", color: "orange.800" };
  return { bg: "red.100", color: "red.800" };
}

// Individual result card component - ✅ FIXED: Updated for 0-100 scale
function TractResultCard({ 
  tract, 
  isSelected, 
  onClick 
}: { 
  tract: TractResult; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  // ✅ FIXED: Scores are already 0-100, no multiplication needed
  const resilienceScore = Math.round(tract.custom_score || 0);
  const footTrafficScore = Math.round(tract.foot_traffic_score || 0);
  const demographicScore = Math.round(tract.demographic_score || 0);
  const crimeScore = Math.round(tract.crime_score || 0);
  
  const rentText = tract.avg_rent ? `$${tract.avg_rent.toFixed(1)}/sqft` : 'Rent: N/A';
  
  // ✅ NEW: Calculate foot traffic trend if timeline data exists
  const getFootTrafficTrend = () => {
    if (!tract.foot_traffic_timeline) return null;
    
    const current2024 = tract.foot_traffic_timeline['2024'] || 0;
    const pred2025 = tract.foot_traffic_timeline['pred_2025'] || 0;
    const change = pred2025 - current2024;
    
    if (Math.abs(change) < 1) return null;
    
    return {
      direction: change > 0 ? 'up' : 'down',
      value: Math.abs(Math.round(change)),
      color: change > 0 ? 'green.600' : 'red.600',
      icon: change > 0 ? '📈' : '📉'
    };
  };
  
  const footTrafficTrend = getFootTrafficTrend();
  
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
        borderColor: "#FF492C",
        transform: "translateY(-1px)",
        boxShadow: "md"
      }}
      transition="all 0.2s"
      onClick={onClick}
      position="relative"
      boxShadow={isSelected ? "0 4px 12px rgba(255, 73, 44, 0.15)" : "sm"}
    >
      {/* Main resilience score badge - top right */}
      <Badge
        position="absolute"
        top={2}
        right={2}
        bg={getScoreBadgeColor(resilienceScore).bg}
        color={getScoreBadgeColor(resilienceScore).color}
        borderRadius="full"
        px={3}
        py={1}
        fontSize="sm"
        fontWeight="bold"
        boxShadow="sm"
      >
        {resilienceScore}
      </Badge>

      {/* Main content */}
      <VStack align="start" spacing={2} pr={16}>
        <Text fontWeight="bold" fontSize="md" noOfLines={1} color="gray.800">
          🏘️ {tract.nta_name}
        </Text>
        
        <Text fontSize="sm" color="gray.600" noOfLines={1}>
          {tract.display_name}
        </Text>
        
        <HStack spacing={3} mt={1}>
          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            {rentText}
          </Text>
          <Text fontSize="xs" color="gray.500">
            ID: {tract.geoid.slice(-3)}
          </Text>
        </HStack>

        {/* ✅ UPDATED: Enhanced metrics row with 0-100 scale scores */}
        <HStack spacing={2} mt={2} wrap="wrap">
          {/* Foot Traffic with trend indicator */}
          <HStack spacing={1}>
            <Badge 
              size="sm" 
              bg={getScoreBadgeColor(footTrafficScore).bg} 
              color={getScoreBadgeColor(footTrafficScore).color}
              fontSize="xs"
              px={2}
              py={1}
            >
              🚶 {footTrafficScore}
            </Badge>
            {footTrafficTrend && (
              <Text fontSize="xs" color={footTrafficTrend.color} fontWeight="bold">
                {footTrafficTrend.icon}
              </Text>
            )}
          </HStack>
          
          {/* Demographics */}
          <Badge 
            size="sm" 
            bg={getScoreBadgeColor(demographicScore).bg} 
            color={getScoreBadgeColor(demographicScore).color}
            fontSize="xs"
            px={2}
            py={1}
          >
            👥 {demographicScore}
          </Badge>
          
          {/* Safety/Crime Score */}
          <Badge 
            size="sm" 
            bg={getScoreBadgeColor(crimeScore).bg} 
            color={getScoreBadgeColor(crimeScore).color}
            fontSize="xs"
            px={2}
            py={1}
          >
            🛡️ {crimeScore}
          </Badge>
        </HStack>

        {/* ✅ NEW: Additional insights row */}
        <HStack spacing={2} fontSize="xs" color="gray.500">
          {/* Demographic match percentage */}
          {tract.demographic_match_pct && tract.demographic_match_pct > 0 && (
            <Text>
              Ethnicity fit: {Math.round(
                tract.demographic_match_pct > 1 
                  ? tract.demographic_match_pct 
                  : tract.demographic_match_pct * 100
              )}%
            </Text>
          )}
          
          {/* Foot traffic timeline info */}
          {tract.foot_traffic_timeline?.['2024'] && (
            <Text>
              2024 traffic: {Math.round(tract.foot_traffic_timeline['2024'])}
            </Text>
          )}
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
  const [sortBy, setSortBy] = useState<'score' | 'foot_traffic' | 'safety'>('score');

  // Sort results by selected criteria
  useEffect(() => {
    let sorted = [...searchResults];
    
    switch (sortBy) {
      case 'foot_traffic':
        sorted = sorted.sort((a, b) => (b.foot_traffic_score || 0) - (a.foot_traffic_score || 0));
        break;
      case 'safety':
        sorted = sorted.sort((a, b) => (b.crime_score || 0) - (a.crime_score || 0));
        break;
      default: // 'score'
        sorted = sorted.sort((a, b) => b.custom_score - a.custom_score);
        break;
    }
    
    setSortedResults(sorted);
  }, [searchResults, sortBy]);

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

  // ✅ FIXED: Scores are already 0-100, no conversion needed
  const getDisplayScore = (score: number) => {
    return Math.round(score);
  };

  // Calculate statistics for the results
  const avgScore = Math.round(
    sortedResults.reduce((sum, t) => sum + getDisplayScore(t.custom_score), 0) / sortedResults.length
  );
  const avgFootTraffic = Math.round(
    sortedResults.reduce((sum, t) => sum + (t.foot_traffic_score || 0), 0) / sortedResults.length
  );
  const avgSafety = Math.round(
    sortedResults.reduce((sum, t) => sum + (t.crime_score || 0), 0) / sortedResults.length
  );
  
  // Check how many have foot traffic timeline data
  const tractsWithTimelineData = sortedResults.filter(t => t.foot_traffic_timeline).length;

  return (
    <VStack align="stretch" spacing={0} h="100%">
      {/* Header with sorting options */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.200" bg="white">
        <VStack spacing={3} align="start">
          <HStack justify="space-between" align="center" w="full">
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                📊 Census Tracts
              </Text>
              <Text fontSize="sm" color="gray.600">
                {sortedResults.length} results
              </Text>
            </VStack>
            
            {/* Top score highlight */}
            {sortedResults[0] && (
              <Badge 
                bg={getScoreBadgeColor(getDisplayScore(sortedResults[0].custom_score)).bg} 
                color={getScoreBadgeColor(getDisplayScore(sortedResults[0].custom_score)).color} 
                px={3} 
                py={1} 
                borderRadius="full" 
                fontSize="sm"
                fontWeight="bold"
              >
                Best: {getDisplayScore(sortedResults[0].custom_score)}
              </Badge>
            )}
          </HStack>
          
          {/* ✅ NEW: Sort options using basic Box instead of Button */}
          <HStack spacing={2} wrap="wrap">
            <Text fontSize="xs" color="gray.500" fontWeight="medium">Sort by:</Text>
            <Box
              as="button"
              px={3}
              py={1}
              fontSize="xs"
              borderRadius="full"
              bg={sortBy === 'score' ? '#FF492C' : 'gray.100'}
              color={sortBy === 'score' ? 'white' : 'gray.600'}
              _hover={{ bg: sortBy === 'score' ? '#E53E3E' : 'gray.200' }}
              onClick={() => setSortBy('score')}
              transition="all 0.2s"
            >
              Overall Score
            </Box>
            <Box
              as="button"
              px={3}
              py={1}
              fontSize="xs"
              borderRadius="full"
              bg={sortBy === 'foot_traffic' ? '#4299E1' : 'gray.100'}
              color={sortBy === 'foot_traffic' ? 'white' : 'gray.600'}
              _hover={{ bg: sortBy === 'foot_traffic' ? '#3182CE' : 'gray.200' }}
              onClick={() => setSortBy('foot_traffic')}
              transition="all 0.2s"
            >
              🚶 Foot Traffic
            </Box>
            <Box
              as="button"
              px={3}
              py={1}
              fontSize="xs"
              borderRadius="full"
              bg={sortBy === 'safety' ? '#10B981' : 'gray.100'}
              color={sortBy === 'safety' ? 'white' : 'gray.600'}
              _hover={{ bg: sortBy === 'safety' ? '#059669' : 'gray.200' }}
              onClick={() => setSortBy('safety')}
              transition="all 0.2s"
            >
              🛡️ Safety
            </Box>
          </HStack>
        </VStack>
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
        {sortedResults.map((tract) => (
          <TractResultCard
            key={tract.geoid}
            tract={tract}
            isSelected={selectedTractId === tract.geoid}
            onClick={() => onTractSelect(tract)}
          />
        ))}
      </VStack>

      {/* ✅ UPDATED: Enhanced footer stats */}
      <Box p={3} borderTop="1px solid" borderColor="gray.200" bg="gray.50">
        <VStack spacing={2}>
          <HStack justify="space-between" fontSize="xs" color="gray.600" w="full">
            <Text fontWeight="medium">
              Avg Overall: {avgScore}
            </Text>
            <Text fontWeight="medium">
              Range: {getDisplayScore(sortedResults[sortedResults.length - 1]?.custom_score)}-{getDisplayScore(sortedResults[0]?.custom_score)}
            </Text>
          </HStack>
          
          <HStack justify="space-between" fontSize="xs" color="gray.600" w="full">
            <Text>
              🚶 Avg Traffic: {avgFootTraffic}
            </Text>
            <Text>
              🛡️ Avg Safety: {avgSafety}
            </Text>
          </HStack>
          
          {/* ✅ NEW: Foot traffic data availability indicator */}
          {tractsWithTimelineData > 0 && (
            <Text fontSize="xs" color="blue.600" textAlign="center">
              📊 {tractsWithTimelineData}/{sortedResults.length} tracts have timeline data
            </Text>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}