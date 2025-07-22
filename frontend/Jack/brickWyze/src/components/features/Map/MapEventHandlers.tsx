// MapEventHandlers.tsx - Handles all map click and mouse events

import { useEffect, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import type { MapLayerMouseEvent } from 'mapbox-gl';

// NEW: Extend global window interface for this file
declare global {
  interface Window {
    closeTractDetailPanel?: () => void;
    closeResultsPanel?: () => void;
    resetToInitialView?: () => void;
    openResultsPanel?: () => void;
    selectTractFromResultsPanel?: (tractId: string) => void;
  }
}

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

    const handleTractClick = (e: MapLayerMouseEvent) => {
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
        console.log('⏭️ [MapEventHandlers] Tract has no resilience score, closing panel');
        
        // Clear highlight
        highlightTractRef.current(null);
        
        // Close the tract detail panel when clicking invalid tracts
        if (window.closeTractDetailPanel) {
          window.closeTractDetailPanel();
        } else {
          console.log('⚠️ [MapEventHandlers] closeTractDetailPanel not available');
        }
        
        // Reset UI to initial state (closes chat panel, shows search bar)
        if (window.resetToInitialView) {
          console.log('🔄 [MapEventHandlers] Calling resetToInitialView');
          window.resetToInitialView();
        } else {
          console.log('⚠️ [MapEventHandlers] resetToInitialView not available');
        }
      }
    };

    // NEW: General map click handler for non-tract areas
    const handleGeneralMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if we clicked on a tract layer
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['tracts-fill']
      });
      
      // If no tract features found, we clicked on empty map space
      if (!features || features.length === 0) {
        console.log('🗺️ [MapEventHandlers] Clicked on empty map area, closing tract panel');
        
        // Clear any highlighted tract
        highlightTractRef.current(null);
        
        // Close the tract detail panel if it's open
        if (window.closeTractDetailPanel) {
          window.closeTractDetailPanel();
        } else {
          console.log('⚠️ [MapEventHandlers] closeTractDetailPanel not available');
        }
        
        // Reset UI to initial state (closes chat panel, shows search bar)
        if (window.resetToInitialView) {
          console.log('🔄 [MapEventHandlers] Calling resetToInitialView');
          window.resetToInitialView();
        } else {
          console.log('⚠️ [MapEventHandlers] resetToInitialView not available');
        }
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

    // Tract-specific event listeners
    map.on('click', 'tracts-fill', handleTractClick);
    map.on('mouseenter', 'tracts-fill', handleMouseEnter);
    map.on('mouseleave', 'tracts-fill', handleMouseLeave);
    
    // NEW: General map click listener (fires for all map clicks)
    map.on('click', handleGeneralMapClick);

    return () => {
      map.off('click', 'tracts-fill', handleTractClick);
      map.off('mouseenter', 'tracts-fill', handleMouseEnter);
      map.off('mouseleave', 'tracts-fill', handleMouseLeave);
      
      // Clean up general map click listener
      map.off('click', handleGeneralMapClick);
    };
  }, [map, isMapLoaded, highlightTractRef]);

  return null; // This is a hook, no JSX to return
};