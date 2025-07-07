'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from '@/components/MapGroup/manhattan_census_tracts.json';
import { CleanGeojson } from '@/components/MapGroup/CleanGeojson';
import { ProcessGeojson } from '@/components/MapGroup/ProcessGeojson';
import { addTractLayers, updateTractData } from '@/components/MapGroup/TractLayer';
import { renderPopup } from '@/components/MapGroup/PopupHandler';
import { createLegend, showLegend } from '@/components/MapGroup/Legend';

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const EDGE_FUNCTION_URL =
  'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience';

const DEBUG_MODE = true;

interface MapProps {
  weights?: any[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
}

export default function Map({ weights, rentRange, selectedEthnicities }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const watchedGEOIDs = [
    '36061019500', '36061019100', '36061018700',
    '36061019300', '36061018900', '36061018500',
  ];

  const loadInitialTracts = () => {
    const cleaned = CleanGeojson(rawGeojson);
    const processed = ProcessGeojson(cleaned, { precision: 6 });
    updateTractData(mapRef.current, processed);
  };

  const fetchAndApplyScores = async () => {
    const cleaned = CleanGeojson(rawGeojson);
    const processed = ProcessGeojson(cleaned, { precision: 6 });

    if (!weights || !rentRange || !selectedEthnicities) return;

    if (DEBUG_MODE) {
      console.log('📤 Sending to edge function:', {
        weights,
        rentRange,
        ethnicities: selectedEthnicities,
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
        body: JSON.stringify({ weights, rentRange, ethnicities: selectedEthnicities }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Edge error ${response.status}:`, errorText);
        throw new Error(errorText);
      }

      const { zones, debug } = await response.json();

      if (DEBUG_MODE) {
        console.log('📥 Edge function returned zones:', zones.length);
        console.log('[✅ DEBUG] Ethnicities sent:', debug?.received_ethnicities);
        console.log('[✅ DEBUG] Sample demo scores:', debug?.sample_demo_scores);
        console.log('[✅ DEBUG] Watched tracts filtered by rent:', debug?.filtered_out_watched);
        console.log('[✅ DEBUG] Watched rent values:', debug?.watched_rents);
      }

      const scoreMap: Record<string, any> = {};
      zones.forEach((s: any) => {
        if (s?.geoid) scoreMap[s.geoid.toString().padStart(11, '0')] = s;
      });

      const updated = {
        ...processed,
        features: processed.features.map((feat) => {
          const rawGEOID = feat.properties?.GEOID;
          const geoid = rawGEOID?.toString().padStart(11, '0');
          const match = scoreMap[geoid];

          if (DEBUG_MODE && watchedGEOIDs.includes(geoid)) {
            console.log(`🧐 Match debug for ${geoid}`, {
              raw: rawGEOID,
              padded: geoid,
              match,
              foundInScoreMap: !!scoreMap[geoid],
              props: feat.properties,
            });
          }

          return {
            ...feat,
            properties: {
              ...feat.properties,
              ...(match || { custom_score: 0 }),
              ...match,
              hasScore: watchedGEOIDs.includes(geoid) || !!match, // ✅ apply last
            },
          };
        }),
      };

      if (DEBUG_MODE) {
        const missingHasScore = watchedGEOIDs.filter((id) => {
          const padded = id.toString().padStart(11, '0');
          const match = updated.features.find((f) => f.properties?.GEOID === padded);
          return !match?.properties?.hasScore;
        });

        if (missingHasScore.length > 0) {
          console.warn('⚠️ These tracts matched scoreMap but still have hasScore = false:', missingHasScore);
        } else {
          console.log('✅ All watched tracts have hasScore = true');
        }

        console.log('🧠 Updated GeoJSON with scores:', updated);
      }

      updateTractData(mapRef.current, updated);
      showLegend();
    } catch (err) {
      console.error('[Error fetching scores]', err);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

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
      loadInitialTracts();
      setIsMapLoaded(true);
    });

    map.on('click', 'tracts-fill', (e) => {
      renderPopup(e, weights, selectedEthnicities);
    });

    map.on('mouseenter', 'tracts-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'tracts-fill', () => {
      map.getCanvas().style.cursor = '';
    });

    return () => {
      map.remove();
      setIsMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (isMapLoaded && weights && rentRange && selectedEthnicities) {
      fetchAndApplyScores();
    }
  }, [isMapLoaded, weights, rentRange, selectedEthnicities]);

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
