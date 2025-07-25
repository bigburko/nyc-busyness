// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - COMPLETE REDESIGNED LAYOUT
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, Flex, Collapse, useDisclosure
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore } from '../../../../types/WeightTypes';
import { ScoreHeader } from './ScoreHeader';
import { TractInfo } from './TractInfo';
import { KeyMetricPills } from './KeyMetricPills';
import { DemographicCharts } from './DemographicCharts';
import { SmartInsights } from './SmartInsights';
import { TrendIndicators } from './TrendIndicators';
import { TrendAnalysis } from './TrendAnalysis';
import { ScoreCalculation } from './ScoreCalculation';
import { AdvancedDemographics } from './AdvancedDemographics';

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
  rawDemographicData?: {
    ethnicityData: any[] | null;
    demographicsData: any[] | null;
    incomeData: any[] | null;
  };
}

export default function TractDetailPanel({ tract, onClose, rawDemographicData }: TractDetailPanelProps) {
  const filterStore = useFilterStore() as FilterStore;
  const weights = filterStore.weights || [];
  const { isOpen: isDeepDiveOpen, onToggle: toggleDeepDive } = useDisclosure();
  
  const resilienceScore = Math.round(tract.custom_score || 0);
  const rentText = tract.avg_rent ? `${tract.avg_rent.toFixed(2)}` : 'N/A';
  const tractNumber = tract.geoid;
  
  return (
    <Flex direction="column" h="100%" bg="white" position="relative">
      {/* Fixed floating X button */}
      <Box position="absolute" top="16px" right="16px" zIndex={30}>
        <IconButton
          aria-label="Close details"
          icon={<CloseIcon />}
          size="md"
          onClick={onClose}
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
      </Box>

      {/* Main scrollable content */}
      <Box flex="1" overflowY="auto">
        {/* 1. HERO SECTION */}
        <VStack spacing={0}>
          {/* Resilience Score - Large and prominent */}
          <ScoreHeader score={resilienceScore} />
          
          {/* Location Info - Clean and simple */}
          <TractInfo 
            ntaName={tract.nta_name}
            tractNumber={tractNumber}
          />
        </VStack>

        {/* 2. KEY METRICS PILLS - Enhanced visual pills */}
        <KeyMetricPills 
          tract={tract}
          rentText={rentText}
          weights={weights}
        />

        {/* 3. VISUAL DEMOGRAPHICS DASHBOARD - New demographic charts */}
        <DemographicCharts 
          tract={tract} 
          rawDemographicData={rawDemographicData}
        />

        {/* 4. SMART INSIGHTS - Simplified demographics analysis */}
        <SmartInsights tract={tract} />

        {/* 5. TRENDS AT A GLANCE - Mini sparklines */}
        <TrendIndicators tract={tract} />

        {/* 6. COLLAPSIBLE DEEP DIVE SECTION */}
        <Box p={6} bg="gray.50" borderTop="2px solid" borderColor="gray.200">
          <VStack spacing={4}>
            <Button
              onClick={toggleDeepDive}
              variant="outline"
              size="lg"
              rightIcon={isDeepDiveOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              w="full"
              borderColor="gray.300"
              _hover={{ bg: "white", borderColor: "gray.400" }}
              h="56px"
              borderRadius="xl"
              fontSize="md"
              fontWeight="bold"
            >
              {isDeepDiveOpen ? "Hide" : "Show"} Detailed Analysis & Charts
            </Button>
            
            <Collapse in={isDeepDiveOpen} animateOpacity style={{ width: '100%' }}>
              <VStack spacing={6} pt={4}>
                {/* Full detailed charts */}
                <Box w="full" bg="white" borderRadius="lg" p={1}>
                  <TrendAnalysis tract={tract} />
                </Box>

                {/* Smart Score Breakdown */}
                <Box w="full" bg="white" borderRadius="lg" p={1}>
                  <ScoreCalculation 
                    tract={tract}
                    weights={weights}
                    resilienceScore={resilienceScore}
                  />
                </Box>

                {/* Full Advanced Demographic Analysis */}
                <Box w="full" bg="white" borderRadius="lg" p={1}>
                  <AdvancedDemographics tract={tract} />
                </Box>
              </VStack>
            </Collapse>
          </VStack>
        </Box>
      </Box>

      {/* Action buttons - Fixed at bottom */}
      <Box p={4} bg="white" borderTop="1px solid" borderColor="gray.200">
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
      </Box>
    </Flex>
  );
}