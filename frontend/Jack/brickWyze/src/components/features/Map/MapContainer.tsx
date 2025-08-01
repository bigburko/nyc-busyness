// src/components/MapGroup/MapContainer.tsx
'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, ReactNode } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

interface Props {
  children?: ReactNode;
}

const MapContainer = ({ children }: Props) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.9712, 40.7831], // Manhattan
      zoom: 12,
      attributionControl: false // ✅ This removes the Mapbox attribution
    });

    mapRef.current.on('load', () => {
      console.log('🗺️ Map loaded without attribution');
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null; // Clean up ref
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    // FIX: Render the `children` prop inside the div.
    // Added `position: 'relative'` to create a positioning context for children.
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

export default MapContainer;