'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
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
  [key: string]: unknown;
}

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

// ✅ FIXED: Proper interface for debug info instead of any
interface DebugInfo {
  received_ethnicities?: string[];
  received_genders?: string[];
  received_age_range?: [number, number];
  received_income_range?: [number, number];
  received_top_n?: number;
  received_crime_years?: string[];
  received_time_periods?: string[];
  received_demographic_scoring?: Record<string, unknown>;
  received_weights?: string[];
  demographic_weight_detected?: number;
  is_single_factor_request?: boolean;
  has_ethnicity_filters?: boolean;
  has_demographic_scoring?: boolean;
  [key: string]: unknown;
}

// ✅ FIXED: Add interface for the full edge function response
interface EdgeFunctionResponse {
  zones: MapSearchResult[];
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
  demographic_scoring_applied?: boolean;
  foot_traffic_periods_used?: string[];
  debug?: DebugInfo; // ✅ FIXED: Use proper interface instead of any
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

// ✅ FIXED: Proper error interface instead of any
interface SearchError {
  message?: string;
  status?: number;
  code?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    selectTractFromResultsPanel?: (tractId: string) => void;
    openResultsPanel?: () => void;
    _brickwyzeMapRef?: mapboxgl.Map;
  }
}

export default function Page() {
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});
  const [searchResults, setSearchResults] = useState<TractResult[]>([]);
  const [selectedTractId, setSelectedTractId] = useState<string | null>(null);
  const [selectedTract, setSelectedTract] = useState<TractResult | undefined>(undefined);
  
  // ✅ FIXED: Add state for full search response (for MyDrawer)
  const [fullSearchResponse, setFullSearchResponse] = useState<EdgeFunctionResponse | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const handleFilterUpdate = useCallback((filters: FilterUpdate) => {
    console.log('🔄 [Page] Updating map filters - topN:', filters.topN);
    
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

  // ✅ FIXED: Enhanced handleSearchResults to store full response
  const handleSearchResults = useCallback((results: MapSearchResult[], fullResponse?: EdgeFunctionResponse) => {
    console.log('📊 [Page] Received search results:', results.length, 'tracts');
    
    // Store the full edge function response for MyDrawer
    if (fullResponse) {
      console.log('📊 [Page] Storing full search response:', {
        zones_returned: fullResponse.zones?.length || 0,
        total_zones_found: fullResponse.total_zones_found || 0,
        top_percentage: fullResponse.top_percentage || 0
      });
      setFullSearchResponse(fullResponse);
    } else {
      // Fallback: create a response object from just the results
      setFullSearchResponse({
        zones: results,
        total_zones_found: results.length,
        top_zones_returned: results.length,
        top_percentage: currentFilters.topN || 10
      });
    }
    
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
  }, [currentFilters.topN]);

  // ✅ FIXED: Add search loading state handlers
  const handleSearchStart = useCallback(() => {
    console.log('🔄 [Page] Search started');
    setIsSearchLoading(true);
  }, []);

  const handleSearchComplete = useCallback(() => {
    console.log('✅ [Page] Search completed');
    setIsSearchLoading(false);
  }, []);

  // ✅ FIXED: Use proper error interface instead of any
  const handleSearchError = useCallback((error: SearchError) => {
    console.error('❌ [Page] Search error:', error);
    setIsSearchLoading(false);
    setFullSearchResponse(null);
  }, []);

  // 🔧 FIX: Simplified handleMapTractSelect (back to original)
  const handleMapTractSelect = useCallback((tractId: string | null) => {
    console.log('🗺️ [Page] Highlighting tract on map:', tractId);
    setSelectedTractId(tractId);
  }, []);

  // 🔧 FIX: Simplified useEffect with duplicate state update prevention
  useEffect(() => {
    console.log('🔧 [Page] Setting up global functions for map communication');
    
    window.selectTractFromResultsPanel = (tractIdParam: string) => {
      console.log('🗺️ [Page] Map clicked tract with score:', tractIdParam);
      
      const tractIdStr = String(tractIdParam);
      
      // 🔧 SIMPLE FIX: Don't update state if it's already the current tract
      if (selectedTractId === tractIdStr) {
        console.log('🚫 [Page] Tract already selected, skipping state update');
        return;
      }
      
      let tract = searchResults.find(t => String(t.geoid) === tractIdStr);
      
      if (!tract) {
        const paddedId = tractIdStr.padStart(11, '0');
        tract = searchResults.find(t => String(t.geoid) === paddedId);
      }
      
      if (!tract) {
        const trimmedId = tractIdStr.replace(/^0+/, '');
        tract = searchResults.find(t => String(t.geoid).replace(/^0+/, '') === trimmedId);
      }
      
      if (tract) {
        console.log('✅ [Page] Found tract in results, setting both ID and tract object:', tract.display_name || tract.tract_name);
        setSelectedTractId(tractIdStr);
        setSelectedTract(tract);
      } else {
        console.warn('⚠️ [Page] Tract not found in search results');
        setSelectedTract(undefined);
      }
    };
    
    window.openResultsPanel = () => {
      console.log('🔄 [Page] Opening results panel from map click');
      uiStore.setState({ viewState: 'results' });
    };
    
    return () => {
      console.log('🧹 [Page] Cleaning up global functions');
      delete window.selectTractFromResultsPanel;
      delete window.openResultsPanel;
    };
  }, [searchResults, selectedTractId]);

  // 🔧 FIX: Enhanced mapProps with search handlers
  const mapProps = useMemo(() => ({
    weights: currentFilters.weights || [],
    rentRange: currentFilters.rentRange || [26, 160] as [number, number],
    selectedEthnicities: currentFilters.selectedEthnicities || [],
    selectedGenders: currentFilters.selectedGenders || [],
    ageRange: currentFilters.ageRange || [0, 100] as [number, number],
    incomeRange: currentFilters.incomeRange || [0, 250000] as [number, number],
    topN: currentFilters.topN || 10,
    onSearchResults: handleSearchResults,
    onSearchStart: handleSearchStart,
    onSearchComplete: handleSearchComplete,
    onSearchError: handleSearchError,
    selectedTractId: selectedTractId,
  }), [
    currentFilters, 
    handleSearchResults, 
    handleSearchStart, 
    handleSearchComplete, 
    handleSearchError, 
    selectedTractId
  ]);

  // ✅ FIXED: Enhanced TopLeftUI props with search results for MyDrawer
  const topLeftUIProps = useMemo(() => ({
    onFilterUpdate: handleFilterUpdate,
    searchResults: searchResults,
    onMapTractSelect: handleMapTractSelect,
    selectedTract: selectedTract,
    // ✅ NEW: Pass full search response and loading state for MyDrawer
    fullSearchResponse: fullSearchResponse,
    isSearchLoading: isSearchLoading,
  }), [
    handleFilterUpdate,
    searchResults,
    handleMapTractSelect,
    selectedTract,
    fullSearchResponse,
    isSearchLoading
  ]);

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
          {/* ✅ FIXED: Pass enhanced props including search response for MyDrawer */}
          <TopLeftUI {...topLeftUIProps} />
        </div>
      </div>
    </main>
  );
}