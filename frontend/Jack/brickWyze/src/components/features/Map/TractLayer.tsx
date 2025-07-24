import mapboxgl from 'mapbox-gl';
import { FeatureCollection } from 'geojson';

/**
 * Adds a bright background layer specifically under tract areas
 * This makes tract data pop against the normal map background
 */
const addTractBackgroundLayer = (map: mapboxgl.Map) => {
  // Only add if not already present
  if (map.getLayer('tract-bright-background')) {
    return;
  }

  // Add bright background layer using the same source as tracts
  map.addLayer({
    id: 'tract-bright-background',
    type: 'fill',
    source: 'tracts',
    paint: {
      'fill-color': '#ffffff', // Bright white background
      'fill-opacity': [
        'case',
        ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
        [
          'case',
          ['get', 'hasScore'],
          0.8, // Bright background only where there's data
          0    // Transparent where no data
        ],
        0
      ]
    }
  }, 'tracts-fill'); // Position right before tract fill layer
  
  console.log('✨ [TractLayer] Added bright background layer under tract data');
};



/**
 * Adds the fill and outline layers for census tracts on initial map load.
 */
export const addTractLayers = (map: mapboxgl.Map) => {
  // Add the tracts source if it doesn't exist
  if (!map.getSource('tracts')) {
    map.addSource('tracts', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  }

  // Add tract fill layer with proper resilience score colors FIRST
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
              ['>=', ['get', 'custom_score'], 80],
              [
                'interpolate',
                ['linear'],
                ['get', 'custom_score'],
                80, '#22c55e',  // Green
                100, '#16a34a'  // Darker green at 100
              ],
              ['>=', ['get', 'custom_score'], 60], '#7dd3fc', // Light Blue
              ['>=', ['get', 'custom_score'], 40], '#fbbf24', // Yellow
              ['>=', ['get', 'custom_score'], 20], '#fb923c', // Orange
              '#ef4444' // Red for 0-20
            ],
            'transparent',
          ],
          'transparent',
        ],
        'fill-opacity': 0.85, // Slightly higher opacity for better contrast against bright background
      },
    });
  }

  // ✅ Add bright background layer AFTER tracts-fill exists, positioned before it
  addTractBackgroundLayer(map);

  // Add tract outline layer - KEEP BLACK outlines as requested
  if (!map.getLayer('tracts-outline')) {
    map.addLayer({
      id: 'tracts-outline',
      type: 'line',
      source: 'tracts',
      paint: {
        'line-color': '#333', // Slightly darker for better contrast against bright background
        'line-width': 1,
        'line-opacity': 0.9,
      },
    });
  }

  // Add tract labels layer
  if (!map.getLayer('tracts-labels')) {
    map.addLayer({
      id: 'tracts-labels',
      type: 'symbol',
      source: 'tracts',
      layout: {
        'text-field': [
          'case',
          ['all', 
            ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
            ['get', 'hasScore']
          ],
          [
            'to-string',
            ['round', ['get', 'custom_score']]
          ],
          ''
        ],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,
          12, 12,
          14, 16,
          16, 20
        ],
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'symbol-placement': 'point'
      },
      paint: {
        'text-color': '#333333', // Darker text for better contrast against bright background
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-opacity': [
          'case',
          ['all', 
            ['==', ['typeof', ['get', 'hasScore']], 'boolean'],
            ['get', 'hasScore']
          ],
          0.9,
          0
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
    
    // Maintain proper opacity
    map.setPaintProperty('tracts-fill', 'fill-opacity', 0.7);
    
    // Update label opacity
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