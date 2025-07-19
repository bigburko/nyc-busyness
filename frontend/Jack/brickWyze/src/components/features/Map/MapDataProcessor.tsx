// MapDataProcessor.tsx - Handles data fetching and processing

import { useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from './CleanGeojson';
import { ResilienceScore, fetchResilienceScores } from './fetchResilienceScores';
import { ProcessGeojson } from './ProcessGeojson';
import { updateTractData } from './TractLayer';
import { showLegend } from './Legend';
import { DemographicScoring } from '../../../stores/filterStore';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface Weighting {
  id: string;
  label: string;
  value: number;
}

interface ResilienceScoreWithRanking extends ResilienceScore {
  ranking: number;
}

interface UseMapDataProcessorProps {
  map: mapboxgl.Map | null;
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number;
  demographicScoring?: DemographicScoring;
  onSearchResults?: (results: ResilienceScore[]) => void;
  setCurrentGeoJson: (data: FeatureCollection<Geometry, GeoJsonProperties>) => void;
  addHighlightLayers: (map: mapboxgl.Map) => void;
  zoomToTopTracts: (zones: ResilienceScore[]) => void;
}

export const useMapDataProcessor = ({
  map,
  weights,
  rentRange,
  selectedEthnicities,
  selectedGenders,
  ageRange,
  incomeRange,
  topN = 10,
  demographicScoring,
  onSearchResults,
  setCurrentGeoJson,
  addHighlightLayers,
  zoomToTopTracts,
}: UseMapDataProcessorProps) => {

  // Store functions in refs to avoid dependency issues
  const addHighlightLayersRef = useRef(addHighlightLayers);
  const zoomToTopTractsRef = useRef(zoomToTopTracts);
  
  useEffect(() => {
    addHighlightLayersRef.current = addHighlightLayers;
    zoomToTopTractsRef.current = zoomToTopTracts;
  }, [addHighlightLayers, zoomToTopTracts]);

  // Store onSearchResults in a ref to avoid dependency issues
  const onSearchResultsRef = useRef(onSearchResults);
  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
  }, [onSearchResults]);

  // Use fetchResilienceScores function instead of inline fetch
  const fetchAndApplyScores = useCallback(async () => {
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    // STRICTER CHECK - Don't auto-load, wait for actual search
    if (!weights?.length || !rentRange || !selectedEthnicities || !selectedGenders || !ageRange || !incomeRange) {
      console.log('⏭️ [MapDataProcessor] Skipping score fetch - filters not ready or no search performed');
      
      // Just load the base map without scores
      setCurrentGeoJson(processed);
      if (map) {
        updateTractData(map, processed);
      }
      return;
    }

    if (DEBUG_MODE) {
      console.log('📤 [MapDataProcessor] Sending to edge function:', {
        weights: weights.map(w => `${w.id}: ${w.value}%`),
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
        topN,
        hasDemographicScoring: !!demographicScoring
      });
    }

    try {
      // Use the fetchResilienceScores function
      const zones = await fetchResilienceScores({
        weights,
        rentRange,
        selectedEthnicities,
        selectedGenders,
        ageRange,
        incomeRange,
        demographicScoring
      });

      if (DEBUG_MODE) {
        console.log('📥 [MapDataProcessor] Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Data received by edge function');
      }

      // SAFETY FIX: Cap all scores at 100 to prevent frontend multiplication issues
      const cappedZones = zones.map(zone => ({
        ...zone,
        custom_score: Math.min(Math.max(zone.custom_score || 0, 0), 100),
        // Also cap other scores if needed
        foot_traffic_score: Math.min(Math.max(zone.foot_traffic_score || 0, 0), 100),
        crime_score: Math.min(Math.max(zone.crime_score || 0, 0), 100),
        flood_risk_score: Math.min(Math.max(zone.flood_risk_score || 0, 0), 100),
        rent_score: Math.min(Math.max(zone.rent_score || 0, 0), 100),
        poi_score: Math.min(Math.max(zone.poi_score || 0, 0), 100),
      }));

      // Log any scores that were over 100
      const overScores = zones.filter(zone => (zone.custom_score || 0) > 100);
      if (overScores.length > 0) {
        console.warn('⚠️ [MapDataProcessor] Found scores over 100, capping them:', overScores.map(z => `${z.geoid}: ${z.custom_score}`));
      }

      const zonesWithRankings: ResilienceScoreWithRanking[] = cappedZones.map((zone, index) => ({
        ...zone,
        ranking: index + 1
      }));

      if (DEBUG_MODE) {
        console.log('🏆 [MapDataProcessor] Added rankings to zones:', zonesWithRankings.slice(0, 5));
      }

      const scoreMap: Record<string, ResilienceScoreWithRanking> = {};
      zonesWithRankings.forEach((score) => {
        if (score?.geoid) {
          scoreMap[score.geoid.toString().padStart(11, '0')] = score;
        }
      });

      const updated = {
        ...processed,
        features: processed.features.map((feat) => {
          const rawGEOID = (feat.properties as { GEOID?: string | number })?.GEOID;
          const geoid = rawGEOID?.toString().padStart(11, '0');
          const match = scoreMap[geoid || ''];
          const featProps = feat.properties as Record<string, unknown>;
          
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { custom_score: 0, ranking: null }),
              ...match,
              hasScore: !!match,
              // FIX: Ensure NTA names are properly set from GeoJSON (with proper typing)
              nta_name: match?.nta_name || featProps?.NTAName || featProps?.nta_name || 'Unknown Neighborhood',
              tract_name: match?.tract_name || featProps?.tract_name || `Tract ${rawGEOID}`,
              display_name: match?.display_name || featProps?.NTAName || `Tract ${rawGEOID}`,
            },
          };
        }),
      };

      // Store current geojson for centering functionality
      setCurrentGeoJson(updated);

      if (DEBUG_MODE) {
        console.log('🧠 [MapDataProcessor] Updated GeoJSON with scores and rankings applied.');
      }

      if (map) {
        updateTractData(map, updated);
        showLegend();
        
        // Add highlight layers if they don't exist
        addHighlightLayersRef.current(map);
      }

      // Pass enhanced search results to parent using ref to avoid dependency loop
      if (onSearchResultsRef.current) {
        console.log('📊 [MapDataProcessor] Passing search results to parent:', cappedZones.length, 'tracts');
        
        // FIX: Enhance zones with proper NTA names from GeoJSON before passing to parent
        const enhancedZones = cappedZones.map(zone => {
          const tract = updated.features.find((feature: unknown) => {
            const typedFeature = feature as { properties?: { GEOID?: string | number } };
            return typedFeature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0');
          });
          
          // Get the actual NTAName from the GeoJSON (with proper typing)
          const tractProps = (tract as { properties?: Record<string, unknown> })?.properties;
          const neighborhoodName = String(tractProps?.NTAName || 
                                  tractProps?.nta_name || 
                                  zone.nta_name || 
                                  'Unknown Neighborhood');
          
          return {
            ...zone,
            nta_name: neighborhoodName,
            tract_name: zone.tract_name || `Tract ${zone.geoid}`,
            display_name: neighborhoodName,
          };
        });
        
        // Simple debug log AFTER array is created
        if (DEBUG_MODE) {
          console.log('🏘️ [MapDataProcessor] Enhanced', enhancedZones.length, 'zones with neighborhood names');
        }
        
        onSearchResultsRef.current(enhancedZones);
      }

      setTimeout(() => {
        zoomToTopTractsRef.current(cappedZones);
      }, 800);

    } catch (err) {
      console.error('[MapDataProcessor Error fetching and applying scores]', err);
    }
  }, [
    weights, 
    rentRange, 
    selectedEthnicities, 
    selectedGenders, 
    ageRange, 
    incomeRange, 
    topN, 
    demographicScoring,
    map,
    setCurrentGeoJson
    // 🔧 FIXED: Removed function dependencies that cause infinite loops
  ]);

  // Memoize the base map loading function
  const loadBaseMap = useCallback(() => {
    console.log('⏭️ [MapDataProcessor] Loading base map only');
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });
    setCurrentGeoJson(processed);
    if (map) {
      updateTractData(map, processed);
      // Add highlight layers even without scores
      addHighlightLayersRef.current(map);
    }
  }, [map, setCurrentGeoJson]);

  return {
    fetchAndApplyScores,
    loadBaseMap
  };
};