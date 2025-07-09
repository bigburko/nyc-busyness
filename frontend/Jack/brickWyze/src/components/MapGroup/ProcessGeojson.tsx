// src/utils/processGeojson.ts

import type {
  FeatureCollection,
  Feature,
  Geometry,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
} from 'geojson';

/**
 * Type guard: checks if a geometry is coordinate-based (not a GeometryCollection)
 */
function isCoordinateGeometry(
  geom: Geometry
): geom is Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon {
  return 'coordinates' in geom;
}

function roundCoord(num: number, precision: number): number {
  return parseFloat(num.toFixed(precision));
}

function roundCoords(coords: unknown, precision: number): unknown {
  if (Array.isArray(coords)) {
    if (typeof coords[0] === 'number') {
      return (coords as number[]).map((n) => roundCoord(n, precision));
    }
    return coords.map((c) => roundCoords(c, precision));
  }
  return coords;
}

export function ProcessGeojson(
  raw: FeatureCollection<Geometry, GeoJsonProperties>,
  options?: {
    precision?: number;
  }
): FeatureCollection<Geometry, GeoJsonProperties> {
  const precision = options?.precision ?? 6;

  const cleanFeatures = raw.features.map((feature): Feature<Geometry, GeoJsonProperties> => {
    const { geometry } = feature;

    if (geometry && isCoordinateGeometry(geometry)) {
      return {
        ...feature,
        geometry: {
          ...geometry,
          coordinates: roundCoords(geometry.coordinates, precision),
        } as Geometry,
      };
    }

    // For GeometryCollection or null geometry, return as-is
    return feature;
  });

  return {
    ...raw,
    features: cleanFeatures,
  };
}
