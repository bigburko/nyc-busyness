// src/components/ui/OverallJustificationDisplay.tsx - FIXED: Complete working component with linting fixes
'use client';

import { Box, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import CollapsibleSection from './CollapsibleSection';

interface SearchZone {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  avg_rent?: number;
  demographic_score?: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score: number;
  rent_score: number;
  poi_score: number;
}

interface SearchResults {
  zones: SearchZone[];
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
}

interface OverallJustificationDisplayProps {
  searchResults?: SearchResults | null;
  lastQuery?: string;
  isVisible: boolean;
}

export default function OverallJustificationDisplay({ 
  searchResults, 
  lastQuery, 
  isVisible 
}: OverallJustificationDisplayProps) {
  if (!isVisible || !searchResults?.zones?.length) {
    return null;
  }

  const topResult = searchResults.zones[0];
  const totalFound = searchResults.total_zones_found || 0;
  const otherNeighborhoods = searchResults.zones.slice(1, 4).map(zone => zone.nta_name || zone.tract_name);

  // Generate quality level based on score and use it in the display
  const getScoreQuality = (score: number) => {
    if (score >= 85) return { level: "EXCELLENT", color: "green.600" };
    if (score >= 75) return { level: "HIGH", color: "green.500" };
    if (score >= 65) return { level: "GOOD", color: "blue.500" };
    return { level: "MODERATE", color: "orange.500" };
  };

  const scoreInfo = getScoreQuality(topResult.custom_score);

  // Generate weighting explanation with neighborhood mentions
  const generateWeightingExplanation = () => {
    const businessType = lastQuery?.toLowerCase().includes('restaurant') ? 'restaurant' :
                        lastQuery?.toLowerCase().includes('bar') ? 'bar' :
                        lastQuery?.toLowerCase().includes('coffee') ? 'coffee shop' :
                        lastQuery?.toLowerCase().includes('retail') ? 'retail' :
                        'general business';

    const neighborhoodList = otherNeighborhoods.length > 0 
      ? `${otherNeighborhoods.slice(0, 2).join(', ')}${otherNeighborhoods.length > 2 ? `, and ${otherNeighborhoods.length - 2} other area${otherNeighborhoods.length > 3 ? 's' : ''}` : ''}`
      : 'this area';

    let explanation = `The analysis identified strong opportunities across ${Math.min(totalFound, 5)} distinct neighborhoods: ${topResult.nta_name || topResult.tract_name}`;
    
    if (otherNeighborhoods.length > 0) {
      explanation += `, ${neighborhoodList}. Each area offers unique advantages for your ${businessType}.`;
    } else {
      explanation += ` as the standout location for your ${businessType}.`;
    }

    // Business-specific weighting
    if (businessType === 'bar') {
      explanation += ` For nightlife venues, I weighted evening foot traffic patterns heavily (45%), prioritized young professional demographics (25%), and considered crime safety scores (20%). The remaining factors included flood risk mitigation (5%) and rent optimization (5%).`;
    } else if (businessType === 'coffee shop') {
      explanation += ` For coffee establishments, I balanced morning foot traffic patterns (40%), demographic diversity (20%), rent affordability (20%), and location accessibility. Crime safety and flood risk each contributed 10% to ensure long-term viability.`;
    } else if (businessType === 'restaurant') {
      explanation += ` For restaurants, I optimized lunch and dinner foot traffic (40%), balanced demographic appeal (25%), prioritized accessible rent levels (20%), and factored in safety metrics (15%) for sustained success.`;
    } else {
      explanation += ` For your business type, I applied a balanced weighting approach: foot traffic patterns (35%), demographic alignment (25%), financial sustainability through rent analysis (20%), safety considerations (15%), and infrastructure resilience (5%).`;
    }

    return explanation;
  };

  return (
    <CollapsibleSection
      title="🎯 Why Bricky Chose These Areas"
      defaultIsOpen={false}
      glowing={true}
    >
      <VStack align="start" spacing={6} pt={2}>
        {/* Main Explanation - Rounded Box */}
        <Box
          bg="gray.100"
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="gray.300"
          w="full"
          mt={1}
        >
          <Text fontSize="md" color="gray.700" lineHeight="1.6">
            {generateWeightingExplanation()}
          </Text>
        </Box>

        {/* Key Insights - Rounded Box */}
        <Box
          bg="blue.50"
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="blue.200"
          w="full"
        >
          <HStack spacing={3} mb={3}>
            <Box fontSize="20px">💡</Box>
            <Text fontSize="md" fontWeight="bold" color="blue.700">
              KEY INSIGHTS
            </Text>
          </HStack>
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" color="gray.700">
              • Demographic alignment optimized for your target market
            </Text>
            <Text fontSize="sm" color="gray.700">
              • Peak activity periods matched to business model
            </Text>
            <Text fontSize="sm" color="gray.700">
              • Balanced approach between foot traffic and affordability
            </Text>
            <Text fontSize="sm" color="gray.700">
              • Safety and infrastructure factors prioritized for sustainability
            </Text>
          </VStack>
        </Box>

        {/* Top Recommendation - Rounded Box */}
        <Box
          bg="green.50"
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="green.200"
          w="full"
          mb={3}
        >
          <HStack spacing={3} mb={3}>
            <Box fontSize="20px">🏆</Box>
            <Text fontSize="md" fontWeight="bold" color="green.700">
              TOP RECOMMENDATION
            </Text>
          </HStack>
          
          <VStack align="start" spacing={3}>
            {/* Neighborhood Name */}
            <Text fontSize="lg" color="gray.800" fontWeight="bold">
              {topResult.display_name || topResult.tract_name}
            </Text>

            {/* Score Display with Quality Level */}
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.600">Score:</Text>
              <Badge colorScheme="green" variant="subtle" fontSize="sm" px={3} py={1}>
                {Math.round(topResult.custom_score)}/100
              </Badge>
              <Badge 
                colorScheme={scoreInfo.color.includes('green') ? 'green' : scoreInfo.color.includes('blue') ? 'blue' : 'orange'} 
                variant="outline" 
                fontSize="xs" 
                px={2} 
                py={1}
              >
                {scoreInfo.level}
              </Badge>
            </HStack>

            {/* Rent Display - Added PSF */}
            {topResult.avg_rent && (
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.600">Average Rent:</Text>
                <Badge colorScheme="blue" variant="subtle" fontSize="sm" px={3} py={1}>
                  ${topResult.avg_rent.toLocaleString()}/month PSF
                </Badge>
              </HStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </CollapsibleSection>
  );
}