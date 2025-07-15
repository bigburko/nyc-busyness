// src/components/features/search/TractResultsContainer.tsx
'use client';

import { Box } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import TractResultsList from './TractResultsList';
import TractDetailPanel from './TractDetailPanel';

interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
}

interface TractResultsContainerProps {
  searchResults: TractResult[];
  onMapTractSelect?: (tractId: string | null) => void;
  selectedTract?: TractResult;
}

declare global {
  interface Window {
    openTractDetailPanel?: (tract: TractResult) => void;
  }
}

export default function TractResultsContainer({ 
  searchResults, 
  onMapTractSelect,
  selectedTract: mapSelectedTract
}: TractResultsContainerProps) {
  const [selectedTract, setSelectedTract] = useState<TractResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ FIXED: Handle tract selection WITHOUT duplicate centering
  const handleTractSelect = (tract: TractResult) => {
    console.log('📍 [TractResultsContainer] User selected tract from results:', tract.display_name);
    
    setSelectedTract(tract);
    
    // ✅ ONLY notify parent - let the parent handle centering
    // This will trigger the centering in Map.tsx via selectedTractId prop
    onMapTractSelect?.(tract.geoid);
    
    // ✅ REMOVED: No more duplicate centering call here
    // The Map.tsx component will handle centering via the selectedTractId prop
  };

  // ✅ Effect to handle tract selection from map clicks
  useEffect(() => {
    if (mapSelectedTract) {
      console.log('🎯 [TractResultsContainer] Map selected tract:', mapSelectedTract.display_name || mapSelectedTract.tract_name);
      setSelectedTract(mapSelectedTract);
    }
  }, [mapSelectedTract]);

  // ✅ FIXED: Global function for legacy support WITHOUT centering
  useEffect(() => {
    window.openTractDetailPanel = (tract: TractResult) => {
      console.log('📋 [TractResultsContainer] Opening detail panel for tract:', tract.display_name);
      setSelectedTract(tract);
      onMapTractSelect?.(tract.geoid); // This will trigger centering via Map.tsx
    };
    
    return () => {
      delete window.openTractDetailPanel;
    };
  }, [onMapTractSelect]);

  const handleCloseDetail = () => {
    setSelectedTract(null);
    onMapTractSelect?.(null);
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <Box p={4}>
        <TractResultsList 
          searchResults={[]} 
          onTractSelect={handleTractSelect}
        />
      </Box>
    );
  }

  return (
    <>
      {/* ✅ Results list - always full width */}
      <Box h="100%" w="100%">
        <TractResultsList 
          searchResults={searchResults}
          onTractSelect={handleTractSelect}
          selectedTractId={selectedTract?.geoid}
        />
      </Box>

      {/* ✅ Detail panel - Google Maps style with increased gap */}
      {selectedTract && (
        <Box
          position="fixed"
          top="120px"
          left={isMobile ? "0" : "520px"}
          h="calc(100vh - 120px)"
          w={isMobile ? "100vw" : "400px"}
          bg="white"
          boxShadow="xl"
          zIndex={1201}
          transform="translateX(0)"
          transition="transform 0.3s ease"
          borderRadius="xl"
          overflow="hidden"
          border="1px solid"
          borderColor="gray.200"
        >
          <TractDetailPanel 
            tract={selectedTract}
            onClose={handleCloseDetail}
          />
        </Box>
      )}

      {/* ✅ Mobile backdrop */}
      {selectedTract && isMobile && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.300"
          zIndex={1200}
          onClick={handleCloseDetail}
        />
      )}
    </>
  );
}