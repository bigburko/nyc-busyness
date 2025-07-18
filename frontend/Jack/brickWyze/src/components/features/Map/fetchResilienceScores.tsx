// src/components/features/Map/fetchResilienceScores.tsx - Updated to properly pass weights

import { DemographicScoring } from '../../../stores/filterStore';

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
  // Crime timeline data
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
  // Crime trend analysis data
  main_crime_score?: number;
  crime_trend_direction?: string;
  crime_trend_change?: string;
  // Individual score components
  foot_traffic_score?: number;
  crime_score?: number;
  flood_risk_score?: number;
  rent_score?: number;
  poi_score?: number;
  avg_rent?: number;
  // Location data
  tract_name?: string;
  display_name?: string;
  nta_name?: string;
  [key: string]: number | string | undefined | object;
};

interface FetchParams {
  // 🔧 FIXED: Properly type weights to match what edge function expects
  weights?: Array<{ id: string; value: number }>;
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  demographicScoring?: DemographicScoring;
}

export async function fetchResilienceScores({
  weights = [],
  rentRange = [0, Infinity],
  selectedEthnicities = [],
  selectedGenders = [],
  ageRange = [0, 100],
  incomeRange = [0, 250000],
  demographicScoring,
}: FetchParams) {
  // Environment check
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('🔑 [fetchResilienceScores] Environment check:', {
    hasAnonKey: !!anonKey,
    keyPrefix: anonKey?.substring(0, 20) + '...',
    keyLength: anonKey?.length,
    nodeEnv: process.env.NODE_ENV
  });

  if (!anonKey) {
    console.error('❌ [fetchResilienceScores] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('❌ Missing Supabase anon key - check your .env.local file');
  }

  // 🔧 FIXED: Properly format weights for edge function
  const requestBody = {
    weights: weights.map(w => ({ id: w.id, value: w.value })), // Ensure proper format
    rentRange,
    ethnicities: selectedEthnicities,
    genders: selectedGenders,
    ageRange,
    incomeRange,
    crimeYears: [
      'year_2021',
      'year_2022', 
      'year_2023',
      'year_2024',
      'pred_2025',
      'pred_2026',
      'pred_2027'
    ],
    // Send demographic scoring to backend
    ...(demographicScoring && {
      demographicScoring: {
        weights: demographicScoring.weights,
        thresholdBonuses: demographicScoring.thresholdBonuses,
        penalties: demographicScoring.penalties
      }
    })
  };

  // Enhanced debug logging
  console.log('🚀 [fetchResilienceScores] Sending weights to edge function:', {
    url: 'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
    method: 'POST',
    hasAuth: !!anonKey,
    authHeaderLength: anonKey?.length,
    requestBodySize: JSON.stringify(requestBody).length,
    weights: weights.map(w => `${w.id}: ${w.value}%`),
    hasDemographicScoring: !!demographicScoring,
    demographicScoringData: demographicScoring ? {
      weights: demographicScoring.weights,
      bonusesCount: demographicScoring.thresholdBonuses?.length || 0,
      penaltiesCount: demographicScoring.penalties?.length || 0,
      hasReasoning: !!demographicScoring.reasoning
    } : null,
    filters: {
      weightsCount: weights.length,
      ethnicitiesCount: selectedEthnicities.length,
      gendersCount: selectedGenders.length,
      rentRange,
      ageRange,
      incomeRange
    }
  });

  try {
    console.log('📡 [fetchResilienceScores] Making fetch request...');
    
    const res = await fetch(
      'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('📡 [fetchResilienceScores] Fetch response received:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: {
        contentType: res.headers.get('content-type'),
        contentLength: res.headers.get('content-length')
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [fetchResilienceScores] Server error details:', {
        status: res.status,
        statusText: res.statusText,
        errorText,
        headers: Array.from(res.headers.entries())
      });
      
      // Specific error messages
      if (res.status === 401) {
        throw new Error(`Authentication failed (401). Check your NEXT_PUBLIC_SUPABASE_ANON_KEY. Error: ${errorText}`);
      } else if (res.status === 404) {
        throw new Error(`Edge Function not found (404). Check if 'calculate-resilience' is deployed. Error: ${errorText}`);
      } else if (res.status >= 500) {
        throw new Error(`Server error (${res.status}). Edge Function may have crashed. Error: ${errorText}`);
      } else {
        throw new Error(`Request failed (${res.status}): ${errorText}`);
      }
    }

    console.log('📦 [fetchResilienceScores] Parsing JSON response...');
    const result = await res.json();
    
    // Enhanced response logging
    console.log('📥 [fetchResilienceScores] Received weighted results from backend:', {
      success: true,
      zones_count: result.zones?.length || 0,
      demographic_scoring_applied: result.demographic_scoring_applied,
      total_zones_found: result.total_zones_found,
      top_zones_returned: result.top_zones_returned,
      sample_zone: result.zones?.[0] ? {
        geoid: result.zones[0].geoid,
        custom_score: result.zones[0].custom_score, // This is the final weighted score
        demographic_score: result.zones[0].demographic_score,
        combined_match_pct: result.zones[0].combined_match_pct,
        tract_name: result.zones[0].tract_name
      } : null,
      architecture_note: 'Edge function applied weights and returned final scores',
      debug_info: {
        received_demographic_scoring: result.debug?.received_demographic_scoring ? 'Yes' : 'No',
        received_ethnicities_count: result.debug?.received_ethnicities?.length || 0,
        received_genders_count: result.debug?.received_genders?.length || 0
      }
    });
    
    if (!result.zones || !Array.isArray(result.zones)) {
      console.warn('⚠️ [fetchResilienceScores] Unexpected response format:', result);
      throw new Error('Invalid response format: missing zones array');
    }

    if (result.zones.length === 0) {
      console.warn('⚠️ [fetchResilienceScores] No zones returned from backend');
    }
    
    return result.zones as ResilienceScore[];

  } catch (error) {
    // Enhanced error handling
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🌐 [fetchResilienceScores] Network error - possible causes:', {
        error: error.message,
        possibleCauses: [
          'No internet connection',
          'Supabase Edge Function is down',
          'CORS policy blocking request',
          'URL is incorrect',
          'Local firewall/antivirus blocking request'
        ],
        troubleshooting: [
          'Check internet connection',
          'Verify Supabase project status',
          'Test Edge Function in Supabase dashboard',
          'Check browser console for CORS errors'
        ]
      });
      throw new Error('Network error: Unable to connect to Supabase Edge Function. Check your internet connection and try again.');
    }
    
    console.error('❌ [fetchResilienceScores] Unexpected error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unexpected error in fetchResilienceScores: ${error}`);
    }
  }
}