// src/components/features/map/Map.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useUiStore } from '@/stores/uiStore';
import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson, PotentiallyNonStandardFeatureCollection } from './CleanGeojson';
import { ResilienceScore } from './fetchResilienceScores';
import { ProcessGeojson } from './ProcessGeojson';
import { addTractLayers, updateTractData } from './TractLayer';
import { renderPopup } from './PopupHandler';
import { createLegend, showLegend } from './Legend';

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
  const openResultsPanel = useUiStore((state) => state.openResultsPanel);

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
          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { resilience_score: 0 }),
              ...match,
              hasScore: !!match,
            },
          };
        }),
      };

      if (DEBUG_MODE) console.log('🧠 Updated GeoJSON with scores applied.');

      updateTractData(mapRef.current, updated);
      showLegend();
    } catch (err) {
      console.error('[Error fetching and applying scores]', err);
    }
  }, [weights, rentRange, selectedEthnicities, selectedGenders, ageRange, incomeRange]);

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

    map.on('load', () => {
      addTractLayers(map);
      createLegend(map);
      const cleaned = CleanGeojson(rawGeojson as PotentiallyNonStandardFeatureCollection);
      const processed = ProcessGeojson(cleaned, { precision: 6 });
      updateTractData(mapRef.current, processed);
      setIsMapLoaded(true);
    });

    const handleClick = (e: MapLayerMouseEvent) => {
      const tractData = e.features && e.features[0]?.properties;
      if (tractData) {
        openResultsPanel(tractData);
      }
    };

    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'tracts-fill', () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = '';
    });

    return () => {
      map.off('click', 'tracts-fill', handleClick);
      map.remove();
      mapRef.current = null;
    };
  }, [openResultsPanel]);

  useEffect(() => {
    if (isMapLoaded) {
      fetchAndApplyScores();
    }
  }, [isMapLoaded, fetchAndApplyScores]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        zIndex: 0,
      }}
    />
  );
}