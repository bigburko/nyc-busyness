// src/components/features/search/TractDetailPanel/TractDetailPanel.tsx - REFACTORED MAIN COMPONENT
'use client';

import { 
  Box, VStack, HStack, Button, IconButton, Flex
} from '@chakra-ui/react';
import { CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useFilterStore } from '../../../../stores/filterStore';
import { TractResult } from '../../../../types/TractTypes';
import { FilterStore } from '../../../../types/WeightTypes';
import { ScoreHeader } from './ScoreHeader';
import { TractInfo } from './TractInfo';
import { QuickStats } from './QuickStats';
import { TrendAnalysis } from './TrendAnalysis';
import { ScoreCalculation } from './ScoreCalculation';
import { AdvancedDemographics } from './AdvancedDemographics';

interface TractDetailPanelProps {
  tract: TractResult;
  onClose: () => void;
}

export default function TractDetailPanel({ tract, onClose }: TractDetailPanelProps) {
  const filterStore = useFilterStore() as FilterStore;
  const weights = filterStore.weights || [];
  
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
        {/* Resilience Score section */}
        <ScoreHeader score={resilienceScore} />

        {/* Tract info section */}
        <TractInfo 
          ntaName={tract.nta_name}
          tractNumber={tractNumber}
        />

        {/* Quick stats grid */}
        <QuickStats 
          tract={tract}
          rentText={rentText}
          weights={weights}
        />

        {/* Charts section */}
        <TrendAnalysis tract={tract} />

        {/* Smart Score Breakdown */}
        <ScoreCalculation 
          tract={tract}
          weights={weights}
          resilienceScore={resilienceScore}
        />

        {/* Advanced Demographic Analysis */}
        <AdvancedDemographics tract={tract} />
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