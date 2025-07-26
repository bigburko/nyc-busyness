// src/components/features/search/types/TractTypes.ts
export interface TractResult {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  custom_score: number;
  resilience_score: number;
  avg_rent: number;
  demographic_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  main_crime_score?: number;
  
  // Crime trend properties
  crime_trend_direction?: string;
  crime_trend_change?: string;
  
  // ✅ ADDED: Foot traffic trend properties (missing from original)
  foot_traffic_trend_direction?: string;
  foot_traffic_trend_change?: string;
  
  demographic_match_pct?: number;
  gender_match_pct?: number;
  age_match_pct?: number;
  income_match_pct?: number;
  
  foot_traffic_timeline?: {
    '2019'?: number;
    '2020'?: number;
    '2021'?: number;
    '2022'?: number;
    '2023'?: number;
    '2024'?: number;
    'pred_2025'?: number;
    'pred_2026'?: number;
    'pred_2027'?: number;
  };
  foot_traffic_by_period?: {
    morning?: Record<string, number>;
    afternoon?: Record<string, number>;
    evening?: Record<string, number>;
  };
  
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
}

export interface WeightConfig {
  id: string;
  label: string;
  icon: string;
  getValue: (tract: TractResult) => number;
  color: string;
  unit?: string;
}