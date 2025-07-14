'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from './CleanGeojson';
import { ResilienceScore } from './fetchResilienceScores';
import { ProcessGeojson } from './ProcessGeojson';
import { addTractLayers, updateTractData } from './TractLayer';
import { renderPopup } from './PopupHandler';
import { createLegend, showLegend } from './Legend';

// ✅ Add global type declaration
declare global {
  interface Window {
    _brickwyzeMapRef?: mapboxgl.Map;
  }
}

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const EDGE_FUNCTION_URL =
  'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface Weighting {
  id: string;
  label: string;
  value: number;
}

interface MapProps {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number; // ✅ Add topN prop
}

export default function Map({
  weights,
  rentRange,
  selectedEthnicities,
  selectedGenders,
  ageRange,
  incomeRange,
  topN = 10, // ✅ Default to 10% if not provided
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const fetchAndApplyScores = useCallback(async () => {
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    if (!weights || !rentRange || !selectedEthnicities || !selectedGenders || !ageRange || !incomeRange) {
      return;
    }

    if (DEBUG_MODE) {
      console.log('📤 Sending to edge function:', {
        weights,
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
        topN // ✅ Include topN in debug log
      });
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          weights,
          rentRange,
          ethnicities: selectedEthnicities,
          genders: selectedGenders,
          ageRange,
          incomeRange,
          topN // ✅ Include topN in API call
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Edge error ${response.status}:`, errorText);
        throw new Error(`Edge function failed: ${errorText}`);
      }

      interface ApiResponse {
        zones: ResilienceScore[];
        debug?: Record<string, unknown>;
      }

      const { zones, debug } = (await response.json()) as ApiResponse;

      if (DEBUG_MODE) {
        console.log('📥 Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Data received by edge function:', debug);
      }

      // ✅ NEW: Add rankings to zones (1st, 2nd, 3rd, etc.)
      // Zones are already sorted by score from edge function, so ranking is just index + 1
      const zonesWithRankings = zones.map((zone, index) => ({
        ...zone,
        ranking: index + 1 // 1st place = index 0 + 1, 2nd place = index 1 + 1, etc.
      }));

      if (DEBUG_MODE) {
        console.log('🏆 Added rankings to zones:', zonesWithRankings.slice(0, 5)); // Log first 5 for debugging
      }

      const scoreMap: Record<string, any> = {};
      zonesWithRankings.forEach((score) => {
        if (score?.geoid) {
          scoreMap[score.geoid.toString().padStart(11, '0')] = score;
        }
      });

      const updated = {
        ...processed,
        features: processed.features.map((feat) => {
          const rawGEOID = feat.properties?.GEOID;
          const geoid = rawGEOID?.toString().padStart(11, '0');
          const match = scoreMap[geoid];
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { custom_score: 0, ranking: null }),
              ...match,
              hasScore: !!match,
            },
          };
        }),
      };

      if (DEBUG_MODE) {
        console.log('🧠 Updated GeoJSON with scores and rankings applied.');
        // Log a few features to see if ranking is there
        const featuresWithRankings = updated.features.filter(f => f.properties.ranking);
        console.log('🏆 Features with rankings:', featuresWithRankings.length);
        console.log('🏆 Sample feature with ranking:', featuresWithRankings[0]?.properties);
      }

      updateTractData(mapRef.current, updated);
      showLegend();
    } catch (err) {
      console.error('[Error fetching and applying scores]', err);
    }
  }, [weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange, topN]); // ✅ Include topN in dependency array

  // ✅ FIX: Map initialization only happens ONCE
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 20,
      bearing: 29,
      antialias: true,
      style: 'mapbox://styles/mapbox/light-v11',
    });
    mapRef.current = map;
    
    // ✅ CRITICAL: Add this line to expose map globally
    window._brickwyzeMapRef = map;

    map.on('load', () => {
      addTractLayers(map);
      createLegend(map);
      const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
      const processed = ProcessGeojson(cleaned, { precision: 6 });
      updateTractData(mapRef.current, processed);
      setIsMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      window._brickwyzeMapRef = undefined;
    };
  }, []); // ✅ EMPTY DEPENDENCY ARRAY - map only initializes once!

  // ✅ Separate useEffect for click handlers (runs when deps change but doesn't recreate map)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      renderPopup(e, weights, selectedEthnicities, selectedGenders);
    };

    const handleMouseEnter = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    };

    // Add event listeners
    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', handleMouseEnter);
    map.on('mouseleave', 'tracts-fill', handleMouseLeave);

    return () => {
      // Remove event listeners with same function references
      map.off('click', 'tracts-fill', handleClick);
      map.off('mouseenter', 'tracts-fill', handleMouseEnter);
      map.off('mouseleave', 'tracts-fill', handleMouseLeave);
    };
  }, [weights, selectedEthnicities, selectedGenders, isMapLoaded]);

  useEffect(() => {
    if (isMapLoaded) {
      fetchAndApplyScores();
    }
  }, [isMapLoaded, fetchAndApplyScores, topN]); // ✅ Include topN in dependency array

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '100%',
        zIndex: 0,
        backgroundColor: '#e2e8f0',
      }}
    />
  );
}