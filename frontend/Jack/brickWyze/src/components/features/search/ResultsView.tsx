'use client';

import { Box, Flex, Heading, Text, VStack, IconButton } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useUiStore, uiStore } from '@/stores/uiStore';

export default function ResultsView() {
  const resultsData = useUiStore((s) => s.resultsData);

  const closeResultsPanel = () => {
    uiStore.getState().closeResultsPanel();
  };

  if (!resultsData) return null;

  const getPanelTitle = () => {
    if (Array.isArray(resultsData)) {
      return "Search Results";
    }
    return resultsData?.NAMELSAD || "Area Details";
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
          <Text>{resultsData.resilience_score?.toFixed(2) || 'N/A'}</Text>
        </Flex>
        <Flex justify="space-between">
          <Text fontWeight="bold">Population:</Text>
          <Text>{resultsData.total_population_2020?.toLocaleString() || 'N/A'}</Text>
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
