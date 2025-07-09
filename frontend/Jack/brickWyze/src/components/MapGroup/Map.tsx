'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from '@/components/MapGroup/manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from '@/components/MapGroup/CleanGeojson';
import { ResilienceScore } from '@/components/MapGroup/fetchResilienceScores';
import { ProcessGeojson } from '@/components/MapGroup/ProcessGeojson';
import { addTractLayers, updateTractData } from '@/components/MapGroup/TractLayer';
import { renderPopup } from '@/components/MapGroup/PopupHandler';
import { createLegend, showLegend } from '@/components/MapGroup/Legend';

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const EDGE_FUNCTION_URL =
  'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface MapProps {
  weights?: number[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
}

export default function Map({
  weights,
  rentRange,
  selectedEthnicities,
  selectedGenders,
  ageRange,
  incomeRange,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Memoize the data fetching logic to prevent it being recreated on every render.
  // This gives the useEffect hook a stable function reference.
  const fetchAndApplyScores = useCallback(async () => {
    const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    // Guard clause to ensure all necessary props are defined before fetching.
    if (!weights || !rentRange || !selectedEthnicities || !selectedGenders || !ageRange || !incomeRange) {
      return;
    }

    if (DEBUG_MODE) {
      console.log('📤 Sending to edge function:', { weights, rentRange, ethnicities: selectedEthnicities, genders: selectedGenders, ageRange, incomeRange });
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}` },
        body: JSON.stringify({ weights, rentRange, ethnicities: selectedEthnicities, genders: selectedGenders, ageRange, incomeRange }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Edge error ${response.status}:`, errorText);
        throw new Error(`Edge function failed: ${errorText}`);
      }
      
      interface ApiResponse { zones: ResilienceScore[]; debug?: Record<string, unknown>; }
      const { zones, debug } = (await response.json()) as ApiResponse;

      if (DEBUG_MODE) {
        console.log('📥 Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Data received by edge function:', debug);
      }

      const scoreMap: Record<string, ResilienceScore> = {};
      zones.forEach((score: ResilienceScore) => {
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
          return { ...feat, properties: { ...feat.properties, ...(match || { custom_score: 0 }), ...match, hasScore: !!match }};
        }),
      };

      if (DEBUG_MODE) console.log('🧠 Updated GeoJSON with scores applied.');
      
      updateTractData(mapRef.current, updated);
      showLegend();

    } catch (err) {
      console.error('[Error fetching and applying scores]', err);
    }
  }, [weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange]);


  // Effect for initializing the map and its event listeners.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return; // Prevent re-initialization

    const map = new mapboxgl.Map({
      container: containerRef.current, center: INITIAL_CENTER, zoom: INITIAL_ZOOM,
      pitch: 20, bearing: 29, antialias: true, style: 'mapbox://styles/mapbox/light-v11',
    });
    mapRef.current = map;

    map.on('load', () => {
      addTractLayers(map);
      createLegend(map);
      const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
      const processed = ProcessGeojson(cleaned, { precision: 6 });
      updateTractData(mapRef.current, processed);
      setIsMapLoaded(true);
    });

    const handleClick = (e: MapLayerMouseEvent) => renderPopup(e, weights, selectedEthnicities, selectedGenders);
    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', () => { if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'tracts-fill', () => { if (map.getCanvas()) map.getCanvas().style.cursor = ''; });

    return () => { // Cleanup function
      map.off('click', 'tracts-fill', handleClick);
      map.remove();
      mapRef.current = null;
    };
  }, [weights, selectedEthnicities, selectedGenders]);


  // Effect for triggering data fetch when dependencies change.
  useEffect(() => {
    if (isMapLoaded) {
      fetchAndApplyScores();
    }
  }, [isMapLoaded, fetchAndApplyScores]);


  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        height: '100%', width: '100%', zIndex: 0, backgroundColor: '#e2e8f0',
      }}
    />
  );
}
