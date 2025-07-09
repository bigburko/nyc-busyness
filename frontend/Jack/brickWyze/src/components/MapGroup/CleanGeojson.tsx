// src/components/MapGroup/CleanGeojson.tsx

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

/**
 * A type representing a GeoJSON-like object that may contain non-standard
 * top-level properties alongside the required 'type' and 'features'.
 */
// FIX: Add the 'export' keyword here to make this type available for import
export type PotentiallyNonStandardFeatureCollection = {
  type: 'FeatureCollection';
  features: Feature<Geometry, GeoJsonProperties>[];
  // Using `unknown` is safer than `any` as it forces type checking
  [key: string]: unknown;
};

/**
 * Strips non-standard keys like `name` and `crs`, returning a clean FeatureCollection.
 */
export function CleanGeojson(
  input: PotentiallyNonStandardFeatureCollection
): FeatureCollection<Geometry, GeoJsonProperties> {
  // Runtime validation is still valuable for inputs that don't match the shape
  if (input?.type !== 'FeatureCollection' || !Array.isArray(input?.features)) {
    throw new Error('Invalid GeoJSON: missing "FeatureCollection" type or "features" array');
  }

  // Create a new object with only the standard properties
  return {
    type: 'FeatureCollection',
    features: input.features,
  };
}
