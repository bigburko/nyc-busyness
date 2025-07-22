// src/components/features/Map/fetchResilienceScores.tsx - FIXED for TopNSelector and Time Periods

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

// ✅ FIXED: Add interface for full edge function response
export interface EdgeFunctionResponse {
  zones: ResilienceScore[];
  total_zones_found: number;
  top_zones_returned: number;
  top_percentage: number;
  demographic_scoring_applied?: boolean;
  foot_traffic_periods_used?: string[]; // 🆕 ADDED: Track which time periods were used
  debug?: {
    received_ethnicities?: string[];
    received_demographic_scoring?: unknown;
    demographic_weight_detected?: number;
    is_single_factor_request?: boolean;
    has_ethnicity_filters?: boolean;
    has_demographic_scoring?: boolean;
    sample_demo_scores?: unknown;
    received_weights?: unknown;
    received_genders?: string[];
    received_time_periods?: string[]; // 🆕 ADDED: Debug info for time periods
  };
}

interface FetchParams {
  // 🔧 FIXED: Properly type weights to match what edge function expects
  weights?: Array<{ id: string; value: number }>;
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[]; // 🆕 ADDED: Time periods parameter
  ageRange?: [number, number];
  incomeRange?: [number, number];
  topN?: number; // ✅ FIXED: Add topN parameter
  demographicScoring?: DemographicScoring;
}

// Define proper interfaces for filter structures
interface WeightItem {
  id: string;
  value: number;
  label?: string;
  icon?: string;
  color?: string;
}

interface FilterData {
  weights?: WeightItem[];
  selectedEthnicities?: string[];
  demographicScoring?: DemographicScoring;
}

// 🆕 NEW: Weight integrity check function - RELAXED validation
const checkWeightIntegrity = (filters: FilterData): boolean => {
  console.log('🔍 [WEIGHT INTEGRITY CHECK]');
  console.log('- Weights array:', filters.weights);
  console.log('- Demographic weight value:', filters.weights?.find((w: WeightItem) => w.id === 'demographic')?.value || 'NOT FOUND');
  console.log('- DemographicScoring object:', filters.demographicScoring);
  console.log('- Selected ethnicities:', filters.selectedEthnicities);
  
  // 🔧 FIXED: Relaxed validation - allow any weight distribution
  const demographicWeight = filters.weights?.find((w: WeightItem) => w.id === 'demographic')?.value;
  const hasEthnicityFilter = filters.selectedEthnicities?.length && filters.selectedEthnicities.length > 0;
  
  if (hasEthnicityFilter && demographicWeight && demographicWeight > 0) {
    console.log(`✅ [WEIGHT CHECK] Ethnicity selected with ${demographicWeight}% demographic weight - this is fine!`);
    return true;
  } else if (hasEthnicityFilter && (!demographicWeight || demographicWeight === 0)) {
    console.warn('⚠️ [WEIGHT WARNING] Ethnicity selected but no demographic weight - results may not reflect ethnicity preference');
    return true; // Allow it, just warn
  }
  
  console.log('✅ [WEIGHT CHECK] No ethnicity filters or standard weight distribution');
  return true;
};

// 🆕 NEW: Ensure demographic weight validation - RELAXED approach
const validateAndFixPayload = (filters: FilterData): FilterData => {
  // Deep clone to avoid mutations
  const fixedFilters: FilterData = JSON.parse(JSON.stringify(filters));
  
  // 🔧 FIXED: Only add demographic weight if completely missing, don't force 100%
  if (fixedFilters.selectedEthnicities?.length && fixedFilters.selectedEthnicities.length > 0) {
    const demographicWeight = fixedFilters.weights?.find((w: WeightItem) => w.id === 'demographic');
    
    if (!demographicWeight) {
      console.warn('⚠️ [PAYLOAD FIX] Adding missing demographic weight (20% default)');
      fixedFilters.weights = [
        ...(fixedFilters.weights || []),
        {
          id: 'demographic',
          value: 20, // Default to 20% instead of forcing 100%
          label: 'Demographic Match',
          icon: '👨‍👩‍👧‍👦',
          color: '#34A853'
        }
      ];
    }
    // 🔧 REMOVED: No longer force demographic weight to 100%
    // Users can have mixed weights like 40% demographic, 40% foot traffic, 20% rent
    console.log(`✅ [PAYLOAD] Allowing ${demographicWeight?.value || 20}% demographic weight with ethnicity filters`);
  }
  
  return fixedFilters;
};

// ✅ FIXED: Return full edge function response instead of just zones
export async function fetchResilienceScores({
  weights = [],
  rentRange = [0, Infinity],
  selectedEthnicities = [],
  selectedGenders = [],
  selectedTimePeriods = ['morning', 'afternoon', 'evening'], // 🆕 ADDED: Time periods with default
  ageRange = [0, 100],
  incomeRange = [0, 250000],
  topN = 10, // ✅ FIXED: Add topN parameter with default
  demographicScoring,
}: FetchParams): Promise<EdgeFunctionResponse> { // ✅ FIXED: Return full response
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

  // Create initial payload
  const initialFilters: FilterData = {
    weights: weights.map(w => ({ id: w.id, value: w.value })),
    selectedEthnicities,
    demographicScoring
  };

  // Run integrity check
  const integrityPassed = checkWeightIntegrity(initialFilters);
  
  // Validate and fix payload if needed
  const validatedFilters = validateAndFixPayload(initialFilters);
  
  // 🔧 FIXED: Include topN and timePeriods in request body
  const requestBody = {
    weights: validatedFilters.weights?.map((w: WeightItem) => ({ id: w.id, value: w.value })) || [],
    rentRange: rentRange,
    ethnicities: selectedEthnicities,
    genders: selectedGenders,
    timePeriods: selectedTimePeriods, // 🆕 ADDED: Include time periods in request
    ageRange: ageRange,
    incomeRange: incomeRange,
    topN: topN, // ✅ FIXED: Include topN parameter
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

  // 🎯 ENHANCED DEBUG LOGGING
  console.log('🚀 [FETCH DEBUG] Complete payload being sent to edge function:', {
    url: 'https://kwuwuutcvpdomfivdemt.supabase.co/functions/v1/calculate-resilience',
    method: 'POST',
    hasAuth: !!anonKey,
    authHeaderLength: anonKey?.length,
    requestBodySize: JSON.stringify(requestBody).length,
    integrityPassed,
    topN: requestBody.topN, // ✅ FIXED: Log topN
    timePeriods: requestBody.timePeriods, // 🆕 ADDED: Log time periods
    payload: requestBody
  });

  // Special logging for demographic weight scenarios
  const demographicWeight = requestBody.weights?.find((w: { id: string; value: number }) => w.id === 'demographic')?.value;
  if (demographicWeight && demographicWeight > 0) {
    console.log('🎯 [FETCH DEBUG] DEMOGRAPHIC WEIGHT REQUEST DETECTED:', {
      demographicWeight: `${demographicWeight}%`,
      ethnicities: requestBody.ethnicities,
      genders: requestBody.genders,
      timePeriods: requestBody.timePeriods, // 🆕 ADDED: Include time periods in debug
      topN: requestBody.topN, // ✅ FIXED: Include topN in debug
      demographicScoring: requestBody.demographicScoring?.weights,
      expectedBehavior: `Edge function should weight demographic scoring at ${demographicWeight}%`
    });
  }

  // 🆕 ADDED: Special logging for time period scenarios
  if (selectedTimePeriods.length < 3) {
    console.log('🕐 [FETCH DEBUG] PARTIAL TIME PERIODS SELECTED:', {
      selectedPeriods: selectedTimePeriods,
      periodsCount: selectedTimePeriods.length,
      expectedBehavior: `Edge function should only use ${selectedTimePeriods.join(' + ')} data and average them`
    });
  }

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
    const data = await res.json() as EdgeFunctionResponse; // ✅ FIXED: Type as full response
    
    // 🔍 ENHANCED DEBUGGING: Log complete edge function response
    console.log('🔬 [EDGE FUNCTION DEBUG] Complete raw response:', JSON.stringify(data, null, 2));

    // ✅ FIXED: Log topN response data
    console.log('📊 [FETCH DEBUG] TopN Response Analysis:', {
      requested_topN: requestBody.topN,
      total_zones_found: data.total_zones_found,
      top_zones_returned: data.top_zones_returned,
      top_percentage: data.top_percentage,
      expected_zones: data.total_zones_found ? Math.ceil(data.total_zones_found * (requestBody.topN / 100)) : 'N/A',
      topN_working: data.top_zones_returned === Math.ceil((data.total_zones_found || 0) * (requestBody.topN / 100))
    });

    // 🆕 ADDED: Log time periods response data
    console.log('🕐 [FETCH DEBUG] Time Periods Response Analysis:', {
      requested_periods: requestBody.timePeriods,
      periods_used_by_edge: data.foot_traffic_periods_used,
      periods_match: JSON.stringify(requestBody.timePeriods?.sort()) === JSON.stringify(data.foot_traffic_periods_used?.sort()),
      expectedBehavior: requestBody.timePeriods.length < 3 ? 'Should average only selected periods' : 'Should use all periods'
    });

    // 🔍 Log the debug info that edge function should return
    if (data.debug) {
      console.log('🔬 [EDGE FUNCTION DEBUG] Edge function debug info:', {
        received_ethnicities: data.debug.received_ethnicities,
        received_demographic_scoring: data.debug.received_demographic_scoring,
        received_time_periods: data.debug.received_time_periods, // 🆕 ADDED: Debug time periods
        demographic_weight_detected: data.debug.demographic_weight_detected,
        is_single_factor_request: data.debug.is_single_factor_request,
        has_ethnicity_filters: data.debug.has_ethnicity_filters,
        has_demographic_scoring: data.debug.has_demographic_scoring,
        sample_demo_scores: data.debug.sample_demo_scores,
      });
    } else {
      console.error('❌ [EDGE FUNCTION DEBUG] No debug info returned from edge function!');
    }

    // 🔍 ENHANCED: Log first 5 zones with all demographic data
    if (data.zones && data.zones.length > 0) {
      console.log('🧬 [EDGE FUNCTION DEBUG] First 5 zones detailed analysis:');
      data.zones.slice(0, 5).forEach((zone: ResilienceScore, index: number) => {
        console.log(`🧬 [Zone ${index + 1}] ${zone.geoid}:`, {
          tract_name: zone.tract_name,
          custom_score: zone.custom_score,
          demographic_score: zone.demographic_score || 0,
          demographic_match_pct: zone.demographic_match_pct || 0,
          combined_match_pct: zone.combined_match_pct || 0,
          foot_traffic_score: zone.foot_traffic_score || 0, // 🆕 ADDED: Log foot traffic scores
          ethnicity_match: (zone.demographic_match_pct) || 0,
          // Check if ANY demographic scores exist
          hasAnyDemographicData: !!(zone.demographic_score || zone.demographic_match_pct || zone.combined_match_pct)
        });
      });
      
      // 🔍 Check if ANY zone has demographic data
      const zonesWithDemographicData = data.zones.filter((zone: ResilienceScore) => 
        (zone.demographic_score || 0) > 0 || 
        (zone.demographic_match_pct || 0) > 0 || 
        (zone.combined_match_pct || 0) > 0
      );
      
      console.log(`🧬 [EDGE FUNCTION DEBUG] Zones with demographic data: ${zonesWithDemographicData.length}/${data.zones.length}`);
      
      if (zonesWithDemographicData.length === 0) {
        console.error('❌ [EDGE FUNCTION DEBUG] NO ZONES HAVE DEMOGRAPHIC DATA! Edge function ethnicity calculation failed.');
        console.log('🔍 [EDGE FUNCTION DEBUG] This suggests:');
        console.log('   1. Korean column mapping still wrong in edge function');
        console.log('   2. Edge function not using updated demographic-scoring.ts');
        console.log('   3. Database query failing');
        console.log('   4. Demographic scoring not being applied');
      } else {
        console.log('✅ [EDGE FUNCTION DEBUG] Some zones have demographic data - edge function working partially');
      }
    }

    // 🔍 ENHANCED: Log exactly what we sent vs what we got back
    const sentEthnicities = requestBody.ethnicities;
    const receivedEthnicities = data.debug?.received_ethnicities;
    const sentTimePeriods = requestBody.timePeriods; // 🆕 ADDED: Time periods comparison
    const receivedTimePeriods = data.debug?.received_time_periods;
    
    console.log('🔄 [PAYLOAD COMPARISON]', {
      sent_ethnicities: sentEthnicities,
      received_ethnicities: receivedEthnicities,
      ethnicity_match: JSON.stringify(sentEthnicities) === JSON.stringify(receivedEthnicities),
      sent_time_periods: sentTimePeriods, // 🆕 ADDED: Time periods comparison
      received_time_periods: receivedTimePeriods,
      time_periods_match: JSON.stringify(sentTimePeriods?.sort()) === JSON.stringify(receivedTimePeriods?.sort()),
      sent_demographic_weight: requestBody.weights.find((w: { id: string; value: number }) => w.id === 'demographic')?.value,
      received_demographic_weight: data.debug?.demographic_weight_detected,
      demographic_weight_match: requestBody.weights.find((w: { id: string; value: number }) => w.id === 'demographic')?.value === data.debug?.demographic_weight_detected,
      sent_topN: requestBody.topN, // ✅ FIXED: Include topN comparison
      received_topN: data.top_percentage
    });

    // 🔍 Add specific Korean debugging
    if (sentEthnicities && sentEthnicities.includes('AEAKrn')) {
      console.log('🇰🇷 [KOREAN DEBUG] Korean ethnicity properly sent to edge function');
      console.log('🇰🇷 [KOREAN DEBUG] Expected: Edge function should find Korean column "AEAKrn" in tract_race_ethnicity table');
      console.log('🇰🇷 [KOREAN DEBUG] Expected: Some Manhattan/Queens tracts should show 5-15% Korean population');
    }

    // 🆕 ADDED: Specific time period debugging
    if (sentTimePeriods && sentTimePeriods.length < 3) {
      console.log('🕐 [TIME PERIOD DEBUG] Partial time periods properly sent to edge function');
      console.log('🕐 [TIME PERIOD DEBUG] Expected: Edge function should only use selected periods for foot traffic calculation');
      console.log('🕐 [TIME PERIOD DEBUG] Expected: foot_traffic_periods_used should match selected periods');
    }
    
    // 🎯 ENHANCED RESPONSE LOGGING
    console.log('📥 [fetchResilienceScores] Received weighted results from backend:', {
      success: true,
      zones_count: data.zones?.length || 0,
      demographic_scoring_applied: data.demographic_scoring_applied,
      foot_traffic_periods_used: data.foot_traffic_periods_used, // 🆕 ADDED: Log periods used
      total_zones_found: data.total_zones_found,
      top_zones_returned: data.top_zones_returned,
      top_percentage: data.top_percentage, // ✅ FIXED: Log topN response
      sample_zone: data.zones?.[0] ? {
        geoid: data.zones[0].geoid,
        custom_score: data.zones[0].custom_score,
        demographic_score: data.zones[0].demographic_score || 0,
        foot_traffic_score: data.zones[0].foot_traffic_score || 0, // 🆕 ADDED: Log foot traffic score
        combined_match_pct: data.zones[0].combined_match_pct || 0,
        tract_name: data.zones[0].tract_name,
        demographic_match_pct: data.zones[0].demographic_match_pct || 0
      } : null,
      architecture_note: 'Edge function applied weights and returned final scores',
      debug_info: {
        received_demographic_scoring: data.debug?.received_demographic_scoring ? 'Yes' : 'No',
        received_ethnicities_count: data.debug?.received_ethnicities?.length || 0,
        received_genders_count: data.debug?.received_genders?.length || 0,
        received_time_periods_count: data.debug?.received_time_periods?.length || 0, // 🆕 ADDED: Time periods count
        received_weights: data.debug?.received_weights || 'Not provided'
      }
    });

    // Special validation for demographic requests
    if (demographicWeight && demographicWeight > 0 && data.zones?.length && data.zones.length > 0) {
      const topZone = data.zones[0];
      console.log('🧬 [FETCH DEBUG] Demographic weight validation:', {
        topZone: topZone.geoid,
        demographicWeight: `${demographicWeight}%`,
        demographicScore: topZone.demographic_score || 0,
        customScore: topZone.custom_score,
        demographicMatchPct: topZone.demographic_match_pct || 0,
        isCorrectlyWeighted: (topZone.demographic_score || 0) > 0 || (topZone.demographic_match_pct || 0) > 0
      });
    }

    // 🆕 ADDED: Special validation for time period requests
    if (selectedTimePeriods.length < 3 && data.zones?.length && data.zones.length > 0) {
      console.log('🕐 [FETCH DEBUG] Time period filtering validation:', {
        requestedPeriods: selectedTimePeriods,
        periodsUsedByEdge: data.foot_traffic_periods_used,
        periodsMatch: JSON.stringify(selectedTimePeriods.sort()) === JSON.stringify(data.foot_traffic_periods_used?.sort()),
        topZoneFootTraffic: data.zones[0].foot_traffic_score || 0,
        isCorrectlyFiltered: JSON.stringify(selectedTimePeriods.sort()) === JSON.stringify(data.foot_traffic_periods_used?.sort())
      });
    }
    
    if (!data.zones || !Array.isArray(data.zones)) {
      console.warn('⚠️ [fetchResilienceScores] Unexpected response format:', data);
      throw new Error('Invalid response format: missing zones array');
    }

    if (data.zones.length === 0) {
      console.warn('⚠️ [fetchResilienceScores] No zones returned from backend');
    }
    
    // ✅ FIXED: Return the full response object instead of just zones
    return data;

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