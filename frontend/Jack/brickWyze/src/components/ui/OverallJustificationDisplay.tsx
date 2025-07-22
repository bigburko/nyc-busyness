// src/components/ui/OverallJustificationDisplay.tsx - NEW: Shows AI's overall reasoning for results
'use client';

import { Box, Text, VStack, HStack, Badge, Flex } from '@chakra-ui/react';
import { useState } from 'react';

interface SearchZone {
  geoid: string;
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  custom_score: number;
  demographic_match_pct?: number;
  foot_traffic_score?: number;
  crime_score?: number;
  avg_rent?: number;
  [key: string]: unknown;
}

interface OverallJustificationDisplayProps {
  searchResults?: {
    zones: SearchZone[];
    total_zones_found: number;
    top_zones_returned: number;
  } | null;
  lastQuery?: string; // The user's original request
  aiReasoning?: string; // Overall AI reasoning from the API
  isVisible?: boolean;
}

const OverallJustificationDisplay: React.FC<OverallJustificationDisplayProps> = ({
  searchResults,
  lastQuery,
  aiReasoning,
  isVisible = true
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't show if no results or not visible
  if (!isVisible || !searchResults?.zones?.length) {
    return null;
  }

  // Generate smart insights from the results
  const generateInsights = () => {
    const zones = searchResults.zones.slice(0, 3); // Top 3 results
    const insights = [];

    // Neighborhood diversity insight
    const neighborhoods = [...new Set(zones.map(z => z.nta_name || z.tract_name))];
    if (neighborhoods.length > 1) {
      insights.push(`Found ${neighborhoods.length} distinct neighborhoods: ${neighborhoods.slice(0, 2).join(', ')}${neighborhoods.length > 2 ? ', and more' : ''}`);
    }

    // Ethnicity fit insight (if available)
    const ethnicityFits = zones.filter(z => z.demographic_match_pct).map(z => z.demographic_match_pct!);
    if (ethnicityFits.length > 0) {
      const avgEthnicityFit = ethnicityFits.reduce((a, b) => a + b, 0) / ethnicityFits.length;
      const maxFit = Math.max(...ethnicityFits);
      if (maxFit > 50) {
        insights.push(`Strong demographic match found (up to ${maxFit.toFixed(0)}% ethnicity fit)`);
      } else if (avgEthnicityFit > 30) {
        insights.push(`Good demographic alignment (${avgEthnicityFit.toFixed(0)}% average match)`);
      }
    }

    // Rent affordability insight
    const rents = zones.filter(z => z.avg_rent).map(z => z.avg_rent!);
    if (rents.length > 0) {
      const avgRent = rents.reduce((a, b) => a + b, 0) / rents.length;
      const minRent = Math.min(...rents);
      const maxRent = Math.max(...rents);
      
      if (maxRent - minRent > 30) {
        insights.push(`Rent range: $${minRent.toFixed(0)}-${maxRent.toFixed(0)}/sqft (diverse affordability)`);
      } else {
        insights.push(`Consistent rent level: ~$${avgRent.toFixed(0)}/sqft`);
      }
    }

    // Score quality insight
    const scores = zones.map(z => z.custom_score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const topScore = Math.max(...scores);
    
    if (topScore >= 85) {
      insights.push(`Excellent matches found (top score: ${topScore.toFixed(0)})`);
    } else if (avgScore >= 75) {
      insights.push(`Strong overall quality (average score: ${avgScore.toFixed(0)})`);
    } else if (avgScore >= 65) {
      insights.push(`Good viable options (average score: ${avgScore.toFixed(0)})`);
    }

    return insights;
  };

  const insights = generateInsights();
  const topResult = searchResults.zones[0];

  // Create a smart overall summary
  const generateSummary = () => {
    if (aiReasoning) {
      return aiReasoning; // Use AI's reasoning if provided
    }

    // Fallback: Generate from data
    const topNeighborhood = topResult?.nta_name || topResult?.tract_name || 'Top area';
    const businessType = lastQuery?.toLowerCase().includes('restaurant') ? 'restaurant' :
                        lastQuery?.toLowerCase().includes('coffee') ? 'coffee shop' :
                        lastQuery?.toLowerCase().includes('bar') ? 'bar' :
                        lastQuery?.toLowerCase().includes('retail') ? 'retail business' :
                        'business';

    let summary = `Found strong locations for your ${businessType}. `;
    
    if (topResult?.demographic_match_pct && topResult.demographic_match_pct > 40) {
      summary += `${topNeighborhood} offers excellent demographic alignment (${topResult.demographic_match_pct.toFixed(0)}% match) `;
    }
    
    if (topResult?.avg_rent) {
      summary += `with competitive rent at $${topResult.avg_rent.toFixed(0)}/sqft. `;
    }

    summary += insights.length > 0 ? `Key strengths: ${insights[0].toLowerCase()}.` : '';
    
    return summary;
  };

  const summary = generateSummary();

  return (
    <Box 
      bg="rgba(72, 187, 120, 0.05)" 
      borderRadius="xl" 
      p={4} 
      border="1px solid rgba(72, 187, 120, 0.2)"
      mt={4}
      transition="all 0.2s"
    >
      {/* Header */}
      <Flex 
        justify="space-between" 
        align="center" 
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        mb={isExpanded ? 3 : 0}
      >
        <HStack spacing={3}>
          <Text fontSize="sm" fontWeight="bold" color="green.700">
            🎯 Why Bricky Chose These Areas
          </Text>
          <Badge bg="green.500" color="white" fontSize="xs" borderRadius="full">
            {searchResults.zones.length} results
          </Badge>
        </HStack>
        
        <Box
          transform={isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        >
          <Text fontSize="sm" color="green.600">▼</Text>
        </Box>
      </Flex>

      {/* Expandable Content */}
      {isExpanded && (
        <VStack spacing={3} align="stretch">
          
          {/* Main Summary */}
          <Box 
            bg="white" 
            borderRadius="lg" 
            p={3} 
            border="1px solid rgba(72, 187, 120, 0.1)"
          >
            <Text fontSize="sm" color="gray.700" lineHeight="1.6">
              {summary}
            </Text>
          </Box>

          {/* Key Insights */}
          {insights.length > 0 && (
            <VStack spacing={2} align="stretch">
              <Text fontSize="xs" fontWeight="semibold" color="green.600" textTransform="uppercase">
                Key Insights
              </Text>
              
              {insights.slice(0, 3).map((insight, index) => (
                <HStack key={index} spacing={2} align="flex-start">
                  <Box mt={1}>
                    <Box w="4px" h="4px" bg="green.400" borderRadius="full" />
                  </Box>
                  <Text fontSize="xs" color="gray.600" lineHeight="1.4">
                    {insight}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}

          {/* Top Result Highlight */}
          {topResult && (
            <Box 
              bg="green.50" 
              borderRadius="lg" 
              p={3} 
              border="1px solid rgba(72, 187, 120, 0.2)"
            >
              <HStack spacing={2} mb={2}>
                <Text fontSize="xs" fontWeight="bold" color="green.700">
                  🏆 TOP RECOMMENDATION
                </Text>
                <Badge bg="green.600" color="white" fontSize="xs">
                  Score: {topResult.custom_score.toFixed(0)}
                </Badge>
              </HStack>
              
              <Text fontSize="xs" color="green.800" fontWeight="medium">
                {topResult.display_name || topResult.tract_name}
              </Text>
              
              {topResult.avg_rent && (
                <Text fontSize="xs" color="green.600" mt={1}>
                  ${topResult.avg_rent.toFixed(0)}/sqft
                  {topResult.demographic_match_pct && (
                    <> • {topResult.demographic_match_pct.toFixed(0)}% demographic fit</>
                  )}
                </Text>
              )}
            </Box>
          )}

          {/* Search Context */}
          {lastQuery && (
            <Box pt={2} borderTop="1px solid rgba(72, 187, 120, 0.1)">
              <Text fontSize="xs" color="gray.500">
                Search: &ldquo;{lastQuery}&rdquo; • {searchResults.total_zones_found} total areas analyzed
              </Text>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default OverallJustificationDisplay;