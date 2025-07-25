// src/components/features/search/TractResultsContainer.tsx
'use client';

import { Box } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import TractResultsList from './TractResultsList';
import TractDetailPanel from './TractDetailPanel/TractDetailPanel';

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
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
}

interface TractResultsContainerProps {
  searchResults: TractResult[];
  onMapTractSelect?: (tractId: string | null) => void;
  selectedTract?: TractResult;
  onClearSelectedTract?: () => void;
}

declare global {
  interface Window {
    openTractDetailPanel?: (tract: TractResult) => void;
    closeTractDetailPanel?: () => void;
  }
}

// 🚀 NEW: Extract REAL demographic data from tract results
const extractRealDemographicData = (tract: TractResult) => {
  console.log('📊 [TractResultsContainer] Extracting REAL demographic data for tract:', tract.geoid);
  
  // Check if we have real demographic data (non-null and greater than 0)
  const hasRealData = (
    (tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null && tract.demographic_match_pct > 0) ||
    (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null && tract.gender_match_pct > 0) ||
    (tract.age_match_pct !== undefined && tract.age_match_pct !== null && tract.age_match_pct > 0) ||
    (tract.income_match_pct !== undefined && tract.income_match_pct !== null && tract.income_match_pct > 0)
  );

  if (!hasRealData) {
    console.log('⚠️ [TractResultsContainer] No real demographic data available for tract, using fallback');
    return null;
  }

  // Helper function to safely calculate percentages
  const safePercentage = (value: number | null | undefined): number => {
    if (value === null || value === undefined || isNaN(value)) return 0;
    return Math.max(0, Math.min(100, Number(value)));
  };

  // Transform real tract data into chart format
  const realDemographicData = {
    ethnicityData: (tract.demographic_match_pct !== undefined && tract.demographic_match_pct !== null && tract.demographic_match_pct > 0) ? [
      { 
        name: 'Target Demographics', 
        value: safePercentage(tract.demographic_match_pct), 
        color: '#10B981' 
      },
      { 
        name: 'Other Demographics', 
        value: safePercentage(100 - tract.demographic_match_pct), 
        color: '#E5E7EB' 
      }
    ] : null,

    demographicsData: [] as any[],

    incomeData: (tract.income_match_pct !== undefined && tract.income_match_pct !== null && tract.income_match_pct > 0) ? [
      { 
        name: 'Target Income Range', 
        value: safePercentage(tract.income_match_pct), 
        color: '#3B82F6' 
      },
      { 
        name: 'Other Income Levels', 
        value: safePercentage(100 - tract.income_match_pct), 
        color: '#E5E7EB' 
      }
    ] : null
  };

  // Combine age and gender data for demographics chart
  if ((tract.age_match_pct !== undefined && tract.age_match_pct !== null && tract.age_match_pct > 0) && 
      (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null && tract.gender_match_pct > 0)) {
    realDemographicData.demographicsData = [
      { 
        name: 'Target Age Range', 
        value: safePercentage(tract.age_match_pct), 
        color: '#8B5CF6' 
      },
      { 
        name: 'Target Gender', 
        value: safePercentage(tract.gender_match_pct), 
        color: '#F59E0B' 
      }
    ];
  } else if (tract.age_match_pct !== undefined && tract.age_match_pct !== null && tract.age_match_pct > 0) {
    realDemographicData.demographicsData = [
      { 
        name: 'Target Age Range', 
        value: safePercentage(tract.age_match_pct), 
        color: '#8B5CF6' 
      },
      { 
        name: 'Other Age Groups', 
        value: safePercentage(100 - tract.age_match_pct), 
        color: '#E5E7EB' 
      }
    ];
  } else if (tract.gender_match_pct !== undefined && tract.gender_match_pct !== null && tract.gender_match_pct > 0) {
    realDemographicData.demographicsData = [
      { 
        name: 'Target Gender', 
        value: safePercentage(tract.gender_match_pct), 
        color: '#F59E0B' 
      },
      { 
        name: 'Other Gender', 
        value: safePercentage(100 - tract.gender_match_pct), 
        color: '#E5E7EB' 
      }
    ];
  }

  console.log('✅ [TractResultsContainer] REAL demographic data extracted:', {
    hasEthnicity: !!realDemographicData.ethnicityData,
    hasDemographics: !!realDemographicData.demographicsData?.length,
    hasIncome: !!realDemographicData.incomeData,
    ethnicityMatch: tract.demographic_match_pct,
    ageMatch: tract.age_match_pct,
    genderMatch: tract.gender_match_pct,
    incomeMatch: tract.income_match_pct
  });

  return realDemographicData;
};

export default function TractResultsContainer({ 
  searchResults, 
  onMapTractSelect,
  selectedTract: mapSelectedTract,
  onClearSelectedTract
}: TractResultsContainerProps) {
  const [selectedTract, setSelectedTract] = useState<TractResult | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 🚀 FIXED: Real demographic data state (no sample data)
  const [demographicData, setDemographicData] = useState<{
    ethnicityData: any[] | null;
    demographicsData: any[] | null;
    incomeData: any[] | null;
  } | null>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🚀 FIXED: Extract REAL demographic data when tract is selected
  useEffect(() => {
    if (selectedTract) {
      console.log('📊 [TractResultsContainer] Processing tract:', selectedTract.geoid);
      
      // Extract real demographic data from the tract
      const realData = extractRealDemographicData(selectedTract);
      
      if (realData) {
        setDemographicData(realData);
        console.log('✅ [TractResultsContainer] Real demographic data set:', {
          hasEthnicity: !!realData.ethnicityData,
          hasDemographics: !!realData.demographicsData?.length,
          hasIncome: !!realData.incomeData
        });
      } else {
        console.log('⚠️ [TractResultsContainer] No demographic data available for this tract');
        setDemographicData(null);
      }
    }
  }, [selectedTract]);

  // Handle tract selection WITHOUT automatic centering
  const handleTractSelect = (tract: TractResult) => {
    console.log('📍 [TractResultsContainer] User selected tract from results:', tract.display_name);
    
    setSelectedTract(tract);
    // Clear previous demographic data to trigger fresh extraction
    setDemographicData(null);
    
    // Only notify parent for highlighting - NO automatic centering
    onMapTractSelect?.(tract.geoid);
  };

  // Effect to handle tract selection from map clicks
  useEffect(() => {
    if (mapSelectedTract) {
      console.log('🎯 [TractResultsContainer] Map selected tract:', mapSelectedTract.display_name || mapSelectedTract.tract_name);
      setSelectedTract(mapSelectedTract);
      // Clear previous demographic data to trigger fresh extraction
      setDemographicData(null);
    }
  }, [mapSelectedTract]);

  const handleCloseDetail = useCallback(() => {
    console.log('❌ [TractResultsContainer] Closing detail panel - clearing ALL tract states');
    
    // Clear local state
    setSelectedTract(null);
    setDemographicData(null);
    
    // Clear map highlight
    onMapTractSelect?.(null);
    
    // Clear parent's selectedTract state
    onClearSelectedTract?.();
  }, [onMapTractSelect, onClearSelectedTract]);

  // Global functions for legacy support
  useEffect(() => {
    window.openTractDetailPanel = (tract: TractResult) => {
      console.log('📋 [TractResultsContainer] Opening detail panel for tract:', tract.display_name);
      setSelectedTract(tract);
      setDemographicData(null); // Clear previous data
      onMapTractSelect?.(tract.geoid);
    };
    
    window.closeTractDetailPanel = () => {
      console.log('❌ [TractResultsContainer] Closing detail panel from map click');
      handleCloseDetail();
    };
    
    return () => {
      delete window.openTractDetailPanel;
      delete window.closeTractDetailPanel;
    };
  }, [onMapTractSelect, onClearSelectedTract, handleCloseDetail]);

  // Handle clicks on the results container to close chat input
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only close chat if clicking the container itself, not interactive elements
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('[role="button"]') || 
                         target.closest('[data-tract-card]') ||
                         target.closest('input');
    
    if (!isInteractive) {
      console.log('📋 [TractResultsContainer] Container clicked - closing chat input');
      if (window.resetToInitialView) {
        window.resetToInitialView();
      }
    }
  };

  if (!searchResults || searchResults.length === 0) {
    return (
      <Box p={4} onClick={handleContainerClick} cursor="pointer">
        <TractResultsList 
          searchResults={[]} 
          onTractSelect={handleTractSelect}
        />
      </Box>
    );
  }

  return (
    <>
      {/* Results list with click-to-close chat functionality */}
      <Box 
        h="100%" 
        w="100%"
        onClick={handleContainerClick}
        cursor="default"
      >
        <TractResultsList 
          searchResults={searchResults}
          onTractSelect={handleTractSelect}
          selectedTractId={selectedTract?.geoid}
        />
      </Box>

      {/* Detail panel - Google Maps style with increased gap */}
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
            rawDemographicData={demographicData || undefined} // 🚀 Pass real demographic data
          />
        </Box>
      )}

      {/* Mobile backdrop */}
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