// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Google Maps Style with Smart Headers
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text, Badge, Image, Flex
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore } from '../../../../types/WeightTypes';
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { DemographicCharts } from './DemographicCharts';

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

// Google Maps static image generator with multiple map types
const generateTractImages = (tract: TractResult) => {
  // Use tract center coordinates or fallback to NYC center
  const lat = 40.7589; // You can extract from tract.centroid if available
  const lng = -73.9851;
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLEMAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Maps API key not found, using fallback image');
    return {
      satellite: `https://tile.openstreetmap.org/15/${Math.floor((lng + 180) / 360 * Math.pow(2, 15))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 15))}.png`,
      hybrid: `https://tile.openstreetmap.org/15/${Math.floor((lng + 180) / 360 * Math.pow(2, 15))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, 15))}.png`
    };
  }
  
  const baseUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&key=${apiKey}`;
  
  return {
    satellite: `${baseUrl}&maptype=satellite`, // Pure satellite view
    hybrid: `${baseUrl}&maptype=hybrid`,       // Satellite + street labels  
    roadmap: `${baseUrl}&maptype=roadmap`,     // Traditional street map
    terrain: `${baseUrl}&maptype=terrain`      // Topographical view
  };
};

// Simple function for current usage
const generateTractImage = (tract: TractResult): string => {
  return generateTractImages(tract).satellite; // Default to satellite view
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
  const COMPRESS_THRESHOLD = 150; // Halfway down the 300px image
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Box>
            {/* Hero Image Section - Google Maps Style */}
            <Box position="relative" h="300px" w="100%" bg="gray.200">
              <Image
                src={generateTractImage(tract)}
                alt={`Aerial view of ${tract.nta_name}`}
                w="100%"
                h="100%"
                objectFit="cover"
                fallback={
                  <Box 
                    w="100%" 
                    h="100%" 
                    bg="gray.300" 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                  >
                    <Text color="gray.600" fontSize="lg">📍 Loading area view...</Text>
                  </Box>
                }
              />
              
              {/* Photo indicator overlay */}
              <Box
                position="absolute"
                bottom="16px"
                left="16px"
                bg="blackAlpha.700"
                color="white"
                px={3}
                py={2}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="medium"
              >
                📷 Aerial View
              </Box>
            </Box>

            {/* Tract Name and Score - Google Maps Style */}
            <Box p={6} bg="white">
              <VStack spacing={4} align="stretch">
                {/* Main Title Row */}
                <Flex justify="space-between" align="flex-start">
                  <VStack align="start" spacing={1} flex="1">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
                      {tract.nta_name}
                    </Text>
                  </VStack>
                  
                  {/* Resilience Score Badge - Green pill style */}
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
                </Flex>

                {/* Rent Info Section - Where Google Maps shows reviews */}
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

            {/* Tab Navigation for Overview */}
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
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Scroll: {Math.round(scrollY)}px | Header: {isScrolled ? 'Visible' : 'Hidden'} | Tab: {activeTab}
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
        zIndex={200}
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

      {/* Collapsing Header - Slides down when scrolled on Overview */}
      <Box 
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex={120}
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
            
            {/* Score pill in collapsing header */}
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
            
            {/* Score pill in static header */}
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
          
          {/* Tab Navigation for Other Tabs */}
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
        pb="120px"
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

      {/* Fixed Action Buttons - Google Maps Style */}
      <Box 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        p={headerPadding} 
        bg="white" 
        borderTop="1px solid" 
        borderColor="gray.200"
        boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
        zIndex={80}
        pointerEvents="auto"
      >
        {isMobile ? (
          <VStack spacing={3}>
            <Button
              size="lg"
              bg="#4285F4"
              color="white"
              _hover={{ bg: "#3367D6" }}
              leftIcon={<ExternalLinkIcon />}
              w="full"
              borderRadius="lg"
              fontWeight="bold"
              h="48px"
              onClick={() => {
                const coords = `40.7589,-73.9851`;
                window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
              }}
            >
              Directions
            </Button>
            
            <HStack spacing={3} w="full">
              <Button 
                size="lg" 
                variant="outline" 
                flex="1" 
                borderRadius="lg"
                borderColor="gray.300"
                _hover={{ bg: "gray.50" }}
                h="48px"
              >
                Save
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                flex="1" 
                borderRadius="lg"
                borderColor="gray.300"
                _hover={{ bg: "gray.50" }}
                h="48px"
              >
                Share
              </Button>
            </HStack>
          </VStack>
        ) : (
          <HStack spacing={4}>
            <Button
              size="lg"
              bg="#4285F4"
              color="white"
              _hover={{ bg: "#3367D6" }}
              leftIcon={<ExternalLinkIcon />}
              flex="2"
              borderRadius="lg"
              fontWeight="bold"
              h="48px"
              onClick={() => {
                const coords = `40.7589,-73.9851`;
                window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
              }}
            >
              Directions
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              flex="1" 
              borderRadius="lg"
              borderColor="gray.300"
              _hover={{ bg: "gray.50" }}
              h="48px"
            >
              Save
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              flex="1" 
              borderRadius="lg"
              borderColor="gray.300"
              _hover={{ bg: "gray.50" }}
              h="48px"
            >
              Share
            </Button>
          </HStack>
        )}
      </Box>
    </Box>
  );
}