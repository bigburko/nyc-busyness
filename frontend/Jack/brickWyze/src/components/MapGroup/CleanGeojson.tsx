// src/utils/cleanGeojson.ts

import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

/**
 * Strips non-standard keys like `name` and `crs`, returning a clean FeatureCollection.
 */
export function CleanGeojson(input: any): FeatureCollection<Geometry, GeoJsonProperties> {
  if (input.type !== 'FeatureCollection' || !Array.isArray(input.features)) {
    throw new Error('Invalid GeoJSON: missing "FeatureCollection" type or "features" array');
  }

  return {
    type: 'FeatureCollection',
    features: input.features,
  };
}
