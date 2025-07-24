// useMapState.ts - Custom hook for map state management

import { useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';

// Extended map type for pulse interval
type ExtendedMap = mapboxgl.Map & { _pulseInterval?: NodeJS.Timeout };

const INITIAL_CENTER: [number, number] = [-73.9712, 40.7831];
const INITIAL_ZOOM = 12;

export const useMapState = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentGeoJson, setCurrentGeoJson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);
  const [highlightedTractId, setHighlightedTractId] = useState<string | null>(null);

  // Initialize map
  const initializeMap = useCallback((addHighlightLayers: (map: mapboxgl.Map) => void) => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 20,
      bearing: 29,
      antialias: true,
      style: 'mapbox://styles/mapbox/light-v11',
      attributionControl: false // ✅ This removes the Mapbox attribution
    });
    mapRef.current = map;
    
    window._brickwyzeMapRef = map;

    // Import required functions dynamically to avoid circular deps
    map.on('load', async () => {
      const { addTractLayers } = await import('../components/features/Map/TractLayer');
      const { createLegend } = await import('../components/features/Map/Legend');
      const { CleanGeojson } = await import('../components/features/Map/CleanGeojson');
      const { ProcessGeojson } = await import('../components/features/Map/ProcessGeojson');
      const { updateTractData } = await import('../components/features/Map/TractLayer');
      const rawGeojson = await import('../components/features/Map/manhattan_census_tracts.json');

      addTractLayers(map);
      createLegend(map);
      const cleaned = CleanGeojson(rawGeojson as { type: "FeatureCollection"; features: Feature<Geometry, GeoJsonProperties>[]; [key: string]: unknown });
      const processed = ProcessGeojson(cleaned, { precision: 6 });
      updateTractData(mapRef.current, processed);
      setCurrentGeoJson(processed);
      
      // Add highlight layers on map load
      addHighlightLayers(map);
      
      setIsMapLoaded(true);
      console.log('🗺️ Map loaded without attribution (useMapState)');
    });

    return () => {
      // Clean up pulse interval
      const mapWithInterval = map as ExtendedMap;
      if (mapWithInterval._pulseInterval) {
        clearInterval(mapWithInterval._pulseInterval);
      }
      map.remove();
      mapRef.current = null;
      window._brickwyzeMapRef = undefined;
      delete window.centerMapOnTract;
    };
  }, [containerRef]);

  return {
    mapRef,
    isMapLoaded,
    currentGeoJson,
    setCurrentGeoJson,
    highlightedTractId,
    setHighlightedTractId,
    initializeMap
  };
};