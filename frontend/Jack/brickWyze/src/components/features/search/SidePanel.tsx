// src/components/features/search/Sidepanel.tsx
'use client';

import { Box, Text, VStack } from '@chakra-ui/react';

// Example Result Item component
function ResultItem({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.200"
      _hover={{ bg: 'gray.50', cursor: 'pointer' }}
      transition="background-color 0.2s"
    >
      <Text fontWeight="bold" fontSize="md" noOfLines={1}>{title}</Text>
      <Text fontSize="sm" color="gray.600" noOfLines={1}>{subtitle}</Text>
    </Box>
  );
}

export default function Sidepanel() {
  return (
    // This VStack provides padding and spacing for the list items
    <VStack align="stretch" spacing={3} p={4}>
      <ResultItem title="Dr Crokes GAA Club" subtitle="Dr. Crokes GAA Grounds..." />
      <ResultItem title="Fig at Killarney Royal Townhouse" subtitle="College St, Killarney..." />
      <ResultItem title="Cronins Restaurant" subtitle="College St, Killarney..." />
      <ResultItem title="Murphys Bar, Restaurant & Townhouse" subtitle="18 College St, Killarney..." />
      {/* Search results would be mapped here */}
    </VStack>
  );
}