'use client';

import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import Map from '@/components/MapGroup/Map';
import MyDrawer from '@/components/MyDrawer';

interface SearchFilters {
  weights: any[];
  rentRange: [number, number];
  selectedEthnicities: string[];
}

export default function Page() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);

  const handleSearchSubmit = (filters: SearchFilters) => {
    console.log('[Search Submitted]', filters);
    setSearchFilters(filters);
  };

  return (
    <Box position="relative" height="100vh" width="100vw" overflow="hidden">
      {/* Always show the map */}
      <Map 
        weights={searchFilters?.weights}
        rentRange={searchFilters?.rentRange}
        selectedEthnicities={searchFilters?.selectedEthnicities}
      />
      <MyDrawer onSearchSubmit={handleSearchSubmit} />
    </Box>
  );
}
