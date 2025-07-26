// utils.ts
// Valid gender options
export const VALID_GENDERS = [
  'male',
  'female'
];
// Valid time periods for foot traffic
export const VALID_TIME_PERIODS = [
  'morning',
  'afternoon',
  'evening'
];
export const DEFAULT_TIME_PERIODS = [
  'morning',
  'afternoon',
  'evening'
];
// Default crime years to fetch
export const DEFAULT_CRIME_YEARS = [
  'year_2020',
  'year_2021',
  'year_2022',
  'year_2023',
  'year_2024',
  'pred_2025',
  'pred_2026',
  'pred_2027'
];
/**
 * Creates a JSON response with CORS headers
 */ export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400'
    },
    status
  });
}
/**
 * Gets sample entries from an object (first 5 for debugging)
 */ export function getSampleEntries(obj, count = 5) {
  if (!obj || typeof obj !== 'object') return {};
  const entries = Object.entries(obj);
  const sample = {};
  for(let i = 0; i < Math.min(count, entries.length); i++){
    const [key, value] = entries[i];
    sample[key] = value;
  }
  return sample;
}
/**
 * Gets borough name from GEOID
 */ export function getBoroughName(geoId) {
  if (!geoId || typeof geoId !== 'string') return 'Unknown';
  // NYC borough codes based on FIPS county codes
  const countyCode = geoId.substring(2, 5);
  switch(countyCode){
    case '061':
      return 'Manhattan';
    case '005':
      return 'Bronx';
    case '047':
      return 'Brooklyn';
    case '081':
      return 'Queens';
    case '085':
      return 'Staten Island';
    default:
      return 'Unknown';
  }
}
/**
 * Normalizes score to 0-100 scale
 */ export function normalizeScore(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return 0;
  }
  // Clamp to 0-100 range
  return Math.min(100, Math.max(0, Number(score)));
}
/**
 * Clamps a value between min and max
 */ export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
/**
 * Rounds a number to specified decimal places
 */ export function roundTo(value, decimals) {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
