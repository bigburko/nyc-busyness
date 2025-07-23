// MapHighlight.tsx - Handles all tract highlighting logic and animations

import { useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

// Extended map type for pulse interval
type ExtendedMap = mapboxgl.Map & { _pulseInterval?: NodeJS.Timeout };

interface UseMapHighlightProps {
  map: mapboxgl.Map | null;
  currentGeoJson: FeatureCollection<Geometry, GeoJsonProperties> | null;
  highlightedTractId: string | null;
  setHighlightedTractId: (id: string | null) => void;
}

export const useMapHighlight = ({
  map,
  currentGeoJson,
  highlightedTractId,
  setHighlightedTractId,
}: UseMapHighlightProps) => {
  
  // Function to add highlight layers for selected tract
  const addHighlightLayers = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance.getSource('highlighted-tract')) {
      // Add empty source for highlighted tract
      mapInstance.addSource('highlighted-tract', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add multiple highlight layers for floating effect
      // Base glow layer
      mapInstance.addLayer({
        id: 'highlighted-tract-glow',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 4
        }
      });

      // Pulsing outline layer
      mapInstance.addLayer({
        id: 'highlighted-tract-pulse',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 4,
            1, 6
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 0.8,
            1, 0.3
          ]
        }
      });

      // Main highlight outline
      mapInstance.addLayer({
        id: 'highlighted-tract-main',
        type: 'line',
        source: 'highlighted-tract',
        paint: {
          'line-color': '#FF6B35',
          'line-width': 3,
          'line-opacity': 1
        }
      });

      // Elevated fill for floating effect
      mapInstance.addLayer({
        id: 'highlighted-tract-fill',
        type: 'fill',
        source: 'highlighted-tract',
        paint: {
          'fill-color': '#FF6B35',
          'fill-opacity': 0.1
        }
      });

      console.log('✨ [MapHighlight] Added highlight layers for tract selection');
    }
  }, []);

  // Main highlight function
  const highlightTract = useCallback((tractId: string | null) => {
    if (!map || !currentGeoJson) return;

    if (!tractId) {
      // Clear highlight
      const source = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: []
        });
      }
      setHighlightedTractId(null);
      console.log('🔄 [MapHighlight] Cleared tract highlight');
      return;
    }

    // Find the tract to highlight
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

    if (tract) {
      // Add pulsing animation property
      const highlightFeature = {
        ...tract,
        properties: {
          ...tract.properties,
          pulse: 0 // Will be animated
        }
      };

      const source = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [highlightFeature]
        });
        
        setHighlightedTractId(tractId);
        console.log('✨ [MapHighlight] Highlighted tract:', tractId);

        // Start pulsing animation
        let pulseValue = 0;
        const pulseInterval = setInterval(() => {
          pulseValue = (pulseValue + 0.1) % (Math.PI * 2);
          const normalizedPulse = (Math.sin(pulseValue) + 1) / 2; // 0 to 1
          
          const animatedFeature = {
            ...highlightFeature,
            properties: {
              ...highlightFeature.properties,
              pulse: normalizedPulse
            }
          };

          const currentSource = map.getSource('highlighted-tract') as mapboxgl.GeoJSONSource;
          if (currentSource && highlightedTractId === tractId) {
            currentSource.setData({
              type: 'FeatureCollection',
              features: [animatedFeature]
            });
          } else {
            clearInterval(pulseInterval);
          }
        }, 50); // 20fps animation
        
        // Store interval reference for cleanup
        (map as ExtendedMap)._pulseInterval = pulseInterval;
      }
    } else {
      console.warn('❌ [MapHighlight] Could not find tract to highlight:', tractId);
    }
  }, [map, currentGeoJson, highlightedTractId, setHighlightedTractId]);

  // Store highlight function in ref for event handlers
  const highlightTractRef = useRef(highlightTract);
  useEffect(() => {
    highlightTractRef.current = highlightTract;
  }, [highlightTract]);

  return {
    addHighlightLayers,
    highlightTract,
    highlightTractRef
  };
};