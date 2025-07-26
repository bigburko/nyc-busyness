// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Updated with AI Summary Integration
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text, Badge, Flex
} from '@chakra-ui/react';
import { CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore, Weight } from '../../../../types/WeightTypes';
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { DemographicCharts } from './DemographicCharts';
import { QuickStats } from './QuickStats';
import { AISummary } from './AISummary/AISummary'; // 🧠 NEW: Import AI Summary
import GoogleMapsImage from './GoogleMapsImage';
import { LoopNetButton } from './LoopNetIntegration';

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

export default function TractDetailPanel({ 
  tract, 
  onClose, 
  rawDemographicData 
}: TractDetailPanelProps) {
  const filterStore = useFilterStore() as FilterStore;
  const weights = (filterStore.weights || []) as Weight[];
  
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
    console.log('🧠 [TractDetailPanel] AI Summary will generate for this tract');
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
                <VStack align="start" spacing={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800" lineHeight="1.2">
                      {tract.nta_name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Census Tract {tract.geoid.slice(-6)}
                    </Text>
                  </VStack>
                  
                  {/* Resilience Score Badge */}
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
                    alignSelf="start"
                  >
                    {resilienceScore}
                  </Box>
                </VStack>
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
              {/* QuickStats - Modern metrics display with rent positioning */}
              <Box id="quickstats-section">
                <QuickStats 
                  tract={tract}
                  rentText={tract.avg_rent ? tract.avg_rent.toLocaleString() : 'N/A'}
                  weights={weights}
                  rentRange={[26, 160]} // Default rent range - QuickStats component should handle this
                />
              </Box>

              {/* 🧠 AI SUMMARY - NEW: Real AI business analysis */}
              <Box mt={6} id="ai-summary-section">
                <AISummary 
                  tract={tract}
                  weights={weights}
                  isVisible={scrollY > 200} // Only start AI analysis when scrolled past QuickStats
                />
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

      {/* Action Buttons - Properties and Report Download */}
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
          {/* Properties Search Button */}
          <LoopNetButton tract={tract} flex="1" />
          
          {/* Download Report Button */}
          <Button 
            size="lg" 
            bg="linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(74, 222, 128, 0.9) 100%)"
            color="white"
            _hover={{ 
              bg: "linear-gradient(135deg, rgba(34, 197, 94, 1) 0%, rgba(74, 222, 128, 1) 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 40px rgba(34, 197, 94, 0.4)"
            }}
            _active={{ transform: "translateY(0)" }}
            flex="1" 
            borderRadius="2xl"
            fontWeight="600"
            h="56px"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.3)"
            boxShadow="0 8px 32px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.3)"
            transition="all 0.3s ease"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <Text fontSize="lg" fontWeight="600">Report</Text>
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}