'use client';

import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Weighting } from '@/components/ScoreWeightingGroup/WeightingPanel';

// ✅ Dynamically import map only (MyDrawer is now inside TopSearchBar)
const Map = dynamic(() => import('@/components/MapGroup/Map'), { ssr: false });
const TopSearchBar = dynamic(() => import('@/components/AiDrawerGroup/TopSearchBar'), { ssr: false });

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
      {/* Top floating search bar */}
      <TopSearchBar />

      {/* Map receives the current filters */}
      <Map
        weights={searchFilters?.weights}
        rentRange={searchFilters?.rentRange}
        selectedEthnicities={searchFilters?.selectedEthnicities}
        selectedGenders={searchFilters?.selectedGenders}
        ageRange={searchFilters?.ageRange}
        incomeRange={searchFilters?.incomeRange}
      />
    </Box>
  );
}
