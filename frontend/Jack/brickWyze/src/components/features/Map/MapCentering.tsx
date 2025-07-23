// MapCentering.tsx - Handles all map centering and panning logic

import { useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

// Centering state management
interface CenteringState {
  isAnimating: boolean;
  lastCenterTime: number;
  pendingTractId: string | null;
  source: 'map_click' | 'results_click' | 'prop_update';
}

interface UseMapCenteringProps {
  map: mapboxgl.Map | null;
  currentGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null;
}

export const useMapCentering = ({ map, currentGeoJson }: UseMapCenteringProps) => {
  
  // Unified centering state management
  const centeringStateRef = useRef<CenteringState>({
    isAnimating: false,
    lastCenterTime: 0,
    pendingTractId: null,
    source: 'prop_update'
  });

  // Single source of truth for centering logic
  const performCentering = useCallback((
    tractId: string, 
    source: 'map_click' | 'results_click' | 'prop_update',
    force: boolean = false
  ) => {
    const now = Date.now();
    
    if (!map || !currentGeoJson) {
      console.warn('🚫 [MapCentering] Cannot center - map or geojson not ready');
      return false;
    }

    const state = centeringStateRef.current;
    
    // Basic debouncing only
    if (!force) {
      // If we're already animating to the same tract, skip
      if (state.isAnimating && state.pendingTractId === tractId) {
        console.log('🚫 [MapCentering] Already centering to tract:', tractId);
        return false;
      }
      
      // Simple debouncing - same for all sources
      const timeSinceLastCenter = now - state.lastCenterTime;
      if (timeSinceLastCenter < 300) { // Shorter debounce
        console.log('🚫 [MapCentering] Blocking rapid centering');
        return false;
      }
    }

    // Find the tract geometry
    const searchIds = [
      tractId,
      tractId.padStart(11, '0'),
      tractId.toString(),
      tractId.toString().padStart(11, '0')
    ];
    
    let tract = null;
    for (const searchId of searchIds) {
      tract = currentGeoJson.features.find((feature: unknown) => {
        const typedFeature = feature as { properties?: { GEOID?: string | number } };
        const featureId = typedFeature.properties?.GEOID?.toString();
        return featureId === searchId || featureId?.padStart(11, '0') === searchId;
      });
      if (tract) break;
    }

    const typedTract = tract as { geometry?: { coordinates?: number[][][] | number[][][][] } };
    if (!typedTract?.geometry?.coordinates) {
      console.error('❌ [MapCentering] Tract not found:', tractId);
      return false;
    }

    try {
      // Calculate center coordinates
      let coords: number[][];
      const coordinates = typedTract.geometry.coordinates;
      
      if (coordinates[0] && Array.isArray(coordinates[0][0])) {
        coords = coordinates[0][0] as number[][];
      } else if (coordinates[0]) {
        coords = coordinates[0] as number[][];
      } else {
        console.error('❌ [MapCentering] Invalid coordinate structure');
        return false;
      }
      
      if (coords?.length > 0) {
        let totalLng = 0;
        let totalLat = 0;
        let validCoords = 0;
        
        coords.forEach((coord: number[]) => {
          if (coord?.length >= 2 && 
              typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
              !isNaN(coord[0]) && !isNaN(coord[1])) {
            totalLng += coord[0];
            totalLat += coord[1];
            validCoords++;
          }
        });
        
        if (validCoords > 0) {
          const centerLng = totalLng / validCoords;
          const centerLat = totalLat / validCoords;
          
          if (!isNaN(centerLng) && !isNaN(centerLat) && 
              centerLng >= -180 && centerLng <= 180 && 
              centerLat >= -90 && centerLat <= 90) {
            
            // UPDATE STATE BEFORE ANIMATION
            state.isAnimating = true;
            state.pendingTractId = tractId;
            state.source = source;
            state.lastCenterTime = now;
            
            // Calculate offset for popup panel
            let adjustedCenterLng = centerLng;
            
            try {
              const bounds = map.getBounds();
              if (bounds) {
                const eastBound = bounds.getEast();
                const westBound = bounds.getWest();
                
                if (typeof eastBound === 'number' && typeof westBound === 'number') {
                  const mapContainer = map.getContainer();
                  const mapWidth = mapContainer.clientWidth;
                  const popupWidth = 450;
                  
                  const offsetX = -(popupWidth / 2);
                  const mapWidthInDegrees = eastBound - westBound;
                  const pixelsPerDegree = mapWidth / mapWidthInDegrees;
                  const longitudeOffset = offsetX / pixelsPerDegree;
                  
                  adjustedCenterLng = centerLng + longitudeOffset;
                }
              }
            } catch (error) {
              console.warn('⚠️ [MapCentering] Error calculating offset, using basic centering:', error);
            }
            
            console.log('🎯 [MapCentering] Centering:', {
              source,
              tractId,
              center: [adjustedCenterLng, centerLat],
              force
            });
            
            // CONSISTENT: Always use 800ms duration and same easing
            map.panTo([adjustedCenterLng, centerLat], {
              duration: 800, // Same as results panel
              easing: (t: number) => t * (2 - t) // Same easing function
            });
            
            // CONSISTENT: Same cleanup timing
            setTimeout(() => {
              state.isAnimating = false;
              if (state.pendingTractId === tractId) {
                state.pendingTractId = null;
              }
            }, 900); // Slightly longer than animation duration
            
            return true;
          }
        }
      }
    } catch (error) {
      console.error('❌ [MapCentering] Error during centering:', error);
      state.isAnimating = false;
      state.pendingTractId = null;
      return false;
    }
    
    return false;
  }, [map, currentGeoJson]);

  return {
    performCentering,
    centeringStateRef
  };
};