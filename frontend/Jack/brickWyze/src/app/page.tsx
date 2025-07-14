'use client';

import { useState, useCallback, useMemo } from 'react';
import Map from '../components/features/Map/Map';
import TopLeftUI from '../components/features/search/TopLeftUI';

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
  topN?: number;
}

export default function Page() {
  // ✅ State to hold current filters that get passed to Map
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});

  // ✅ CLEAN: Simple filter update handler - no comparison logic
  const handleFilterUpdate = useCallback((filters: any) => {
    console.log('🔄 [Page] Updating map filters - topN:', filters.topN);
    
    // Convert from filter store format to Map component format
    const mapFilters: MapFilters = {
      weights: filters.weights || [],
      rentRange: filters.rentRange || [26, 160],
      selectedEthnicities: filters.selectedEthnicities || [],
      selectedGenders: filters.selectedGenders || ['male', 'female'],
      ageRange: filters.ageRange || [0, 100],
      incomeRange: filters.incomeRange || [0, 250000],
      topN: filters.topN || 10,
    };

    console.log('🔄 [Page] Setting current filters with topN:', mapFilters.topN);
    setCurrentFilters(mapFilters);
  }, []);

  // ✅ Memoize map props to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    weights: currentFilters.weights,
    rentRange: currentFilters.rentRange,
    selectedEthnicities: currentFilters.selectedEthnicities,
    selectedGenders: currentFilters.selectedGenders,
    ageRange: currentFilters.ageRange,
    incomeRange: currentFilters.incomeRange,
    topN: currentFilters.topN,
  }), [currentFilters]);

  return (
    <main style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        <Map {...mapProps} />
      </div>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 2, 
        pointerEvents: 'none' 
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <TopLeftUI onFilterUpdate={handleFilterUpdate} />
        </div>
      </div>
    </main>
  );
}