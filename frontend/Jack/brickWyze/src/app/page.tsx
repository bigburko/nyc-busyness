'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Map from '../components/features/Map/Map';
import TopLeftUI from '../components/features/search/TopLeftUI';
import { uiStore } from '@/stores/uiStore';

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

// ✅ Type definitions for search results and tract data - FIXED to match TopLeftUI
interface TractResult {
  geoid: string;
  tract_name: string; // ✅ FIXED: Required, not optional
  display_name: string; // ✅ FIXED: Required, not optional
  nta_name: string; // ✅ FIXED: Required, not optional
  custom_score: number;
  resilience_score: number; // ✅ FIXED: Required, not optional
  avg_rent: number; // ✅ FIXED: Required, not optional
  demographic_score: number; // ✅ FIXED: Required, not optional
  foot_traffic_score: number; // ✅ FIXED: Required, not optional
  crime_score: number; // ✅ FIXED: Required, not optional
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
  [key: string]: unknown;
}

// ✅ Type for results from Map component (ResilienceScore)
interface MapSearchResult {
  geoid: string;
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  custom_score: number;
  resilience_score?: number;
  avg_rent?: number;
  demographic_score?: number;
  foot_traffic_score?: number;
  crime_score?: number;
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
  [key: string]: unknown;
}

interface FilterUpdate {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number;
}

// ✅ Global window interface for type safety
declare global {
  interface Window {
    selectTractFromResultsPanel?: (tractId: string) => void;
    openResultsPanel?: () => void;
  }
}

export default function Page() {
  // ✅ State to hold current filters that get passed to Map
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});
  const [searchResults, setSearchResults] = useState<TractResult[]>([]); // ✅ FIXED: Proper type
  const [selectedTractId, setSelectedTractId] = useState<string | null>(null); // ✅ NEW: Track selected tract
  const [selectedTract, setSelectedTract] = useState<TractResult | undefined>(undefined); // ✅ FIXED: Use undefined instead of null

  // ✅ CLEAN: Simple filter update handler - no comparison logic
  const handleFilterUpdate = useCallback((filters: FilterUpdate) => { // ✅ FIXED: Proper type
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

  // ✅ NEW: Handle search results from Map
  const handleSearchResults = useCallback((results: MapSearchResult[]) => { // ✅ FIXED: Use proper type instead of any
    console.log('📊 [Page] Received search results:', results.length, 'tracts');
    
    // ✅ Transform MapSearchResult[] to TractResult[] with default values for required fields
    const transformedResults: TractResult[] = results.map(r => ({
      geoid: r.geoid || '',
      tract_name: r.tract_name || `Tract ${r.geoid || ''}`,
      display_name: r.display_name || r.tract_name || `Tract ${r.geoid || ''}`,
      nta_name: r.nta_name || 'Unknown Neighborhood',
      custom_score: r.custom_score || 0,
      resilience_score: r.resilience_score || r.custom_score || 0,
      avg_rent: r.avg_rent || 0,
      demographic_score: r.demographic_score || 0,
      foot_traffic_score: r.foot_traffic_score || 0,
      crime_score: r.crime_score || 0,
      flood_risk_score: r.flood_risk_score,
      rent_score: r.rent_score,
      poi_score: r.poi_score,
      main_crime_score: r.main_crime_score,
      crime_trend_direction: r.crime_trend_direction,
      crime_trend_change: r.crime_trend_change,
      demographic_match_pct: r.demographic_match_pct,
      gender_match_pct: r.gender_match_pct,
      age_match_pct: r.age_match_pct,
      income_match_pct: r.income_match_pct,
      crime_timeline: r.crime_timeline
    }));
    
    setSearchResults(transformedResults);
  }, []);

  // ✅ NEW: Handle tract selection from results panel
  const handleMapTractSelect = useCallback((tractId: string | null) => {
    console.log('🗺️ [Page] Highlighting tract on map:', tractId);
    setSelectedTractId(tractId);
    
    // ✅ Optional: You can add map highlighting logic here
    // For example, calling a map method to highlight the selected tract
  }, []);

  // ✅ NEW: Set up global functions for map communication (moved from TopLeftUI)
  useEffect(() => {
    console.log('🔧 [Page] Setting up global functions for map communication');
    
    window.selectTractFromResultsPanel = (tractIdParam: string) => { // ✅ FIXED: Proper window typing
      console.log('🗺️ [Page] Map clicked tract with score:', tractIdParam);
      
      // ✅ Convert to string first in case it's a number
      const tractIdStr = String(tractIdParam);
      
      // ✅ First, let's debug what's in our search results
      console.log('🔍 [Page] Current search results count:', searchResults.length);
      console.log('🔍 [Page] Sample tract IDs:', searchResults.slice(0, 3).map(t => t.geoid));
      console.log('🔍 [Page] Looking for tract ID (as string):', tractIdStr);
      
      // ✅ Try different ways to find the tract (in case of ID format differences)
      let tract = searchResults.find(t => String(t.geoid) === tractIdStr);
      
      if (!tract) {
        // Try with padded zeros
        const paddedId = tractIdStr.padStart(11, '0');
        tract = searchResults.find(t => String(t.geoid) === paddedId);
        console.log('🔍 [Page] Trying padded ID:', paddedId);
      }
      
      if (!tract) {
        // Try without padding (remove leading zeros from both)
        const trimmedId = tractIdStr.replace(/^0+/, '');
        tract = searchResults.find(t => String(t.geoid).replace(/^0+/, '') === trimmedId);
        console.log('🔍 [Page] Trying trimmed ID:', trimmedId);
      }
      
      if (tract) {
        console.log('✅ [Page] Found tract in results, setting both ID and tract object:', tract.display_name || tract.tract_name);
        setSelectedTractId(tractIdStr);
        setSelectedTract(tract); // ✅ NEW: Store the actual tract object directly
      } else {
        console.warn('⚠️ [Page] Tract still not found in search results. Available tract IDs:');
        console.warn(searchResults.map(t => String(t.geoid)).slice(0, 10)); // Show first 10 for debugging
        setSelectedTract(undefined); // ✅ FIXED: Reset to undefined if not found
      }
    };
    
    window.openResultsPanel = () => { // ✅ FIXED: Proper window typing
      console.log('🔄 [Page] Opening results panel from map click');
      uiStore.setState({ viewState: 'results' });
    };
    
    return () => {
      console.log('🧹 [Page] Cleaning up global functions');
      delete window.selectTractFromResultsPanel;
      delete window.openResultsPanel;
    };
  }, [searchResults]); // ✅ Include searchResults to update the function when results change

  // ✅ Memoize map props to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    weights: currentFilters.weights,
    rentRange: currentFilters.rentRange,
    selectedEthnicities: currentFilters.selectedEthnicities,
    selectedGenders: currentFilters.selectedGenders,
    ageRange: currentFilters.ageRange,
    incomeRange: currentFilters.incomeRange,
    topN: currentFilters.topN,
    onSearchResults: handleSearchResults, // ✅ NEW: Pass callback to Map
    selectedTractId: selectedTractId, // ✅ NEW: Pass selected tract to Map
  }), [currentFilters, handleSearchResults, selectedTractId]);

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
          <TopLeftUI 
            onFilterUpdate={handleFilterUpdate}
            searchResults={searchResults} // ✅ NEW: Pass search results
            onMapTractSelect={handleMapTractSelect} // ✅ NEW: Pass tract selection handler
            selectedTract={selectedTract} // ✅ FIXED: Now properly typed as TractResult | undefined
          />
        </div>
      </div>
    </main>
  );
}