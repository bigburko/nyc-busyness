// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Updated with CONFIRMED WORKING LoopNet Integration
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text, Badge, Flex
} from '@chakra-ui/react';
import { CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore } from '../../../../types/WeightTypes';
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { DemographicCharts } from './DemographicCharts';
import GoogleMapsImage from './GoogleMapsImage';

// Import the tract centroids JSON for coordinate lookup
import tractCentroids from './tract_centroids.json';

// Define proper demographic data types
interface DemographicDataItem {
  name: string;
  value: number;
  color: string;
}

interface RawDemographicData {
  ethnicityData: DemographicDataItem[] | null;
  demographicsData: DemographicDataItem[] | null;
  incomeData: DemographicDataItem[] | null;
}

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
  rawDemographicData?: RawDemographicData;
}

// Define types for the imported centroids
interface TractCentroid {
  lat: number;
  lng: number;
}

type TractCentroids = Record<string, TractCentroid>;

// ============================================================================
// LoopNet Integration - CONFIRMED WORKING PATTERNS ONLY
// ============================================================================

/*
 🧪 TESTING RESULTS SUMMARY:
 
 ✅ WHAT WORKS:
 - Specific neighborhood names with "-new-york-ny" suffix
 - Property types: retail-space, office-space, commercial-real-estate
 - Transaction types: for-lease, for-sale
 
 ❌ WHAT DOESN'T WORK (confirmed through manual testing):
 - Street names (broadway, canal-street, fifth-avenue, etc.)
 - Abbreviations (ues, uws, fidi, etc.) 
 - Landmark names (union-square, madison-square, etc.)
 - Alternative suffixes (manhattan, nyc, or no suffix)
 - Special separators (underscores, dots, spaces)
 - Transportation hubs (penn-station, grand-central, etc.)
 - Industrial/warehouse property types
 
 🎯 FINAL WORKING PATTERN: 
 https://www.loopnet.com/search/{property-type}/{neighborhood-name}-new-york-ny/for-lease/
 
 Only actual neighborhood names work - not streets, landmarks, or abbreviations.
*/

/**
 * CONFIRMED WORKING LoopNet neighborhood mappings
 * Based on manual testing - ONLY includes patterns that actually work
 */
const getLoopNetNeighborhoodUrl = (ntaName: string): string | null => {
  if (!ntaName || ntaName === 'Unknown' || ntaName.trim() === '') {
    return null;
  }

  const normalized = ntaName.toLowerCase().trim();
  
  // ✅ CONFIRMED WORKING - Only neighborhood names that actually work on LoopNet
  const workingNeighborhoods: Record<string, string> = {
    'times square': 'times-square-new-york-ny',
    'chinatown': 'chinatown-new-york-ny',
    'east harlem': 'east-harlem-new-york-ny', 
    'turtle bay': 'turtle-bay-new-york-ny',
    'east village': 'east-village-new-york-ny',
    'battery park': 'battery-park-new-york-ny',
    'gramercy park': 'gramercy-park-new-york-ny',
    'greenwich village': 'greenwich-village-new-york-ny',
    'hamilton heights': 'hamilton-heights-new-york-ny',
    'harlem': 'harlem-new-york-ny',
    'hells kitchen': 'hells-kitchen-new-york-ny',
    'hell\'s kitchen': 'hells-kitchen-new-york-ny',
    'inwood': 'inwood-new-york-ny',
    'lower east side': 'lower-east-side-new-york-ny',
    'manhattanville': 'manhattanville-new-york-ny',
    'flatiron district': 'flatiron-district-new-york-ny',
    'morningside heights': 'morningside-heights-new-york-ny',
    'kips bay': 'kips-bay-new-york-ny',
    'soho': 'soho-new-york-ny',
    'little italy': 'little-italy-new-york-ny',
    'tribeca': 'tribeca-new-york-ny',
    'carnegie hill': 'carnegie-hill-new-york-ny',
    'lenox hill': 'lenox-hill-new-york-ny',
    'yorkville': 'yorkville-new-york-ny',
    'upper west side': 'upper-west-side-new-york-ny',
    'lincoln square': 'lincoln-square-new-york-ny',
    'manhattan valley': 'manhattan-valley-new-york-ny',
    'washington heights': 'washington-heights-new-york-ny',
    'west village': 'west-village-new-york-ny',
    'two bridges': 'two-bridges-new-york-ny',
    'chelsea': 'hells-kitchen-new-york-ny', // Chelsea maps to Hell's Kitchen (adjacent)
  };

  // 🎯 COMPLEX NTA MAPPINGS - Map census tract compound names to working neighborhoods
  const ntaMappings: Record<string, string> = {
    // Chelsea area mappings
    'chelsea-hudson yards': 'hells-kitchen-new-york-ny',
    'chelsea hudson yards': 'hells-kitchen-new-york-ny',
    'hudson yards': 'hells-kitchen-new-york-ny',
    'chelsea': 'hells-kitchen-new-york-ny',
    
    // Midtown compound names
    'midtown-midtown south': 'times-square-new-york-ny',
    'murray hill-kips bay': 'kips-bay-new-york-ny', 
    'turtle bay-east midtown': 'turtle-bay-new-york-ny',
    'clinton': 'hells-kitchen-new-york-ny', // Clinton = Hell's Kitchen
    'times sq-theatre district': 'times-square-new-york-ny',
    'times square-theatre district': 'times-square-new-york-ny',
    
    // Downtown compound names  
    'soho-tribeca-civic center-little italy': 'soho-new-york-ny',
    'battery park city-lower manhattan': 'battery-park-new-york-ny',
    'stuyvesant town-cooper village': 'gramercy-park-new-york-ny',
    
    // Upper Manhattan compound names
    'upper east side-carnegie hill': 'carnegie-hill-new-york-ny',
    'central harlem north-polo grounds': 'harlem-new-york-ny',
    'central harlem': 'harlem-new-york-ny',
    'east harlem south': 'east-harlem-new-york-ny',
    'east harlem north': 'east-harlem-new-york-ny',
    
    // Alternative neighborhood names that map to working ones
    'nolita': 'little-italy-new-york-ny',
    'nomad': 'flatiron-district-new-york-ny',
    'noho': 'east-village-new-york-ny',
    'meatpacking district': 'west-village-new-york-ny',
    'bowery': 'lower-east-side-new-york-ny',
    'alphabet city': 'east-village-new-york-ny',
    
    // Upper Manhattan compound variations
    'morningside heights-hamilton heights': 'morningside-heights-new-york-ny',
    'washington heights-inwood': 'washington-heights-new-york-ny',
    'manhattanville-hamilton heights': 'hamilton-heights-new-york-ny',
    
    // Midtown direction mappings
    'midtown east': 'turtle-bay-new-york-ny',
    'midtown west': 'hells-kitchen-new-york-ny',
    
    // UES/UWS compound mappings
    'upper east side': 'lenox-hill-new-york-ny',
    'yorkville-upper east side': 'yorkville-new-york-ny',
    'carnegie hill-upper east side': 'carnegie-hill-new-york-ny',
    'lincoln square-upper west side': 'lincoln-square-new-york-ny',
    'manhattan valley-upper west side': 'manhattan-valley-new-york-ny',
  };

  // Combine confirmed working neighborhoods with NTA mappings
  const allMappings = { ...workingNeighborhoods, ...ntaMappings };
  
  // Try exact match first
  if (allMappings[normalized]) {
    console.log(`✅ [LoopNet] Direct match found: ${normalized} → ${allMappings[normalized]}`);
    return allMappings[normalized];
  }
  
  // Try partial matches for complex NTA names
  for (const [key, value] of Object.entries(allMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`✅ [LoopNet] Partial match found: ${normalized} → ${value} (via ${key})`);
      return value;
    }
  }
  
  // Try word-by-word matching for compound census tract names
  const normalizedWords = normalized.split(/[-\s]+/);
  for (const [key, value] of Object.entries(workingNeighborhoods)) {
    const keyWords = key.split(/[-\s]+/);
    
    // Check for significant word matches (excluding common words)
    const commonWords = ['and', 'the', 'of', 'in', 'on', 'at', 'district', 'area', 'park'];
    const significantMatches = normalizedWords.filter(word => 
      keyWords.includes(word) && !commonWords.includes(word) && word.length > 2
    );
    
    if (significantMatches.length > 0) {
      console.log(`✅ [LoopNet] Word match found: ${normalized} → ${value} (words: ${significantMatches.join(', ')})`);
      return value;
    }
  }
  
  console.log(`❌ [LoopNet] No working neighborhood found for: ${normalized} - will use Manhattan fallback`);
  return null;
};

/**
 * Generate LoopNet search URL with confirmed working property types
 */
const generateLoopNetUrl = (
  tract: TractResult, 
  propertyType: 'commercial-real-estate' = 'commercial-real-estate',
  transactionType: 'for-lease' | 'for-sale' = 'for-lease'
): string => {
  const baseUrl = 'https://www.loopnet.com/search';
  
  // Try neighborhood-specific URL first
  if (tract.nta_name && tract.nta_name !== 'Unknown' && tract.nta_name.trim() !== '') {
    const neighborhoodUrl = getLoopNetNeighborhoodUrl(tract.nta_name);
    
    if (neighborhoodUrl) {
      const url = `${baseUrl}/${propertyType}/${neighborhoodUrl}/${transactionType}/`;
      console.log(`✅ [LoopNet] Neighborhood-specific URL: ${url}`);
      return url;
    }
  }
  
  // Fallback to Times Square (central Manhattan, always has listings)
  const fallbackUrl = `${baseUrl}/${propertyType}/times-square-new-york-ny/${transactionType}/`;
  console.log(`🏙️ [LoopNet] Times Square fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};

/**
 * Open LoopNet search for commercial real estate
 */
const openLoopNetSearch = (tract: TractResult) => {
  const url = generateLoopNetUrl(tract, 'commercial-real-estate', 'for-lease');
  
  console.log(`[LoopNet] Opening commercial real estate search for ${tract.nta_name || tract.geoid}`);
  console.log(`[LoopNet] URL: ${url}`);
  
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Coordinate lookup helper for buttons
const getTractCoordinates = (geoid: string): { lat: number; lng: number } => {
  const centroids = tractCentroids as TractCentroids;
  const coords = centroids[geoid];
  
  if (coords) {
    return coords;
  }
  
  console.warn(`⚠️ [Coordinates] No coordinates found for tract ${geoid}, using NYC center`);
  return { lat: 40.7589, lng: -73.9851 }; // NYC center fallback
};

export default function TractDetailPanel({ 
  tract, 
  onClose, 
  rawDemographicData 
}: TractDetailPanelProps) {
  const filterStore = useFilterStore() as FilterStore;
  const weights = filterStore.weights || [];
  
  const resilienceScore = Math.round(tract.custom_score || 0);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerPadding = useBreakpointValue({ base: 4, md: 6 });

  // Scroll listener - only for overview tab
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || activeTab !== 'overview') return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      setScrollY(currentScrollY);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  // Reset scroll when changing tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setScrollY(0);
  }, [activeTab]);

  // Calculate if we should show compressed header (only for overview)
  const COMPRESS_THRESHOLD = 150;
  const isScrolled = activeTab === 'overview' && scrollY > COMPRESS_THRESHOLD;

  // Helper functions for scoring
  const getScoreColor = (score: number) => {
    if (score >= 80) return "green.500";
    if (score >= 60) return "blue.500";
    if (score >= 40) return "orange.500";
    return "red.500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'details', label: 'Details' }
  ];

  // Log when detail panel opens (for debugging)
  useEffect(() => {
    console.log(`📋 [TractDetailPanel] Opened for tract ${tract.geoid} (${tract.nta_name})`);
    
    // Test neighborhood mapping on panel open
    const loopNetMapping = getLoopNetNeighborhoodUrl(tract.nta_name);
    if (loopNetMapping) {
      console.log(`✅ [LoopNet] Neighborhood "${tract.nta_name}" maps to: ${loopNetMapping}`);
    } else {
      console.log(`⚠️ [LoopNet] No mapping found for "${tract.nta_name}" - will use Manhattan fallback`);
    }
  }, [tract.geoid, tract.nta_name]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Box>
            {/* Hero Image Section - Using Separate GoogleMapsImage Component */}
            <GoogleMapsImage tract={tract} />

            {/* Tract Name and Score */}
            <Box p={6} bg="white">
              <VStack spacing={4} align="stretch">
                {/* Main Title Row */}
                <Flex justify="space-between" align="flex-start">
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
                      {tract.nta_name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Census Tract {tract.geoid.slice(-6)}
                    </Text>
                  </VStack>
                  
                  {/* Resilience Score Badge */}
                  <VStack align="end" spacing={1}>
                    <Box
                      bg={getScoreColor(resilienceScore)}
                      color="white"
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="xl"
                      fontWeight="bold"
                      minW="60px"
                      textAlign="center"
                    >
                      {resilienceScore}
                    </Box>
                    <Text fontSize="xs" color="gray.500">
                      {getScoreLabel(resilienceScore)}
                    </Text>
                  </VStack>
                </Flex>

                {/* Rent Info Section */}
                <Box py={4} borderY="1px solid" borderColor="gray.200">
                  <HStack spacing={6} justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="blue.600">
                        {tract.avg_rent ? `$${tract.avg_rent.toLocaleString()}` : 'Rent N/A'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Monthly rent per sq ft</Text>
                    </VStack>
                    
                    <VStack align="end" spacing={1}>
                      <Badge 
                        colorScheme={tract.avg_rent && tract.avg_rent < 2000 ? 'green' : 
                                   tract.avg_rent && tract.avg_rent < 3000 ? 'yellow' : 'red'}
                        fontSize="sm" 
                        px={3} 
                        py={1}
                      >
                        {tract.avg_rent && tract.avg_rent < 2000 ? 'Affordable' : 
                         tract.avg_rent && tract.avg_rent < 3000 ? 'Moderate' : 'Premium'}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">Market rate</Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Tab Navigation */}
            <Box px={headerPadding} py={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
              <HStack spacing={1} w="full" justify="center">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    px={4}
                    py={3}
                    minW="80px"
                    onClick={() => setActiveTab(tab.id)}
                    color={tab.id === activeTab ? "blue.600" : "gray.600"}
                    borderBottom={tab.id === activeTab ? "3px solid" : "3px solid transparent"}
                    borderColor={tab.id === activeTab ? "blue.600" : "transparent"}
                    borderRadius="8px 8px 0 0"
                    fontWeight={tab.id === activeTab ? "semibold" : "normal"}
                    fontSize="sm"
                    _hover={{ 
                      bg: tab.id === activeTab ? "blue.50" : "gray.50",
                      color: tab.id === activeTab ? "blue.700" : "gray.700"
                    }}
                    transition="all 0.2s"
                  >
                    {tab.label}
                  </Button>
                ))}
              </HStack>
            </Box>

            {/* Overview Content */}
            <Box bg="gray.50" px={headerPadding} py={6}>
              {/* Quick Stats Cards */}
              <HStack spacing={4} w="full" justify="center" mb={6}>
                <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" textAlign="center" minW="120px">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {tract.foot_traffic_score ? Math.round(tract.foot_traffic_score) : 'N/A'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Foot Traffic</Text>
                </Box>
                
                <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" textAlign="center" minW="120px">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {tract.crime_score ? Math.round(tract.crime_score) : 'N/A'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Safety Score</Text>
                </Box>
                
                <Box bg="white" p={4} borderRadius="lg" boxShadow="sm" textAlign="center" minW="120px">
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {tract.demographic_score ? Math.round(tract.demographic_score) : 'N/A'}
                  </Text>
                  <Text fontSize="sm" color="gray.600">Demographics</Text>
                </Box>
              </HStack>

              {/* Location Summary */}
              <Box p={6} bg="white" borderRadius="lg" w="full" boxShadow="sm">
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                  Location Summary
                </Text>
                <Text color="gray.600" lineHeight="1.6">
                  This area shows strong potential for business development with good foot traffic and accessible transportation. 
                  The neighborhood demographics align well with target customer profiles.
                </Text>
              </Box>

              <Box h="200px" />
            </Box>
          </Box>
        );

      case 'trends':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Trends Analysis</Text>
            <VStack spacing={6}>
              <TrendAnalysis tract={tract} />
              {Array.from({ length: 8 }, (_, i) => (
                <Box key={i} p={6} bg="white" borderRadius="lg" w="full" boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>
                    Trend Analysis {i + 1}
                  </Text>
                  <Text color="gray.600">
                    Historical data and projections for this location.
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        );

      case 'demographics':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Demographics Analysis</Text>
            <VStack spacing={6}>
              <DemographicCharts tract={tract} rawDemographicData={rawDemographicData} />
              <AdvancedDemographics tract={tract} />
            </VStack>
          </Box>
        );

      case 'details':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Detailed Analysis</Text>
            <VStack spacing={6}>
              <ScoreCalculation 
                tract={tract}
                weights={weights}
                resilienceScore={resilienceScore}
              />
            </VStack>
          </Box>
        );

      default:
        return null;
    }
  };
  
  return (
    <Box position="relative" h="100vh" w="100%" bg="white" overflow="hidden">
      {/* Close Button */}
      <IconButton
        aria-label="Close details"
        icon={<CloseIcon />}
        size={isMobile ? "sm" : "md"}
        onClick={onClose}
        position="fixed"
        top="16px"
        right="16px"
        zIndex={300}
        bg="white"
        color="gray.600"
        borderRadius="full"
        boxShadow="0 2px 8px rgba(0,0,0,0.15)"
        border="1px solid"
        borderColor="gray.200"
        _hover={{ 
          bg: 'gray.50',
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          transform: "scale(1.05)"
        }}
        _active={{ transform: "scale(0.95)" }}
        transition="all 0.2s"
      />

      {/* Collapsing Header */}
      <Box 
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex={100}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={headerPadding}
        py={4}
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        transform={isScrolled ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.3s ease-in-out"
        opacity={isScrolled ? 1 : 0}
        pointerEvents={isScrolled ? "auto" : "none"}
        w="100%"
      >
        <Box maxW="none" w="full" pr="72px" pl="24px" h="full" display="flex" alignItems="center" justifyContent="center">
          <HStack spacing={4} align="center">
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color="gray.800" 
              lineHeight="1.2"
              isTruncated
              maxW="180px"
            >
              {tract.nta_name}
            </Text>
            
            <Box
              bg={getScoreColor(resilienceScore)}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="lg"
              fontWeight="bold"
              minW="50px"
              textAlign="center"
            >
              {resilienceScore}
            </Box>
          </HStack>
        </Box>
      </Box>

      {/* Static Header for Non-Overview Tabs */}
      {activeTab !== 'overview' && (
        <Box px={headerPadding} py={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
          <HStack spacing={4} mb={4} maxW="calc(100% - 80px)">
            <IconButton
              aria-label="Back to overview"
              icon={<ArrowBackIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab('overview')}
              flexShrink={0}
            />
            <VStack align="start" spacing={0} flex="1">
              <Text 
                fontSize="lg" 
                fontWeight="bold" 
                color="gray.800"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                maxW="200px"
              >
                {tract.nta_name}
              </Text>
            </VStack>
            
            <Box
              bg={getScoreColor(resilienceScore)}
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="md"
              fontWeight="bold"
              minW="45px"
              textAlign="center"
            >
              {resilienceScore}
            </Box>
          </HStack>
          
          {/* Tab Navigation */}
          <HStack spacing={1} w="full" justify="center">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                px={4}
                py={3}
                minW="80px"
                onClick={() => setActiveTab(tab.id)}
                color={tab.id === activeTab ? "blue.600" : "gray.600"}
                borderBottom={tab.id === activeTab ? "3px solid" : "3px solid transparent"}
                borderColor={tab.id === activeTab ? "blue.600" : "transparent"}
                borderRadius="8px 8px 0 0"
                fontWeight={tab.id === activeTab ? "semibold" : "normal"}
                fontSize="sm"
                _hover={{ 
                  bg: tab.id === activeTab ? "blue.50" : "gray.50",
                  color: tab.id === activeTab ? "blue.700" : "gray.700"
                }}
                transition="all 0.2s"
              >
                {tab.label}
              </Button>
            ))}
          </HStack>
        </Box>
      )}

      <Box 
        ref={scrollContainerRef}
        h="100vh"
        overflowY="auto"
        overflowX="hidden"
        pb="120px" // Reduced padding for simpler button layout
        css={{
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#A0AEC0',
          },
        }}
      >
        {renderTabContent()}
      </Box>

      {/* Action Buttons - Single Commercial Real Estate Button */}
      <Box 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        p={headerPadding} 
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(12px)"
        borderTop="1px solid" 
        borderColor="rgba(255, 255, 255, 0.2)"
        boxShadow="0 -8px 32px rgba(0,0,0,0.1)"
        zIndex={50}
        pointerEvents="auto"
      >
        <HStack spacing={4} w="full">
          {/* Primary LoopNet Button */}
          <Button
            size="lg"
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(99, 170, 246, 0.9) 100%)"
            color="white"
            _hover={{ 
              bg: "linear-gradient(135deg, rgba(59, 130, 246, 1) 0%, rgba(99, 170, 246, 1) 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 40px rgba(59, 130, 246, 0.4)"
            }}
            _active={{ transform: "translateY(0)" }}
            flex="2"
            borderRadius="2xl"
            fontWeight="600"
            h="56px"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.3)"
            boxShadow="0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
            transition="all 0.3s ease"
            onClick={() => openLoopNetSearch(tract)}
          >
            <Text fontSize="lg" fontWeight="600">Find Commercial Properties</Text>
          </Button>
          
          {/* Secondary Actions */}
          <Button 
            size="lg" 
            bg="rgba(255, 255, 255, 0.8)"
            backdropFilter="blur(8px)"
            color="gray.700"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.3)"
            flex="1" 
            borderRadius="xl"
            _hover={{ 
              bg: "rgba(255, 255, 255, 0.9)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }}
            h="56px"
            fontWeight="500"
            transition="all 0.2s"
          >
            Save Location
          </Button>
          
          <Button 
            size="lg" 
            bg="rgba(255, 255, 255, 0.8)"
            backdropFilter="blur(8px)"
            color="gray.700"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.3)"
            flex="1" 
            borderRadius="xl"
            _hover={{ 
              bg: "rgba(255, 255, 255, 0.9)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
            }}
            h="56px"
            fontWeight="500"
            transition="all 0.2s"
          >
            Share Analysis
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}