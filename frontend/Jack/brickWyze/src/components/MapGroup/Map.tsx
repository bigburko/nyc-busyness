'use client';

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_CENTER: [number, number] = [-74.0242, 40.6941];
const INITIAL_ZOOM = 10.12;

// ✅ Use token from env file
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Map() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const height = containerRef.current?.offsetHeight;
    console.log('[Map.tsx] container height:', height);
    console.log('[Map.tsx] Initializing map...');

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        style: 'mapbox://styles/mapbox/streets-v12',
      });

      map.on('load', () => {
        console.log('[Mapbox] Map loaded successfully');
      });

      map.on('error', (e) => {
        console.error('[Mapbox ERROR]', e.error);
      });

      return () => map.remove();
    } catch (err) {
      console.error('[Map.tsx] Error creating map:', err);
    }
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
        backgroundColor: '#e2e8f0', // just for visibility while loading
      }}
    />
  );
}
