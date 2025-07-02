'use client';

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import rawGeojson from './manhattan_census_tracts.json';
import { CleanGeojson } from './CleanGeojson';
import { ProcessGeojson } from './ProcessGeojson';

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831]; // Over Manhattan
const INITIAL_ZOOM = 12.5;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[Map.tsx] Initializing map...');

    const map = new mapboxgl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: 'mapbox://styles/mapbox/streets-v12',
    });

    map.on('load', () => {
      console.log('[Mapbox] Map loaded successfully');

      // ✅ Clean and process the raw GeoJSON
      const cleaned = CleanGeojson(rawGeojson);
      const processed = ProcessGeojson(cleaned, { precision: 6 });

      map.addSource('tracts', {
        type: 'geojson',
        data: processed,
      });

      map.addLayer({
        id: 'tracts-fill',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': '#FF492C',
          'fill-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'tracts-outline',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': '#000000',
          'line-width': 1,
        },
      });
    });

    map.on('error', (e) => {
      console.error('[Mapbox ERROR]', e.error);
    });

    return () => map.remove();
  }, []);

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
