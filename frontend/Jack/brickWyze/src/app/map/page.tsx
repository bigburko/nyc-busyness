// src/app/map/page.tsx - Moved from root page.tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { IconButton } from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Map from '../../components/features/Map/Map';
import TopLeftUI from '../../components/features/search/TopLeftUI';
import { uiStore } from '@/stores/uiStore';
import { useFilterStore } from '@/stores/filterStore';
import { useGeminiStore } from '@/stores/geminiStore';

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
  selectedTimePeriods?: string[];
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
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  foot_traffic_timeline_metadata?: Record<string, unknown>;
  crime_timeline_metadata?: Record<string, unknown>;
  foot_traffic_periods_used?: string[];
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
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  foot_traffic_timeline_metadata?: Record<string, unknown>;
  crime_timeline_metadata?: Record<string, unknown>;
  foot_traffic_periods_used?: string[];
  [key: string]: unknown;
}

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

interface EdgeFunctionResponse {
  zones: MapSearchResult[];
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
  demographic_scoring_applied?: boolean;
  foot_traffic_periods_used?: string[];
  debug?: DebugInfo;
}

interface FilterUpdate {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number;
}

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
    resetToInitialView?: () => void;
    _brickwyzeMapRef?: mapboxgl.Map;
  }
}

export default function MapPage() {
  const { selectedTimePeriods } = useFilterStore();
  const { messages } = useGeminiStore();
  
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});
  const [searchResults, setSearchResults] = useState<TractResult[]>([]);
  const [selectedTractId, setSelectedTractId] = useState<string | null>(null);
  const [selectedTract, setSelectedTract] = useState<TractResult | undefined>(undefined);
  const [fullSearchResponse, setFullSearchResponse] = useState<EdgeFunctionResponse | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // ✅ Default to fullscreen
  
  // ✅ NEW: AI Justification state
  const [lastQuery, setLastQuery] = useState<string>('');
  const [aiReasoning, setAiReasoning] = useState<string>('');

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newFullscreenState = !prev;
      
      // Trigger map resize after state change
      setTimeout(() => {
        if (window._brickwyzeMapRef) {
          window._brickwyzeMapRef.resize();
        }
      }, 100);
      
      return newFullscreenState;
    });
  }, []);

  // ✅ NEW: Auto-track AI queries and reasoning
  useEffect(() => {
    // Get the last user message as the query
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .slice(-1)[0];
    
    if (lastUserMessage?.content) {
      setLastQuery(lastUserMessage.content);
    }
    
    // Extract AI reasoning from demographic scoring if available
    const currentFilters = useFilterStore.getState();
    if (currentFilters.demographicScoring?.reasoning) {
      setAiReasoning(currentFilters.demographicScoring.reasoning);
    } else if (currentFilters.lastDemographicReasoning?.summary) {
      setAiReasoning(currentFilters.lastDemographicReasoning.summary);
    }
  }, [messages]);

  // ✅ NEW: Handle map resize when fullscreen changes
  useEffect(() => {
    const resizeMap = () => {
      if (window._brickwyzeMapRef) {
        window._brickwyzeMapRef.resize();
      }
    };

    // Resize immediately
    resizeMap();

    // Also resize after a short delay to ensure container has finished resizing
    const timeoutId = setTimeout(resizeMap, 300);

    return () => clearTimeout(timeoutId);
  }, [isFullscreen]);

  const handleFilterUpdate = useCallback((filters: FilterUpdate) => {
    console.log('🔄 [MapPage] Updating map filters - topN:', filters.topN);
    
    const mapFilters: MapFilters = {
      weights: filters.weights || [],
      rentRange: filters.rentRange || [26, 160],
      selectedEthnicities: filters.selectedEthnicities || [],
      selectedGenders: filters.selectedGenders || ['male', 'female'],
      selectedTimePeriods: filters.selectedTimePeriods || selectedTimePeriods,
      ageRange: filters.ageRange || [0, 100],
      incomeRange: filters.incomeRange || [0, 250000],
      topN: filters.topN || 10,
    };

    console.log('🔄 [MapPage] Setting current filters with topN:', mapFilters.topN);
    console.log('🕐 [MapPage] Setting current filters with timePeriods:', mapFilters.selectedTimePeriods);
    setCurrentFilters(mapFilters);
  }, [selectedTimePeriods]);

  const handleSearchResults = useCallback((results: MapSearchResult[], fullResponse?: EdgeFunctionResponse) => {
    console.log('📊 [MapPage] Received search results:', results.length, 'tracts');
    
    if (fullResponse) {
      console.log('📊 [MapPage] Storing full search response:', {
        zones_returned: fullResponse.zones?.length || 0,
        total_zones_found: fullResponse.total_zones_found || 0,
        top_percentage: fullResponse.top_percentage || 0,
        foot_traffic_periods_used: fullResponse.foot_traffic_periods_used || []
      });
      setFullSearchResponse(fullResponse);
    } else {
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
      crime_timeline: r.crime_timeline,
      foot_traffic_timeline: r.foot_traffic_timeline,
      foot_traffic_by_period: r.foot_traffic_by_period,
      foot_traffic_timeline_metadata: r.foot_traffic_timeline_metadata,
      crime_timeline_metadata: r.crime_timeline_metadata,
      foot_traffic_periods_used: r.foot_traffic_periods_used,
    }));
    
    if (transformedResults.length > 0) {
      const firstResult = transformedResults[0];
      console.log('🔍 [MapPage] Timeline data transformation check:', {
        tract_geoid: firstResult.geoid,
        has_foot_traffic_timeline: !!firstResult.foot_traffic_timeline,
        has_foot_traffic_by_period: !!firstResult.foot_traffic_by_period,
        has_crime_timeline: !!firstResult.crime_timeline,
        foot_traffic_timeline_keys: firstResult.foot_traffic_timeline ? Object.keys(firstResult.foot_traffic_timeline) : 'none',
        foot_traffic_by_period_keys: firstResult.foot_traffic_by_period ? Object.keys(firstResult.foot_traffic_by_period) : 'none'
      });
    }
    
    setSearchResults(transformedResults);
  }, [currentFilters.topN]);

  const handleSearchStart = useCallback(() => {
    console.log('🔄 [MapPage] Search started');
    setIsSearchLoading(true);
  }, []);

  const handleSearchComplete = useCallback(() => {
    console.log('✅ [MapPage] Search completed');
    setIsSearchLoading(false);
  }, []);

  const handleSearchError = useCallback((error: SearchError) => {
    console.error('❌ [MapPage] Search error:', error);
    setIsSearchLoading(false);
    setFullSearchResponse(null);
  }, []);

  const handleMapTractSelect = useCallback((tractId: string | null) => {
    console.log('🗺️ [MapPage] Highlighting tract on map:', tractId);
    setSelectedTractId(tractId);
  }, []);

  const handleClearSelectedTract = useCallback(() => {
    console.log('🔄 [MapPage] Clearing parent selectedTract state');
    setSelectedTract(undefined);
  }, []);

  useEffect(() => {
    console.log('🔧 [MapPage] Setting up global functions for map communication');
    
    window.selectTractFromResultsPanel = (tractIdParam: string) => {
      console.log('🗺️ [MapPage] Map clicked tract with ID:', tractIdParam);
      
      const tractIdStr = String(tractIdParam);
      
      console.log('🔍 [MapPage] Current state check:', {
        selectedTractId: selectedTractId,
        tractIdStr: tractIdStr,
        selectedTract: selectedTract ? selectedTract.geoid : 'undefined',
        idsMatch: selectedTractId === tractIdStr,
        hasSelectedTract: !!selectedTract,
        willSkip: selectedTractId === tractIdStr && selectedTract
      });
      
      if (selectedTractId === tractIdStr && selectedTract) {
        console.log('🚫 [MapPage] Tract already selected and detail panel open, skipping state update');
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
        console.log('✅ [MapPage] Found tract in results, setting both ID and tract object:', tract.display_name || tract.tract_name);
        console.log('🔍 [MapPage] Tract object timeline check:', {
          has_foot_traffic_timeline: !!tract.foot_traffic_timeline,
          has_foot_traffic_by_period: !!tract.foot_traffic_by_period,
          has_crime_timeline: !!tract.crime_timeline
        });
        console.log('🔍 [MapPage] Setting selectedTractId to:', tractIdStr);
        console.log('🔍 [MapPage] Setting selectedTract to tract with geoid:', tract.geoid);
        
        setSelectedTractId(tractIdStr);
        setSelectedTract(tract);
      } else {
        console.warn('⚠️ [MapPage] Tract not found in search results');
        setSelectedTract(undefined);
      }
    };
    
    window.openResultsPanel = () => {
      console.log('🔄 [MapPage] Opening results panel from map click');
      uiStore.setState({ viewState: 'results' });
    };
    
    window.resetToInitialView = () => {
      const currentState = uiStore.getState().viewState;
      console.log('🔄 [MapPage] resetToInitialView called - current state:', currentState);
      
      if (currentState === 'typing') {
        console.log('🔄 [MapPage] Closing chat input only - switching typing → results');
        uiStore.setState({ viewState: 'results' });
        console.log('✅ [MapPage] Chat input closed, results panel kept open');
      } else {
        console.log('🚫 [MapPage] Not in typing state, doing nothing to preserve current UI');
      }
    };
    
    return () => {
      console.log('🧹 [MapPage] Cleaning up global functions');
      delete window.selectTractFromResultsPanel;
      delete window.openResultsPanel;
      delete window.resetToInitialView;
    };
  }, [searchResults, selectedTractId, selectedTract]);

  const mapProps = useMemo(() => ({
    weights: currentFilters.weights || [],
    rentRange: currentFilters.rentRange || [26, 160] as [number, number],
    selectedEthnicities: currentFilters.selectedEthnicities || [],
    selectedGenders: currentFilters.selectedGenders || [],
    selectedTimePeriods: selectedTimePeriods,
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
    selectedTimePeriods,
    handleSearchResults, 
    handleSearchStart, 
    handleSearchComplete, 
    handleSearchError, 
    selectedTractId
  ]);

  // ✅ UPDATED: Include AI justification props
  const topLeftUIProps = useMemo(() => ({
    onFilterUpdate: handleFilterUpdate,
    searchResults: searchResults,
    onMapTractSelect: handleMapTractSelect,
    selectedTract: selectedTract,
    onClearSelectedTract: handleClearSelectedTract,
    fullSearchResponse: fullSearchResponse,
    isSearchLoading: isSearchLoading,
    lastQuery: lastQuery,
    aiReasoning: aiReasoning,
  }), [
    handleFilterUpdate,
    searchResults,
    handleMapTractSelect,
    selectedTract,
    handleClearSelectedTract,
    fullSearchResponse,
    isSearchLoading,
    lastQuery,
    aiReasoning
  ]);

  return (
    <main style={{ 
      height: isFullscreen ? '100vh' : 'calc(100vh - 80px)', 
      width: '100vw', 
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? '0' : 'auto',
      left: isFullscreen ? '0' : 'auto',
      marginTop: isFullscreen ? '0' : '80px',
      zIndex: isFullscreen ? 9999 : 'auto'
    }}>
      {/* Fullscreen Toggle Button */}
      <IconButton
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        icon={isFullscreen ? <ViewOffIcon /> : <ViewIcon />}
        onClick={toggleFullscreen}
        position="absolute"
        top="20px"
        right="20px"
        zIndex={10000}
        colorScheme="red"
        variant="solid"
        size="lg"
        borderRadius="full"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
        _hover={{
          transform: 'scale(1.05)',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
        }}
        transition="all 0.2s ease"
      />
      
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
          <TopLeftUI {...topLeftUIProps} />
        </div>
      </div>
    </main>
  );
}