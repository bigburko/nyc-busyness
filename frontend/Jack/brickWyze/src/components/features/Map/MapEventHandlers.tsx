// MapEventHandlers.tsx - Handles all map click and mouse events

import { useEffect, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';

interface UseMapEventHandlersProps {
  map: mapboxgl.Map | null;
  isMapLoaded: boolean;
  highlightTractRef: MutableRefObject<(tractId: string | null) => void>;
}

export const useMapEventHandlers = ({
  map,
  isMapLoaded,
  highlightTractRef,
}: UseMapEventHandlersProps) => {

  // Map click handler using unified React state path
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      const tractId = e.features?.[0]?.properties?.GEOID;
      const hasScore = e.features?.[0]?.properties?.hasScore;
      const resilienceScore = e.features?.[0]?.properties?.custom_score;
      
      if (tractId && hasScore && resilienceScore && resilienceScore > 0) {
        const tractIdStr = tractId.toString();
        
        console.log('🗺️ [MapEventHandlers] TRUE UNIFIED: Map click using React state path only:', tractIdStr);
        
        // UNIFIED PATH: Use ONLY React state, same as results panel
        // No direct operations, no timeouts, no blocking - just trigger the unified flow
        
        if (window.openResultsPanel) {
          window.openResultsPanel();
        }
        
        if (window.selectTractFromResultsPanel) {
          console.log('🎯 [MapEventHandlers] Calling selectTractFromResultsPanel immediately');
          window.selectTractFromResultsPanel(tractIdStr);
        }
        
        // That's it! Let the normal prop flow handle everything else
        
      } else {
        console.log('⏭️ [MapEventHandlers] Tract has no resilience score, ignoring click');
        // PERFORMANCE: Use ref to avoid dependency in event listener
        highlightTractRef.current(null);
      }
    };

    const handleMouseEnter = () => {
      const canvas = map.getCanvas();
      if (canvas) canvas.style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      const canvas = map.getCanvas();
      if (canvas) canvas.style.cursor = '';
    };

    map.on('click', 'tracts-fill', handleClick);
    map.on('mouseenter', 'tracts-fill', handleMouseEnter);
    map.on('mouseleave', 'tracts-fill', handleMouseLeave);

    return () => {
      map.off('click', 'tracts-fill', handleClick);
      map.off('mouseenter', 'tracts-fill', handleMouseEnter);
      map.off('mouseleave', 'tracts-fill', handleMouseLeave);
    };
  }, [map, isMapLoaded, highlightTractRef]);

  return null; // This is a hook, no JSX to return
};