// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Complete Google Maps Style
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore } from '../../../../types/WeightTypes';
import { ScoreHeader } from './ScoreHeader';
import { QuickStats } from './QuickStats';
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
  rawDemographicData?: {
    ethnicityData: any[] | null;
    demographicsData: any[] | null;
    incomeData: any[] | null;
  };
}

export default function TractDetailPanel({ 
  tract, 
  onClose, 
  rawDemographicData 
}: TractDetailPanelProps) {
  const filterStore = useFilterStore() as FilterStore;
  const weights = filterStore.weights || [];
  
  const resilienceScore = Math.round(tract.custom_score || 0);
  const tractNumber = tract.geoid;
  
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });
  const headerPadding = useBreakpointValue({ base: 4, md: 6 });
  
  // Prepare tract info for simplified header
  const tractInfo = {
    ntaName: tract.nta_name,
    tractNumber: tractNumber,
    avgRent: tract.avg_rent
  };

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
  const COMPRESS_THRESHOLD = 250;
  const isScrolled = activeTab === 'overview' && scrollY > COMPRESS_THRESHOLD;

  // Helper function for score status
  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getScoreColor = (score: number) => {
    return score >= 60 ? "green.600" : "orange.600";
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
            <Box>
              <ScoreHeader 
                score={resilienceScore} 
                tractInfo={tractInfo}
              />
            </Box>

            <Box px={headerPadding} py={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
              <HStack spacing={0} w="full">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    flex="1"
                    py={3}
                    onClick={() => setActiveTab(tab.id)}
                    color={tab.id === activeTab ? "blue.600" : "gray.600"}
                    borderBottom={tab.id === activeTab ? "2px solid" : "2px solid transparent"}
                    borderColor={tab.id === activeTab ? "blue.600" : "transparent"}
                    borderRadius="0"
                    fontWeight={tab.id === activeTab ? "semibold" : "normal"}
                    _hover={{ 
                      bg: tab.id === activeTab ? "transparent" : "gray.50" 
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </HStack>
            </Box>

            <Box bg="gray.50" px={headerPadding} py={6}>
              {isMobile && (
                <Box mb={6} p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Box>
                        <Box fontSize="sm" color="gray.600">Monthly Rent</Box>
                        <Box fontSize="lg" fontWeight="bold" color="blue.600">
                          {tract.avg_rent ? `$${tract.avg_rent.toLocaleString()}` : 'N/A'}
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Box fontSize="sm" color="gray.600">Business Fit</Box>
                        <Box fontSize="lg" fontWeight="bold" color={getScoreColor(resilienceScore)}>
                          {getScoreStatus(resilienceScore)}
                        </Box>
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              )}

              <QuickStats 
                tract={tract}
                weights={weights}
                rentText={tract.avg_rent ? `$${tract.avg_rent.toLocaleString()}` : 'N/A'}
              />
              
              <VStack spacing={6} mt={6}>
                <Box p={6} bg="white" borderRadius="lg" w="full" boxShadow="sm">
                  <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Location Summary
                  </Text>
                  <Text color="gray.600" mb={4}>
                    This area shows strong potential for business development with good foot traffic and accessible transportation.
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Scroll position: {Math.round(scrollY)}px | Compressed: {isScrolled ? 'Yes' : 'No'}
                  </Text>
                </Box>
                
                {Array.from({ length: 8 }, (_, i) => (
                  <Box key={i} p={6} bg="white" borderRadius="lg" w="full" boxShadow="sm">
                    <Text fontSize="lg" fontWeight="semibold" mb={2}>
                      Business Insight {i + 1}
                    </Text>
                    <Text color="gray.600">
                      Additional analysis and details about this location's business potential.
                    </Text>
                  </Box>
                ))}
              </VStack>

              <Box h="160px" />
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
            <Box h="160px" />
          </Box>
        );

      case 'demographics':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Demographics Analysis</Text>
            <AdvancedDemographics tract={tract} />
            <Box h="160px" />
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
            <Box h="160px" />
          </Box>
        );

      default:
        return null;
    }
  };
  
  return (
    <Box position="relative" h="100vh" w="100%" bg="white" overflow="hidden">
      <IconButton
        aria-label="Close details"
        icon={<CloseIcon />}
        size={isMobile ? "sm" : "md"}
        onClick={onClose}
        position="fixed"
        top="16px"
        right="16px"
        zIndex={150}
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

      <Box 
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex={90}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        px={headerPadding}
        py={5} // Increased padding for more height
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        transform={isScrolled ? "translateY(0)" : "translateY(-80px)"} // Adjusted to slide down properly
        transition="transform 0.3s ease-in-out"
        opacity={isScrolled ? 1 : 0}
        pointerEvents="none"
        w="100%"
        minH="80px" // Added minimum height
      >
        <Box maxW="none" w="full" pr="80px" pl="0" h="full" display="flex" alignItems="center">
          <HStack justify="center" spacing={4} align="center" w="full">
            <Text 
              fontSize="lg" 
              fontWeight="bold" 
              color="gray.800" 
              lineHeight="1.2"
              textAlign="center"
            >
              {tract.nta_name}
            </Text>
            
            <Box
              bg={resilienceScore >= 80 ? "green.500" : 
                  resilienceScore >= 60 ? "blue.500" : 
                  resilienceScore >= 40 ? "orange.500" : "red.500"}
              color="white"
              px={4} // Slightly larger padding
              py={2} // Slightly larger padding
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
              minW="60px"
              textAlign="center"
            >
              {resilienceScore}
            </Box>
          </HStack>
        </Box>
      </Box>

      {activeTab !== 'overview' && (
        <Box px={headerPadding} py={4} bg="white" borderBottom="1px solid" borderColor="gray.200">
          <HStack spacing={4} mb={4}>
            <IconButton
              aria-label="Back to overview"
              icon={<ArrowBackIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab('overview')}
            />
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {tract.nta_name}
            </Text>
          </HStack>
          
          <HStack spacing={0} w="full">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                flex="1"
                py={3}
                onClick={() => setActiveTab(tab.id)}
                color={tab.id === activeTab ? "blue.600" : "gray.600"}
                borderBottom={tab.id === activeTab ? "2px solid" : "2px solid transparent"}
                borderColor={tab.id === activeTab ? "blue.600" : "transparent"}
                borderRadius="0"
                fontWeight={tab.id === activeTab ? "semibold" : "normal"}
                _hover={{ 
                  bg: tab.id === activeTab ? "transparent" : "gray.50" 
                }}
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
        zIndex={60}
        pointerEvents="auto"
      >
        {isMobile ? (
          <VStack spacing={3}>
            <Button
              size="lg"
              bg="#FF492C"
              color="white"
              _hover={{ bg: "#E53E3E" }}
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
              View on Map
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
              bg="#FF492C"
              color="white"
              _hover={{ bg: "#E53E3E" }}
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
              View on Map
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