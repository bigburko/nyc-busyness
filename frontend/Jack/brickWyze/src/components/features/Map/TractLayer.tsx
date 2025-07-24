// components/MapGroup/TractLayer.tsx

import mapboxgl from 'mapbox-gl';
import { FeatureCollection } from 'geojson';

/**
 * Adds the fill and outline layers for census tracts on initial map load.
 */
export const addTractLayers = (map: mapboxgl.Map) => {
  if (!map.getSource('tracts')) {
    map.addSource('tracts', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  if (!map.getLayer('tracts-fill')) {
    map.addLayer({
      id: 'tracts-fill',
      type: 'fill',
      source: 'tracts',
      paint: {
        'fill-color': [
          'case',
          ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
          [
            'case',
            ['get', 'hasScore'],
            [
              'case',
              // ✅ FIXED: Exact thresholds matching the legend
              ['>=', ['get', 'custom_score'], 80],
              [
                // Extra dark green as it approaches 100
                'interpolate',
                ['linear'],
                ['get', 'custom_score'],
                80, '#22c55e',   // Green at 80
                100, '#16a34a'   // Darker green at 100
              ],
              ['>=', ['get', 'custom_score'], 60], '#7dd3fc',  // Good (60-80) - Light Blue
              ['>=', ['get', 'custom_score'], 40], '#fbbf24',  // Fair (40-60) - Yellow  
              ['>=', ['get', 'custom_score'], 20], '#fb923c',  // Low (20-40) - Orange
              '#ef4444'  // Very Low (0-20) - Red
            ],
            'transparent',
          ],
          'transparent',
        ],
        'fill-opacity': 0,
      },
    });
  }

  if (!map.getLayer('tracts-outline')) {
    map.addLayer({
      id: 'tracts-outline',
      type: 'line',
      source: 'tracts',
      paint: {
        'line-color': '#666',
        'line-width': 1,
        'line-opacity': 0.8,
      },
    });
  }

  // ✅ UPDATED: Simple score numbers for all tracts (0-100 scale)
  if (!map.getLayer('tracts-labels')) {
    map.addLayer({
      id: 'tracts-labels',
      type: 'symbol',
      source: 'tracts',
      layout: {
        'text-field': [
          'case',
          // Only show labels for tracts that have scores
          ['all', 
            ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
            ['get', 'hasScore']
          ],
          // ✅ FIXED: Scores are now 0-100, so just round them (no multiplication)
          [
            'to-string',
            ['round', ['get', 'custom_score']]
          ],
          '' // Empty string for tracts without scores
        ],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,   // Small text at low zoom
          12, 12,  // Medium text at medium zoom  
          14, 16,  // Larger text when zoomed in
          16, 20   // Large text when very close
        ],
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'symbol-placement': 'point'
      },
      paint: {
        // ✅ CONSISTENT STYLING: All numbers get same white text with black outline
        'text-color': '#ffffff', // Clean white text for all scores
        'text-halo-color': '#000000', // Black outline for readability
        'text-halo-width': 1.5, // Good outline thickness
        'text-opacity': [
          'case',
          ['all', 
            ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
            ['get', 'hasScore']
          ],
          0.9, // Good visibility
          0    // Invisible for tracts without scores
        ]
      }
    });
  }
};

/**
 * Updates the GeoJSON source data on the map.
 */
export const updateTractData = (
  map: mapboxgl.Map | null,
  geojson: FeatureCollection
) => {
  if (!map || !map.getSource('tracts')) return;
  const source = map.getSource('tracts');
  if (source && 'setData' in source) {
    (source as mapboxgl.GeoJSONSource).setData(geojson);
    map.setPaintProperty('tracts-fill', 'fill-opacity', 0.7);
    
    // ✅ Ensure labels are visible when data updates
    if (map.getLayer('tracts-labels')) {
      map.setPaintProperty('tracts-labels', 'text-opacity', [
        'case',
        ['all', 
          ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
          ['get', 'hasScore']
        ],
        0.9,
        0
      ]);
    }
    
    map.triggerRepaint();
  }
};