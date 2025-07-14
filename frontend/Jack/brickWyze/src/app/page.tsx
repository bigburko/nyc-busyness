'use client';

import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import dynamic from 'next/dynamic';

// ✅ Use your existing Map component
const Map = dynamic(() => import('@/components/features/Map/Map'), { 
  ssr: false 
});

const TopLeftUI = dynamic(() => import('@/components/features/search/TopLeftUI'), { 
  ssr: false 
});

// ✅ Define the filter interface your Map expects
interface Weighting {
  id: string;
  label: string;
  value: number;
}

interface MapFilters {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
}

export default function Page() {
  // ✅ State to hold current filters that get passed to Map
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});

  // ✅ This function gets called by TopLeftUI and updates Map props
  const handleFilterUpdate = (filters: any) => {
    console.log('🔄 [Page] Updating map filters:', filters);
    
    // Convert from filter store format to Map component format
    const mapFilters: MapFilters = {
      weights: filters.weights || [],
      rentRange: filters.rentRange || [26, 160],
      selectedEthnicities: filters.selectedEthnicities || [],
      selectedGenders: filters.selectedGenders || ['male', 'female'],
      ageRange: filters.ageRange || [0, 100],
      incomeRange: filters.incomeRange || [0, 250000],
    };

    setCurrentFilters(mapFilters);
  };

  return (
    <Box position="relative" height="100vh" width="100vw" overflow="hidden">
      {/* ✅ Map receives filter props and automatically updates */}
      <Map 
        weights={currentFilters.weights}
        rentRange={currentFilters.rentRange}
        selectedEthnicities={currentFilters.selectedEthnicities}
        selectedGenders={currentFilters.selectedGenders}
        ageRange={currentFilters.ageRange}
        incomeRange={currentFilters.incomeRange}
      />
      
      {/* ✅ TopLeftUI calls handleFilterUpdate */}
      <TopLeftUI onFilterUpdate={handleFilterUpdate} />
    </Box>
  );
}