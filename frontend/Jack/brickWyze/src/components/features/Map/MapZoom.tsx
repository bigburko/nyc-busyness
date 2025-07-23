// MapZoom.tsx - Handles map zoom functionality

import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { ResilienceScore } from './fetchResilienceScores';

interface UseMapZoomProps {
  map: mapboxgl.Map | null;
  currentGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null;
}

export const useMapZoom = ({ map, currentGeoJson }: UseMapZoomProps) => {

  // Function to zoom to show top tracts after search (preserve original style)
  const zoomToTopTracts = useCallback((zones: ResilienceScore[]) => {
    if (!map || !currentGeoJson || zones.length === 0) return;

    const topTracts = zones.slice(0, 5);
    const bounds = new mapboxgl.LngLatBounds();
    let foundTracts = 0;

    topTracts.forEach(zone => {
      const tract = currentGeoJson.features.find((feature: unknown) => {
        const typedFeature = feature as { properties?: { GEOID?: string | number } };
        return typedFeature.properties?.GEOID?.toString().padStart(11, '0') === zone.geoid?.toString().padStart(11, '0');
      });

      const typedTract = tract as { geometry?: { coordinates?: number[][][] | number[][][][] } };
      if (typedTract?.geometry?.coordinates) {
        // Handle both Polygon and MultiPolygon geometries
        let coords: number[][];
        const coordinates = typedTract.geometry.coordinates;
        
        try {
          if (coordinates[0] && Array.isArray(coordinates[0][0])) {
            // MultiPolygon: [[[lng, lat], [lng, lat], ...]]
            coords = coordinates[0][0] as number[][];
          } else if (coordinates[0]) {
            // Polygon: [[lng, lat], [lng, lat], ...]
            coords = coordinates[0] as number[][];
          } else {
            console.warn('⚠️ [MapZoom] Invalid coordinate structure for bounds');
            return;
          }
        } catch (e) {
          console.warn('⚠️ [MapZoom] Could not parse tract geometry for zoom bounds:', e);
          return;
        }
        
        if (coords?.length > 0) {
          coords.forEach((coord: number[]) => {
            if (coord?.length >= 2) {
              bounds.extend([coord[0], coord[1]] as [number, number]);
            }
          });
          foundTracts++;
        }
      }
    });

    if (foundTracts > 0) {
      console.log('🔍 [MapZoom] Zooming to show top tracts (preserving original rotation/pitch)');
      // PRESERVE ORIGINAL PITCH AND BEARING - Don't touch the map style
      map.fitBounds(bounds, {
        padding: 100,
        duration: 1200,
        maxZoom: 13
        // NO pitch or bearing specified - keeps your original map rotation/tilt
      });
    }
  }, [map, currentGeoJson]);

  return {
    zoomToTopTracts
  };
};