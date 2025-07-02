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
  GeometryCollection,
} from 'geojson';

/**
 * Type guard: checks if a geometry is coordinate-based (not a GeometryCollection)
 */
function isCoordinateGeometry(
  geom: Geometry
): geom is Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon {
  return (geom as any).coordinates !== undefined;
}

function roundCoord(num: number, precision: number): number {
  return parseFloat(num.toFixed(precision));
}

function roundCoords(coords: any, precision: number): any {
  if (typeof coords[0] === 'number') {
    return coords.map((n: number) => roundCoord(n, precision));
  }
  return coords.map((c: any) => roundCoords(c, precision));
}

export function ProcessGeojson(
  raw: FeatureCollection,
  options?: {
    precision?: number;
  }
): FeatureCollection {
  const precision = options?.precision ?? 6;

  const cleanFeatures = raw.features.map((feature) => {
    const { geometry } = feature;

    if (geometry && isCoordinateGeometry(geometry)) {
      return {
        ...feature,
        geometry: {
          ...geometry,
          coordinates: roundCoords(geometry.coordinates, precision),
        },
      } as Feature;
    }

    // For GeometryCollection or null geometry, return as-is
    return feature;
  });

  return {
    ...raw,
    features: cleanFeatures,
  };
}
