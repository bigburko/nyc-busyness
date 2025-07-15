'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect } from 'react';

interface Props {
  map: mapboxgl.Map | null;
  geojson: GeoJSON.FeatureCollection;
  layerId?: string;
  fillColor?: string;
}

const MapMarkers = ({ map, geojson, layerId = 'geojson-layer', fillColor = '#FF5722' }: Props) => {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // Remove existing source/layer if already added
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
    }

    // Add GeoJSON source
    map.addSource(layerId, {
      type: 'geojson',
      data: geojson,
    });

    // Add fill layer
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': fillColor,
        'fill-opacity': 0.6,
      },
    });

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(layerId)) map.removeSource(layerId);
    };
  }, [map, geojson, layerId, fillColor]);

  return null;
};

export default MapMarkers;
