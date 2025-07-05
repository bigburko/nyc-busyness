'use client';

import { Box } from '@chakra-ui/react';
import Map from '@/components/MapGroup/Map';
import MyDrawer from '@/components/MyDrawer';
import { useState } from 'react';

export default function Page() {
  const [searchFilters, setSearchFilters] = useState<null | {
    weights: any[];
    rentRange: [number, number];
    selectedEthnicities: string[];
  }>(null);

  const handleSearchSubmit = (filters: {
    weights: any[];
    rentRange: [number, number];
    selectedEthnicities: string[];
  }) => {
    console.log('[Search Submitted]', filters);
    setSearchFilters(filters);
  };

  return (
    <Box position="relative" height="100vh" width="100vw" overflow="hidden">
      <Map filters={searchFilters} />
      <MyDrawer onSearchSubmit={handleSearchSubmit} />
    </Box>
  );
}
