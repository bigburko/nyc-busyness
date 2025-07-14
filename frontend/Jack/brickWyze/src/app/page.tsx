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

export default function Page() {
  // ✅ State to hold current filters that get passed to Map
  const [currentFilters, setCurrentFilters] = useState<MapFilters>({});
  const [searchResults, setSearchResults] = useState<any[]>([]); // ✅ NEW: Store search results
  const [selectedTractId, setSelectedTractId] = useState<string | null>(null); // ✅ NEW: Track selected tract
  const [selectedTract, setSelectedTract] = useState<any>(null); // ✅ NEW: Store the actual selected tract object

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

  // ✅ NEW: Handle search results from Map
  const handleSearchResults = useCallback((results: any[]) => {
    console.log('📊 [Page] Received search results:', results.length, 'tracts');
    setSearchResults(results);
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
    
    (window as any).selectTractFromResultsPanel = (tractIdParam: string) => {
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
      }
    };
    
    (window as any).openResultsPanel = () => {
      console.log('🔄 [Page] Opening results panel from map click');
      uiStore.setState({ viewState: 'results' });
    };
    
    return () => {
      console.log('🧹 [Page] Cleaning up global functions');
      delete (window as any).selectTractFromResultsPanel;
      delete (window as any).openResultsPanel;
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
            selectedTract={selectedTract} // ✅ NEW: Pass the selected tract object directly
          />
        </div>
      </div>
    </main>
  );
}