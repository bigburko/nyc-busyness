// src/components/MapGroup/fetchResilienceScores.tsx

export type ResilienceScore = {
  geoid: string;
  composite_score: number;
  custom_score: number;
  demographic_score?: number;
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  combined_match_pct?: number;
  // ✅ NEW: Crime timeline data that your API already provides
  crime_timeline?: {
    year_2020?: number;
    year_2021?: number;
    year_2022?: number;
    year_2023?: number;
    year_2024?: number;
    pred_2025?: number;
    pred_2026?: number;
    pred_2027?: number;
  };
  // ✅ NEW: Crime trend analysis data from your API
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  // ✅ NEW: Individual score components your API provides
  foot_traffic_score?: number;
  crime_score?: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  avg_rent?: number;
  // ✅ NEW: Better naming fields from your API
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  [key: string]: number | string | undefined | object;
};

interface FetchParams {
  // Corrected 'any[]' to 'number[]' for type safety
  weights?: number[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
}

export async function fetchResilienceScores({
  weights = [],
  rentRange = [0, Infinity],
  selectedEthnicities = [],
  selectedGenders = [],
  ageRange = [0, 100],
  incomeRange = [0, 250000],
}: FetchParams) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('❌ Missing Supabase anon key');

  const res = await fetch(
    'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        weights,
        rentRange,
        ethnicities: selectedEthnicities,
        genders: selectedGenders,
        ageRange,
        incomeRange,
        // ✅ NEW: Add crime years to include 2027 predictions
        crimeYears: [
          'year_2021',
          'year_2022', 
          'year_2023',
          'year_2024',
          'pred_2025',
          'pred_2026',
          'pred_2027'  // ✅ This was missing!
        ]
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Server error', res.status, errorText);
    throw new Error('Failed to fetch resilience scores');
  }

  // Note: res.json() returns `any`. This type assertion is the common way to handle it.
  const result = await res.json();
  return result.zones as ResilienceScore[];
}