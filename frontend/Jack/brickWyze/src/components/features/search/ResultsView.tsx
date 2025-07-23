'use client';

import { Box, Flex, Heading, Text, VStack, IconButton } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useUiStore, uiStore } from '@/stores/uiStore';

// Define proper types for resultsData
interface AreaResult {
  NAMELSAD?: string;
  resilience_score?: number;
  total_population_2020?: number;
  [key: string]: string | number | undefined;
}

interface SearchResultItem {
  title?: string;
  [key: string]: string | number | undefined;
}

export default function ResultsView() {
  const resultsData = useUiStore((s) => s.resultsData) as AreaResult | SearchResultItem[] | null;

  const closeResultsPanel = () => {
    uiStore.getState().closeResultsPanel();
  };

  if (!resultsData) return null;

  const getPanelTitle = () => {
    if (Array.isArray(resultsData)) {
      return "Search Results";
    }
    // Check if resultsData is an empty object or has properties
    if (resultsData && typeof resultsData === 'object' && Object.keys(resultsData).length > 0) {
      return resultsData.NAMELSAD || "Area Details";
    }
    return "Area Details";
  };

  const renderContent = () => {
    if (Array.isArray(resultsData)) {
      return (
        <VStack spacing={0} align="stretch" flex="1" overflowY="auto">
          {resultsData.map((item, index) => (
            <Box
              key={index}
              p={4}
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
              borderTop={index === 0 ? 'none' : '1px solid'}
              borderColor="gray.100"
            >
              <Text fontWeight="medium">{item.title || 'Unnamed Area'}</Text>
              <Text fontSize="sm" color="gray.600">Additional info placeholder...</Text>
            </Box>
          ))}
        </VStack>
      );
    }

    // Handle non-array resultsData
    const data = resultsData as AreaResult;
    
    return (
      <VStack spacing={3} align="stretch" p={4} flex="1" overflowY="auto">
        <Flex align="center" gap={2}>
          <IconButton
            aria-label="Back to results"
            icon={<ArrowBackIcon />}
            variant="ghost"
            isRound
            onClick={closeResultsPanel}
          />
          <Heading size="md">{getPanelTitle()}</Heading>
        </Flex>
        <Flex justify="space-between">
          <Text fontWeight="bold">Resilience Score:</Text>
          <Text>
            {/* ✅ FIXED: Handle both 0-1 and 0-100 scales */}
            {data.resilience_score ? (
              data.resilience_score > 1 
                ? Math.round(data.resilience_score) 
                : Math.round(data.resilience_score * 100)
            ) : 'N/A'}
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text fontWeight="bold">Population:</Text>
          <Text>{data.total_population_2020?.toLocaleString() || 'N/A'}</Text>
        </Flex>
      </VStack>
    );
  };

  return (
    <Flex direction="column" h="100%">
      {renderContent()}
    </Flex>
  );
}