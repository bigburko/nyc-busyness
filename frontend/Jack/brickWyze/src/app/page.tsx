'use client';

import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Weighting } from '@/components/features/filters/ScoreWeightingGroup/WeightingPanel';

// ✅ Dynamically import components
const Map = dynamic(() => import('../components/features/Map/Map'), { ssr: false });
const TopSearchBar = dynamic(() => import('@/components/features/search/TopSearchBar'), { ssr: false });

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
    console.log('[Page.tsx] 🔎 Received filters:', filters);
    setSearchFilters(filters);
  };

  return (
    <Box position="relative" height="100vh" width="100vw" overflow="hidden">
      {/* Top floating search bar */}
      <TopSearchBar onSearchSubmit={handleSearchSubmit} />

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