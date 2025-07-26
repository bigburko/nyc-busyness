// src/components/features/search/TractDetailPanel/TabbedInterface.tsx - Restored Original Layout
'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Flex,
  Text, 
  VStack,
  Badge,
} from '@chakra-ui/react';
import { TractResult } from '../../../../types/TractTypes';
import { Weight } from '../../../../types/WeightTypes';

// Import existing components
import { TrendAnalysis } from './TrendAnalysis';
import { AdvancedDemographics } from './AdvancedDemographics';
import { ScoreCalculation } from './ScoreCalculation';
import { SmartInsights } from './SmartInsights';
import { DemographicCharts } from './DemographicCharts';
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

interface TabbedInterfaceProps {
  tract: TractResult;
  weights: Weight[];
  rawDemographicData?: RawDemographicData;
}

// Helper function to get quick insights
const getQuickInsights = (tract: TractResult): string => {
  const score = tract.custom_score || 0;
  const rent = tract.avg_rent;
  
  if (score >= 80) {
    return `Excellent location with strong fundamentals. ${rent ? `Rent at $${rent.toLocaleString()} is competitive for this quality area.` : ''} Ideal for premium businesses.`;
  } else if (score >= 60) {
    return `Good business opportunity with solid metrics. ${rent ? `Monthly rent of $${rent.toLocaleString()} offers good value.` : ''} Suitable for most business types.`;
  } else if (score >= 40) {
    return `Fair location with mixed indicators. ${rent ? `Consider rent costs ($${rent.toLocaleString()}/month) vs potential returns.` : ''} May work for specific business models.`;
  } else {
    return `Lower scoring area with challenges. ${rent ? `Despite lower rent ($${rent.toLocaleString()}/month),` : ''} Careful analysis recommended before committing.`;
  }
};

// Key Metric Pills Component
const KeyMetricPills = ({ 
  tract, 
  rentText
}: { 
  tract: TractResult; 
  rentText: string;
}) => {
  return (
    <VStack spacing={3} align="stretch">
      <Text fontSize="md" fontWeight="semibold" color="gray.700">
        Key Metrics
      </Text>
      
      <Flex wrap="wrap" gap={3}>
        {/* Resilience Score */}
        <Box 
          bg={tract.custom_score && tract.custom_score >= 70 ? 'green.50' : 
              tract.custom_score && tract.custom_score >= 50 ? 'yellow.50' : 'red.50'}
          border="1px solid"
          borderColor={tract.custom_score && tract.custom_score >= 70 ? 'green.200' : 
                      tract.custom_score && tract.custom_score >= 50 ? 'yellow.200' : 'red.200'}
          borderRadius="lg"
          p={3}
          minW="120px"
        >
          <Text fontSize="xs" color="gray.600" mb={1}>Overall Score</Text>
          <Text fontSize="xl" fontWeight="bold" 
                color={tract.custom_score && tract.custom_score >= 70 ? 'green.700' : 
                      tract.custom_score && tract.custom_score >= 50 ? 'yellow.700' : 'red.700'}>
            {Math.round(tract.custom_score || 0)}
          </Text>
        </Box>

        {/* Rent */}
        <Box 
          bg="blue.50"
          border="1px solid"
          borderColor="blue.200"
          borderRadius="lg"
          p={3}
          minW="120px"
        >
          <Text fontSize="xs" color="gray.600" mb={1}>Avg Rent</Text>
          <Text fontSize="xl" fontWeight="bold" color="blue.700">
            ${rentText}
          </Text>
        </Box>

        {/* Foot Traffic */}
        {tract.foot_traffic_score && (
          <Box 
            bg="purple.50"
            border="1px solid"
            borderColor="purple.200"
            borderRadius="lg"
            p={3}
            minW="120px"
          >
            <Text fontSize="xs" color="gray.600" mb={1}>Foot Traffic</Text>
            <Text fontSize="xl" fontWeight="bold" color="purple.700">
              {Math.round(tract.foot_traffic_score)}
            </Text>
          </Box>
        )}

        {/* Safety */}
        {tract.crime_score && (
          <Box 
            bg="green.50"
            border="1px solid"
            borderColor="green.200"
            borderRadius="lg"
            p={3}
            minW="120px"
          >
            <Text fontSize="xs" color="gray.600" mb={1}>Safety</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.700">
              {Math.round(tract.crime_score)}
            </Text>
          </Box>
        )}
      </Flex>
    </VStack>
  );
};

export default function TabbedInterface({ 
  tract, 
  weights, 
  rawDemographicData 
}: TabbedInterfaceProps) {
  const [activeTab, setActiveTab] = useState(0);
  const resilienceScore = Math.round(tract.custom_score || 0);
  const rentText = tract.avg_rent ? `${tract.avg_rent.toFixed(2)}` : 'N/A';

  const tabs = [
    { id: 0, label: 'Overview' },
    { id: 1, label: 'Trends' },
    { id: 2, label: 'Demographics' },
    { id: 3, label: 'Scoring' }
  ];

  return (
    <Box w="full">
      {/* Custom Tab Navigation - Clean Google Maps style */}
      <Box
        w="calc(100% + 48px)"
        ml="-24px"
        mb={6}
        bg="white"
        position="relative"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Flex w="full">
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              as="button"
              onClick={() => setActiveTab(tab.id)}
              flex="1"
              py={4}
              px={2}
              bg="transparent"
              color={activeTab === tab.id ? 'blue.600' : 'gray.600'}
              fontWeight={activeTab === tab.id ? 'semibold' : 'medium'}
              fontSize="md"
              position="relative"
              cursor="pointer"
              transition="all 0.2s ease"
              minH="48px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="none"
              _hover={{ 
                color: activeTab === tab.id ? 'blue.600' : 'gray.800'
              }}
              _focus={{
                outline: 'none',
                boxShadow: 'none'
              }}
            >
              {tab.label}
              {/* Clean underline indicator - Google Maps style */}
              {activeTab === tab.id && (
                <Box
                  position="absolute"
                  bottom="0"
                  left="50%"
                  transform="translateX(-50%)"
                  width="80%"
                  height="2px"
                  bg="blue.500"
                  borderRadius="1px"
                />
              )}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Tab Content - Contained width for readability */}
      <Box maxW="1200px" mx="auto" px={6}>
        {/* 📊 OVERVIEW TAB - For Casual Users */}
        {activeTab === 0 && (
          <VStack spacing={8} align="stretch" w="full">
            {/* Header */}
            <Box>
              <Flex align="center" gap={2} mb={2}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Quick Business Overview
                </Text>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                Essential metrics for quick decision making
              </Text>
            </Box>
            
            {/* Key Metrics - Full width */}
            <KeyMetricPills 
              tract={tract} 
              rentText={rentText}
            />

            {/* Quick Insights */}
            <Box 
              p={4} 
              bg="blue.50" 
              borderRadius="lg" 
              border="1px solid" 
              borderColor="blue.200"
            >
              <Flex align="center" gap={2} mb={3}>
                <Text fontSize="sm" fontWeight="bold" color="blue.800">
                  Key Insights
                </Text>
              </Flex>
              <Text fontSize="sm" color="blue.700" lineHeight="1.5">
                {getQuickInsights(tract)}
              </Text>
            </Box>

            {/* Quick Recommendations */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                Quick Recommendations
              </Text>
              
              <Flex wrap="wrap" gap={2}>
                {tract.foot_traffic_score && tract.foot_traffic_score > 70 && (
                  <Badge colorScheme="green" p={2} borderRadius="md">
                    High foot traffic area
                  </Badge>
                )}
                
                {tract.crime_score && tract.crime_score > 70 && (
                  <Badge colorScheme="green" p={2} borderRadius="md">
                    Safe neighborhood
                  </Badge>
                )}
                
                {tract.avg_rent && tract.avg_rent < 2500 && (
                  <Badge colorScheme="blue" p={2} borderRadius="md">
                    Affordable rent
                  </Badge>
                )}
                
                {resilienceScore >= 80 && (
                  <Badge colorScheme="purple" p={2} borderRadius="md">
                    Premium location
                  </Badge>
                )}
              </Flex>
            </VStack>

            {/* Street View */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                📍 Street View
              </Text>
              <GoogleMapsImage tract={tract} />
            </VStack>

            {/* LoopNet Integration */}
            <VStack spacing={3} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                🏢 Properties
              </Text>
              <LoopNetButton tract={tract} />
            </VStack>
          </VStack>
        )}

        {/* 📈 TRENDS TAB - Clean and Focused */}
        {activeTab === 1 && (
          <TrendAnalysis tract={tract} />
        )}

        {/* 👥 DEMOGRAPHICS TAB - For Market Researchers */}
        {activeTab === 2 && (
          <VStack spacing={8} align="stretch" w="full">
            <Box>
              <Flex align="center" gap={2} mb={2}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Demographic Analysis
                </Text>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                Deep dive into population characteristics and market fit
              </Text>
            </Box>

            {/* All demographic content - Contained width */}
            <DemographicCharts 
              tract={tract} 
              rawDemographicData={rawDemographicData}
            />

            <SmartInsights tract={tract} />
            
            <AdvancedDemographics tract={tract} />
          </VStack>
        )}

        {/* 🔍 SCORING TAB - For Power Users */}
        {activeTab === 3 && (
          <VStack spacing={6} align="stretch" w="full">
            <Box>
              <Flex align="center" gap={2} mb={2}>
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  Scoring Methodology
                </Text>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                Complete methodology breakdown and score calculations
              </Text>
            </Box>
            
            {/* Score calculation - Contained width */}
            <ScoreCalculation 
              tract={tract}
              weights={weights}
              resilienceScore={resilienceScore}
            />
          </VStack>
        )}
      </Box>
    </Box>
  );
}