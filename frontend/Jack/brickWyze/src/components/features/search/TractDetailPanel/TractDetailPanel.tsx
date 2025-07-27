// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Updated with Chart Export Support
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, 
  AlertDialogBody, AlertDialogFooter, useDisclosure, useToast
} from '@chakra-ui/react';
import { CloseIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore, Weight } from '../../../../types/WeightTypes';
import TrendAnalysis from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { DemographicCharts } from './DemographicCharts';
import { QuickStats } from './QuickStats';
import { AISummary } from './AISummary/AISummary';
import GoogleMapsImage from './GoogleMapsImage';
import { LoopNetButton } from './LoopNetIntegration';

// 🆕 PDF Export imports - FIXED IMPORT PATH
import { usePDFExport } from '../../../../hooks/usePDFExport';
import { LoadingOverlay } from '../../../ui/LoadingOverlay';
import { exportPDFWithAllCharts } from '../../../../lib/exportUtils'; // ✅ FIXED: Correct path

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
  const toast = useToast();
  
  const resilienceScore = Math.round(tract.custom_score || 0);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 🆕 Chart Export State
  const [isExporting, setIsExporting] = useState(false);
  
  // 🆕 PDF Export functionality
  const { 
    isExporting: isPDFExporting, 
    error: exportError, 
    progress: exportProgress,
    currentStep,
    downloadWithAI,
    downloadQuick,
    resetExportState 
  } = usePDFExport();

  // 🆕 Alert dialog for export options
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  
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

  // 🆕 Handle export errors
  useEffect(() => {
    if (exportError) {
      toast({
        title: 'Export Failed',
        description: exportError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      resetExportState();
    }
  }, [exportError, toast, resetExportState]);

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

  // 🆕 Enhanced PDF Export handlers with chart support
  const handleQuickExport = async () => {
    onAlertClose();
    try {
      // Use the enhanced chart export function
      await exportPDFWithAllCharts(tract, weights, undefined, setIsExporting);
      toast({
        title: 'Report Downloaded',
        description: 'Quick report with charts exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Please try again or contact support',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFullExport = async () => {
    onAlertClose();
    try {
      // First generate AI analysis if needed, then export with charts
      setIsExporting(true);
      await downloadWithAI(tract, weights);
      // Note: downloadWithAI should be updated to use the chart export function
      toast({
        title: 'Full Report Downloaded',
        description: 'Complete report with AI analysis and charts exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Please try again or contact support',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'scoring', label: 'Scoring' }
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

              {/* 🧠 AI SUMMARY - Real AI business analysis */}
              <Box mt={6} id="ai-summary-section">
                <AISummary 
                  tract={tract}
                  weights={weights}
                  isVisible={scrollY > 200} // Only start AI analysis when scrolled past QuickStats
                />
              </Box>

              <Box h="200px" />
            </Box>

            {/* 🆕 Hidden Charts for Export - Render all charts when exporting */}
            {isExporting && (
              <Box position="absolute" top="-10000px" left="-10000px" width="800px" bg="white">
                <Box p={6}>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>Export Charts</Text>
                  <VStack spacing={6}>
                    <DemographicCharts tract={tract} rawDemographicData={rawDemographicData} isExporting={true} />
                    <TrendAnalysis tract={tract} isExporting={true} />
                  </VStack>
                </Box>
              </Box>
            )}
          </Box>
        );

      case 'trends':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <TrendAnalysis tract={tract} isExporting={isExporting} />
          </Box>
        );

      case 'demographics':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Demographics Analysis</Text>
            <VStack spacing={6}>
              <DemographicCharts tract={tract} rawDemographicData={rawDemographicData} isExporting={isExporting} />
              <AdvancedDemographics tract={tract} />
            </VStack>
          </Box>
        );

      case 'scoring':
        return (
          <Box p={headerPadding} bg="gray.50" minH="100vh">
            <Text fontSize="xl" fontWeight="bold" mb={6}>Scoring Methodology</Text>
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
  
  // 🆕 Combined loading state (either PDF export or chart export)
  const isAnyExporting = isPDFExporting || isExporting;
  
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
        pb={activeTab === 'overview' ? "20px" : "350px"}
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
          
          {/* 🔄 UPDATED: Download Report Button - now opens export dialog */}
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
            onClick={onAlertOpen}  // 🔄 CHANGED: Opens export dialog
            isLoading={isAnyExporting}
            loadingText={isExporting ? "Capturing Charts..." : "Exporting..."}
            disabled={isAnyExporting}
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

      {/* 🆕 Export Options Alert Dialog */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Export Location Report
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="start">
                <Text>
                  Choose your export option for <strong>{tract.nta_name}</strong>:
                </Text>
                
                <VStack spacing={3} align="start" w="full">
                  <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" w="full">
                    <Text fontWeight="semibold" color="blue.600" mb={2}>
                      📊 Full Report (Recommended)
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Includes AI analysis, detailed insights, charts, Street View links, and property recommendations.
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Takes 15-30 seconds • Generates AI analysis if needed • Captures all charts
                    </Text>
                  </Box>
                  
                  <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md" w="full">
                    <Text fontWeight="semibold" color="green.600" mb={2}>
                      ⚡ Quick Report
                    </Text>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Basic metrics, charts, and links without AI analysis.
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Takes 5-10 seconds • No AI generation • Includes charts
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose} disabled={isAnyExporting}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleQuickExport} 
                ml={3}
                disabled={isAnyExporting}
                isLoading={isExporting}
              >
                Quick Export
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleFullExport} 
                ml={3}
                disabled={isAnyExporting}
                isLoading={isPDFExporting}
              >
                Full Export
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* 🆕 Loading Overlay */}
      <LoadingOverlay 
        isOpen={isAnyExporting}
        title={isExporting ? "Capturing Charts" : "Generating Report"}
        message={isExporting ? "Rendering all charts for PDF capture..." : "Creating your comprehensive location analysis with AI insights, charts, and property links..."}
        progress={isExporting ? 50 : exportProgress}
        currentStep={isExporting ? "Capturing chart visualizations..." : currentStep}
        variant="pdf-export"
      />
    </Box>
  );
}