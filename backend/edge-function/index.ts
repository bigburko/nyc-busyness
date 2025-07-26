import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequestBody } from './validation.ts';
import { fetchAllData, validateDatabaseData } from './data-processing.ts';
import { calculateDemographicPercentages, findMaxPercentages } from './demographic-scoring.ts';
import { processZones, addCrimeDataToTopZones, addFootTrafficDataToTopZones } from './scoring-helpers.ts';
import { getSampleEntries } from './utils.ts';
// Enhanced CORS headers for better compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
serve(async (req)=>{
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', {
      headers: corsHeaders,
      status: 200
    });
  }
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log(`Method not allowed: ${req.method}`);
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 405
    });
  }
  try {
    console.log('Processing resilience calculation request');
    // Parse and validate request body
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    const validatedInput = validateRequestBody(body);
    console.log('Validated input:', {
      weights: validatedInput.weights.map((w)=>`${w.id}: ${w.value}%`),
      ethnicities: validatedInput.ethnicities,
      genders: validatedInput.genders,
      ageRange: validatedInput.ageRange,
      incomeRange: validatedInput.incomeRange,
      rentRange: validatedInput.rentRange,
      timePeriods: validatedInput.timePeriods,
      hasDemographicScoring: !!validatedInput.demographicScoring,
      demographicScoringWeights: validatedInput.demographicScoring?.weights
    });
    // Check if demographic weight is being processed correctly
    const demographicWeightInEdge = validatedInput.weights?.find((w)=>w.id === 'demographic')?.value;
    console.log('Demographic weight value:', demographicWeightInEdge);
    if (demographicWeightInEdge === 100) {
      console.log('Demographic weight is 100% - should prioritize demographic scoring');
      console.log('Ethnicity filters:', validatedInput.ethnicities);
      console.log('Demographic scoring weights:', validatedInput.demographicScoring?.weights);
    }
    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(JSON.stringify({
        error: 'Server configuration error - missing database credentials'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Fetch all required data
    console.log('Fetching database data...');
    const databaseData = await fetchAllData(supabase);
    // Validate that we have the minimum required data
    if (!validateDatabaseData(databaseData)) {
      console.error('Insufficient database data');
      return new Response(JSON.stringify({
        error: 'Insufficient database data available'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    const { zones, ethnicityData, demographicsData, incomeData } = databaseData;
    if (!zones || zones.length === 0) {
      console.log('No zones available');
      return new Response(JSON.stringify({
        zones: [],
        total_zones_found: 0,
        message: 'No zones available'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }
    console.log(`Processing ${zones.length} zones.`);
    // Calculate demographic percentages for all zones
    const percentageResults = calculateDemographicPercentages(validatedInput, ethnicityData, demographicsData, incomeData);
    const ethnicPercent = percentageResults.ethnicPercent || {};
    const genderPercent = percentageResults.genderPercent || {};
    const agePercent = percentageResults.agePercent || {};
    const incomePercent = percentageResults.incomePercent || {};
    // Enhanced debug: Log demographic calculation results for ethnicity priority
    if (demographicWeightInEdge === 100 && validatedInput.ethnicities.length > 0) {
      console.log('Demographic percentage calculation (ethnicity priority):', {
        ethnicitiesRequested: validatedInput.ethnicities,
        sampleEthnicityPercentages: Object.fromEntries(Object.entries(ethnicPercent).slice(0, 5).map(([geoid, pct])=>[
            geoid,
            `${(typeof pct === 'number' ? pct * 100 : 0).toFixed(1)}%`
          ])),
        totalZonesWithEthnicityData: Object.keys(ethnicPercent).length
      });
    }
    // Find max percentages for normalization
    const maxPercentageResults = findMaxPercentages(ethnicPercent, genderPercent, agePercent, incomePercent);
    const maxEthnicPct = maxPercentageResults.maxEthnicPct || 1;
    const maxGenderPct = maxPercentageResults.maxGenderPct || 1;
    const maxAgePct = maxPercentageResults.maxAgePct || 1;
    const maxIncomePct = maxPercentageResults.maxIncomePct || 1;
    // Process zones with enhanced demographic scoring
    const processedZones = await processZones(zones, validatedInput, {
      ethnicPercent,
      genderPercent,
      agePercent,
      incomePercent
    }, {
      maxEthnicPct,
      maxGenderPct,
      maxAgePct,
      maxIncomePct
    }, demographicsData, incomeData, supabase);
    // Sort by custom_score and take only top N% as requested
    processedZones.sort((a, b)=>b.custom_score - a.custom_score);
    const topCount = Math.ceil(processedZones.length * (validatedInput.topN / 100));
    const topZones = processedZones.slice(0, topCount);
    console.log(`Top ${topCount} zones: scores range from ${topZones[0]?.custom_score} to ${topZones[topZones.length - 1]?.custom_score}`);
    // Enhanced debug: Log top zones for demographic priority requests
    if (demographicWeightInEdge === 100 && topZones.length > 0) {
      console.log('Top 5 zones for demographic priority:', topZones.slice(0, 5).map((zone)=>({
          geoid: zone.geoid,
          tract_name: zone.tract_name,
          custom_score: zone.custom_score.toFixed(1),
          demographic_score: zone.demographic_score?.toFixed(1),
          demographic_match_pct: zone.demographic_match_pct?.toFixed(1) + '%',
          ethnicity_match: zone.demographic_match_pct
        })));
    }
    // Add crime data to top zones only (performance optimization)
    await addCrimeDataToTopZones(supabase, topZones, validatedInput.crimeYears);
    // Add foot traffic data to top zones with time period filtering
    await addFootTrafficDataToTopZones(supabase, topZones, validatedInput.timePeriods);
    // Create enhanced debug information
    const debugInfo = createDebugInfo(validatedInput, zones, processedZones, {
      ethnicPercent,
      genderPercent,
      agePercent,
      incomePercent
    });
    console.log(`Final response: ${topZones.length} zones with scores ranging ${topZones[0]?.custom_score}-${topZones[topZones.length - 1]?.custom_score}`);
    // Return enhanced response with CORS headers
    return new Response(JSON.stringify({
      zones: topZones,
      total_zones_found: processedZones.length,
      top_zones_returned: topZones.length,
      top_percentage: validatedInput.topN,
      demographic_scoring_applied: !!validatedInput.demographicScoring,
      foot_traffic_periods_used: validatedInput.timePeriods,
      debug: debugInfo
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
// Helper function to create enhanced debug information
function createDebugInfo(validatedInput, zones, processedZones, percentages) {
  const watched = [
    '36061019500',
    '36061019100',
    '36061018700',
    '36061019300',
    '36061018900',
    '36061018500'
  ];
  const watchedRents = zones.filter((z)=>watched.includes(z.GEOID)).map((z)=>({
      GEOID: z.GEOID,
      avg_rent: z.avg_rent,
      passed: z.avg_rent == null || z.avg_rent >= validatedInput.rentRange[0] && z.avg_rent <= validatedInput.rentRange[1]
    }));
  const filteredZones = zones.filter((z)=>z.avg_rent == null || z.avg_rent >= validatedInput.rentRange[0] && z.avg_rent <= validatedInput.rentRange[1] || watched.includes(z.GEOID));
  const filteredOutWatched = watched.filter((id)=>!filteredZones.some((z)=>z.GEOID === id));
  return {
    received_ethnicities: validatedInput.ethnicities,
    received_genders: validatedInput.genders,
    received_age_range: validatedInput.ageRange,
    received_income_range: validatedInput.incomeRange,
    received_top_n: validatedInput.topN,
    received_crime_years: validatedInput.crimeYears,
    received_time_periods: validatedInput.timePeriods,
    received_demographic_scoring: validatedInput.demographicScoring,
    received_weights: validatedInput.weights.map((w)=>`${w.id}: ${w.value}%`),
    // Weight analysis
    demographic_weight_detected: validatedInput.weights.find((w)=>w.id === 'demographic')?.value || 0,
    is_single_factor_request: validatedInput.weights.find((w)=>w.id === 'demographic')?.value === 100,
    // Filter analysis
    has_ethnicity_filters: validatedInput.ethnicities.length > 0,
    has_demographic_scoring: !!validatedInput.demographicScoring,
    watched_rents: watchedRents,
    filtered_out_watched: filteredOutWatched,
    sample_demo_scores: getSampleEntries(percentages.ethnicPercent),
    sample_gender_scores: getSampleEntries(percentages.genderPercent),
    sample_age_scores: getSampleEntries(percentages.agePercent),
    sample_income_scores: getSampleEntries(percentages.incomePercent)
  };
}
