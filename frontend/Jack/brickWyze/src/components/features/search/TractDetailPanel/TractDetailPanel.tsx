// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - Updated with PDF Export
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, useBreakpointValue, Text,
  useToast, AlertDialog, AlertDialogOverlay, AlertDialogContent,
  AlertDialogHeader, AlertDialogBody, AlertDialogFooter, useDisclosure
} from '@chakra-ui/react';
import { CloseIcon, ArrowBackIcon, DownloadIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore, Weight } from '../../../../types/WeightTypes';
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { DemographicCharts } from './DemographicCharts';
import { QuickStats } from './QuickStats';
import { AISummary } from './AISummary/AISummary';
import GoogleMapsImage from './GoogleMapsImage';
import { LoopNetButton } from './LoopNetIntegration';

// Import PDF export functionality
import { usePDFExport } from '../../../../hooks/usePDFExport';
import { LoadingOverlay } from '../../../ui/LoadingOverlay';

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
  
  // PDF Export functionality
  const { 
    isExporting, 
    error: exportError, 
    progress: exportProgress,
    currentStep,
    downloadWithAI,
    downloadQuick,
    resetExportState 
  } = usePDFExport();

  // Toast for notifications
  const toast = useToast();
  
  // Alert dialog for export options
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

  // Handle export errors
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

  // PDF Export handlers
  const handleQuickExport = async () => {
    onAlertClose();
    try {
      await downloadQuick(tract, weights);
      toast({
        title: 'Report Downloaded',
        description: 'Quick report exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleFullExport = async () => {
    onAlertClose();
    try {
      await downloadWithAI(tract, weights);
      toast({
        title: 'Full Report Downloaded',
        description: 'Complete report with AI analysis exported successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

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

            {/* Quick Stats */}
            <QuickStats tract={tract} />

            {/* AI Summary Section */}
            <Box bg="white" borderTop="1px solid" borderColor="gray.200">
              <AISummary 
                tract={tract} 
                weights={weights}
                isVisible={activeTab === 'overview'}
              />
            </Box>
          </Box>
        );
        
      case 'trends':
        return (
          <Box bg="white" p={6}>
            <TrendAnalysis tract={tract} />
          </Box>
        );
        
      case 'demographics':
        return (
          <Box bg="white" p={6}>
            {rawDemographicData ? (
              <DemographicCharts demographicData={rawDemographicData} />
            ) : (
              <AdvancedDemographics tract={tract} />
            )}
          </Box>
        );
        
      case 'scoring':
        return (
          <Box bg="white" p={6}>
            <ScoreCalculation tract={tract} weights={weights} />
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box 
      position="fixed"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
      bg="white"
      zIndex={1000}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box 
        p={headerPadding} 
        bg="white" 
        borderBottom="1px solid" 
        borderColor="gray.200"
        position="sticky"
        top="0"
        zIndex={10}
        flexShrink={0}
      >
        <HStack justify="space-between" align="center">
          <IconButton
            aria-label="Close detail panel"
            icon={isMobile ? <ArrowBackIcon /> : <CloseIcon />}
            variant="ghost"
            size="lg"
            onClick={onClose}
          />
          
          <Text fontSize="lg" fontWeight="semibold" color="gray.800" textAlign="center" flex="1">
            {tract.nta_name} Detail
          </Text>
          
          <Box w="40px" /> {/* Spacer for balance */}
        </HStack>
      </Box>

      {/* Tab Navigation - Show only when not on overview or when scrolled */}
      {(activeTab !== 'overview' || isScrolled) && (
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
                bg={tab.id === activeTab ? "blue.50" : "transparent"}
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
        pb={activeTab === 'overview' ? "20px" : "350px"} // Less padding for overview, keeps space for buttons on other tabs
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
            onClick={onAlertOpen}
            isLoading={isExporting}
            loadingText="Generating..."
            leftIcon={<DownloadIcon />}
          >
            <Text fontSize="lg" fontWeight="600">
              {isExporting ? `${Math.round(exportProgress)}%` : 'Export Report'}
            </Text>
          </Button>
        </HStack>
      </Box>

      {/* Export Options Alert Dialog */}
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
                      Takes 15-30 seconds • Generates AI analysis if needed
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
                      Takes 5-10 seconds • No AI generation
                    </Text>
                  </Box>
                </VStack>
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={handleQuickExport} ml={3}>
                Quick Export
              </Button>
              <Button colorScheme="blue" onClick={handleFullExport} ml={3}>
                Full Export
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isOpen={isExporting}
        title="Generating Report"
        message="Creating your comprehensive location analysis with AI insights, charts, and property links..."
        progress={exportProgress}
        currentStep={Math.floor(exportProgress / 20)}
      />
    </Box>
  );
}