'use client';

import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import Map from '@/components/MapGroup/Map';
import MyDrawer from '@/components/MyDrawer';
// This assumes the Weighting type is exported from its file.
// If not, you'll need to add `export` to its definition.
import { Weighting } from '@/components/ScoreWeightingGroup/WeightingPanel';

// ✅ UPDATED: The interface now correctly expects an array of Weighting objects.
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
        // ✅ UPDATED: Passing down the full weights array. Ensure your Map component
        // knows how to handle Weighting[] or maps it to numbers if needed.
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
