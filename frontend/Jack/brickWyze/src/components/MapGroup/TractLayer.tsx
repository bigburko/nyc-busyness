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
              'interpolate',
              ['linear'],
              ['get', 'custom_score'],
              0, '#d73027',
              0.2, '#fc8d59',
              0.4, '#fee08b',
              0.6, '#d9ef8b',
              0.8, '#91bfdb',
              1, '#1a9850',
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
    map.triggerRepaint();
  }
};
