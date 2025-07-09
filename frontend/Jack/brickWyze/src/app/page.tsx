'use client';

import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import Map from '@/components/MapGroup/Map';
import MyDrawer from '@/components/MyDrawer';
import { Weighting } from '@/components/ScoreWeightingGroup/WeightingPanel';

interface SearchFilters {
  weights: Weighting[];
  rentRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  ageRange: [number, number];
  incomeRange: [number, number];
}

export default function Page() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);

  const handleSearchSubmit = (filters: SearchFilters) => {
    console.log('[Search Submitted]', filters);
    setSearchFilters(filters);
  };

  return (
    <Box position="relative" height="100vh" width="100vw" overflow="hidden">
      <Map
        weights={searchFilters?.weights}
        rentRange={searchFilters?.rentRange}
        selectedEthnicities={searchFilters?.selectedEthnicities}
        selectedGenders={searchFilters?.selectedGenders}
        ageRange={searchFilters?.ageRange}
        incomeRange={searchFilters?.incomeRange}
      />
      <MyDrawer onSearchSubmit={handleSearchSubmit} />
    </Box>
  );
}
