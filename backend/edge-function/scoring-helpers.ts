// scoring-helpers.ts
import { calculateEnhancedDemographicScore } from './demographic-scoring.ts';
import { fetchCrimeData, fetchFootTrafficData } from './data-processing.ts';
import { getBoroughName, normalizeScore, clamp } from './utils.ts';

// TypeScript interfaces
interface ProcessedZone {
  geoid: string;
  tract_name: string;
  display_name: string;
  nta_name: string;
  resilience_score: number;
  custom_score: number;
  foot_traffic_score: number;
  crime_score: number;
  flood_risk_score: number;
  rent_score: number;
  poi_score: number;
  avg_rent: number | null;
  demographic_score: number;
  demographic_match_pct: number | null;
  gender_match_pct: number | null;
  age_match_pct: number | null;
  income_match_pct: number | null;
  combined_match_pct: number | null;
  data_sources: {
    crime_score_source: string;
    foot_traffic_source: string;
    crime_score_2025: number;
    foot_traffic_score_2025: number;
  };
}

// Watched zones that bypass rent filtering
const WATCHED_ZONES = [
  '36061019500',
  '36061019100',
  '36061018700',
  '36061019300',
  '36061018900',
  '36061018500'
];

// Default scoring weights
const DEFAULT_WEIGHTS = {
  foot_traffic: 0.45,
  demographic: 0.0,
  crime: 0.25,
  flood_risk: 0.15,
  rent_score: 0.10,
  poi: 0.05
};

// All available years based on actual database schema
const FOOT_TRAFFIC_YEARS = [
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  'pred_2025',
  'pred_2026',
  'pred_2027'
];

const CRIME_YEARS = [
  'year_2020',
  'year_2021',
  'year_2022',
  'year_2023',
  'year_2024',
  'pred_2025',
  'pred_2026',
  'pred_2027'
];

// Time periods available
const TIME_PERIODS = [
  'morning',
  'afternoon',
  'evening'
];

export async function processZones(
  zones: any[], 
  input: any, 
  percentages: any, 
  maxPercentages: any, 
  demographicsData: any[], 
  incomeData: any[], 
  supabase: any
): Promise<ProcessedZone[]> {
  const [minRent, maxRent] = input.rentRange;
  
  // Filter zones by rent (with watched zones exception)
  const filteredZones = zones.filter((z) =>
    z.avg_rent == null || 
    (z.avg_rent >= minRent && z.avg_rent <= maxRent) || 
    WATCHED_ZONES.includes(z.GEOID)
  );

  // Handle weight redistribution
  const finalWeights = {
    ...DEFAULT_WEIGHTS
  };
  
  for (const weight of input.weights) {
    finalWeights[weight.id] = (weight.value || 0) / 100;
  }

  const hasDemographicFilters = 
    input.ethnicities.length > 0 || 
    input.genders.length > 0 || 
    (input.ageRange && !isDefaultRange(input.ageRange, [0, 100])) || 
    (input.incomeRange && !isDefaultRange(input.incomeRange, [0, 250000]));

  if (!hasDemographicFilters && finalWeights.demographic > 0) {
    console.log('No demographic filters - redistributing demographic weight');
    const demographicWeight = finalWeights.demographic;
    finalWeights.demographic = 0;
    
    const otherFactors = ['foot_traffic', 'crime', 'flood_risk', 'rent_score', 'poi'];
    const totalOtherWeight = otherFactors.reduce((sum, factor) => sum + finalWeights[factor], 0);
    
    if (totalOtherWeight > 0) {
      for (const factor of otherFactors) {
        const redistribution = (finalWeights[factor] / totalOtherWeight) * demographicWeight;
        finalWeights[factor] += redistribution;
      }
    }
  }

  // Fetch 2025 prediction data for ALL zones (for accurate ranking)
  console.log('Fetching 2025 prediction data for accurate scoring...');
  const allGeoIds = filteredZones.map((z) => z.GEOID);
  
  const [crimeData2025, footTrafficData2025] = await Promise.allSettled([
    fetchCrimeData(supabase, allGeoIds),
    fetchFootTrafficData(supabase, allGeoIds)
  ]);

  const crime2025 = crimeData2025.status === 'fulfilled' ? crimeData2025.value : null;
  const footTraffic2025 = footTrafficData2025.status === 'fulfilled' ? footTrafficData2025.value : null;

  console.log(`Using 2025 predictions: Crime=${crime2025?.length || 0}, FootTraffic=${footTraffic2025?.length || 0} zones`);

  const processedZones: ProcessedZone[] = [];

  for (const zone of filteredZones) {
    const geoId = zone.GEOID;

    // Calculate enhanced demographic score
    const combined_match_pct = hasDemographicFilters ? 
      calculateEnhancedDemographicScore(geoId, input, percentages, maxPercentages) : 0;

    // Get 2025 crime prediction (fallback to resilience_zones if not available)
    const crime2025Info = crime2025?.find((c) => c.GEOID === geoId);
    const crime_score_2025 = crime2025Info?.pred_2025 || zone.crime_score || 0;

    // Get 2025 foot traffic prediction using optimized database columns
    const footTraffic2025Info = footTraffic2025?.find((ft) => ft.GEOID === geoId);
    const foot_traffic_score_2025 = footTraffic2025Info ? 
      calculateOptimizedFootTrafficScore(footTraffic2025Info, input.timePeriods, 'pred_2025') : 
      zone.foot_traffic_score || 0;

    // Convert 2025 predictions to 0-100 scale
    const resilience_score = normalizeScore((zone.resilience_score || 0) * 10);
    const foot_traffic_score = normalizeScore(foot_traffic_score_2025 * 10);
    const crime_score = normalizeScore(crime_score_2025 * 10);
    const flood_risk_score = normalizeScore((zone.flood_risk_score || 0) * 10);
    const rent_score = normalizeScore((zone.rent_score || 0) * 10);
    const poi_score = normalizeScore((zone.poi_score || 0) * 10);
    const demographic_score = hasDemographicFilters ? 
      clamp((combined_match_pct || 0) * 100, 0, 100) : 0;

    // Calculate final weighted custom_score using 2025 predictions
    const custom_score = clamp(
      foot_traffic_score * (finalWeights.foot_traffic || 0) +
      (hasDemographicFilters ? demographic_score * (finalWeights.demographic || 0) : 0) +
      crime_score * (finalWeights.crime || 0) +
      flood_risk_score * (finalWeights.flood_risk || 0) +
      rent_score * (finalWeights.rent_score || 0) +
      poi_score * (finalWeights.poi || 0),
      0, 100
    );

    // Generate tract names
    const demo = demographicsData?.find((d) => d.GEOID === geoId);
    const { tract_name, display_name, nta_name } = generateTractNames(geoId, demo);

    processedZones.push({
      geoid: geoId,
      tract_name,
      display_name,
      nta_name,
      resilience_score,
      custom_score,
      foot_traffic_score,
      crime_score,
      flood_risk_score,
      rent_score,
      poi_score,
      avg_rent: zone.avg_rent,
      demographic_score,
      demographic_match_pct: hasDemographicFilters && input.ethnicities.length ? 
        (percentages.ethnicPercent[geoId] || 0) * 100 : null,
      gender_match_pct: hasDemographicFilters && input.genders.length ? 
        (percentages.genderPercent[geoId] || 0) * 100 : null,
      age_match_pct: hasDemographicFilters && input.ageRange && !isDefaultRange(input.ageRange, [0, 100]) ? 
        (percentages.agePercent[geoId] || 0) * 100 : null,
      income_match_pct: hasDemographicFilters && input.incomeRange && !isDefaultRange(input.incomeRange, [0, 250000]) ? 
        (percentages.incomePercent[geoId] || 0) * 100 : null,
      combined_match_pct: hasDemographicFilters ? combined_match_pct : null,
      // Store which data sources were used for transparency
      data_sources: {
        crime_score_source: crime2025Info ? '2025_prediction' : 'resilience_zones_fallback',
        foot_traffic_source: footTraffic2025Info ? '2025_prediction' : 'resilience_zones_fallback',
        crime_score_2025: crime_score_2025,
        foot_traffic_score_2025: foot_traffic_score_2025
      }
    });
  }

  return processedZones;
}

function isDefaultRange(range: any, defaultRange: number[]): boolean {
  if (!range || !Array.isArray(range) || range.length !== 2) return true;
  return range[0] === defaultRange[0] && range[1] === defaultRange[1];
}

// Optimized: Uses pre-calculated database columns for better performance and accuracy
function calculateOptimizedFootTrafficScore(footTrafficInfo: any, timePeriods: string[], year: string): number {
  const sortedPeriods = [...timePeriods].sort();

  // All 3 periods selected - use pre-calculated average
  if (sortedPeriods.length === 3 && 
      sortedPeriods[0] === 'afternoon' && 
      sortedPeriods[1] === 'evening' && 
      sortedPeriods[2] === 'morning') {
    const columnName = `average_${year}`;
    const score = footTrafficInfo[columnName];
    console.log(`Using ${columnName}: ${score}`);
    return score !== null && score !== undefined ? score : 0;
  }

  // Two periods selected - use pre-calculated combinations
  if (sortedPeriods.length === 2) {
    let combinationColumn;
    if (sortedPeriods.includes('morning') && sortedPeriods.includes('afternoon')) {
      combinationColumn = `morning_afternoon_${year}`;
    } else if (sortedPeriods.includes('morning') && sortedPeriods.includes('evening')) {
      combinationColumn = `morning_evening_${year}`;
    } else if (sortedPeriods.includes('afternoon') && sortedPeriods.includes('evening')) {
      combinationColumn = `afternoon_evening_${year}`;
    }

    if (combinationColumn) {
      const score = footTrafficInfo[combinationColumn];
      console.log(`Using ${combinationColumn}: ${score}`);
      return score !== null && score !== undefined ? score : 0;
    }
  }

  // Single period or fallback - use individual columns
  if (sortedPeriods.length === 1) {
    const columnName = `${sortedPeriods[0]}_${year}`;
    const score = footTrafficInfo[columnName];
    console.log(`Using ${columnName}: ${score}`);
    return score !== null && score !== undefined ? score : 0;
  }

  // Fallback: Manual calculation if no optimized column available
  console.log(`Manual calculation for periods: ${sortedPeriods.join(', ')}, year: ${year}`);
  let totalScore = 0;
  let validPeriods = 0;

  for (const period of timePeriods) {
    const columnName = `${period}_${year}`;
    const periodScore = footTrafficInfo[columnName];
    if (periodScore !== null && periodScore !== undefined) {
      totalScore += periodScore;
      validPeriods++;
    }
  }

  return validPeriods > 0 ? totalScore / validPeriods : 0;
}

// Complete timeline data using all available database columns
export async function addFootTrafficDataToTopZones(
  supabase: any, 
  topZones: any[], 
  timePeriods: string[] = ['morning', 'afternoon', 'evening']
): Promise<void> {
  const topGeoIds = topZones.map((zone) => zone.geoid);
  const footTrafficData = await fetchFootTrafficData(supabase, topGeoIds);

  console.log(`🚶 [Foot Traffic] Building complete timeline for ${topZones.length} zones with years:`, FOOT_TRAFFIC_YEARS);
  console.log(`🚶 [Foot Traffic] Selected periods: ${timePeriods.join(', ')}`);

  for (const zone of topZones) {
    const footTrafficInfo = footTrafficData?.find((ft) => ft.GEOID === zone.geoid);

    if (footTrafficInfo) {
      // Main score already set in processZones using 2025 data
      zone.main_foot_traffic_score = zone.foot_traffic_score;

      // Complete foot traffic timeline for bar charts
      zone.foot_traffic_timeline = {};
      zone.foot_traffic_timeline_metadata = {
        available_years: [],
        missing_years: [],
        data_gap_notes: [],
        optimization_used: 'database_precalculated'
      };

      // Initialize period tracking for detailed breakdown
      zone.foot_traffic_by_period = {};
      for (const period of TIME_PERIODS) {
        zone.foot_traffic_by_period[period] = {};
      }

      // Process ALL years using optimized database columns
      for (const year of FOOT_TRAFFIC_YEARS) {
        // Use optimized calculation for main timeline
        const yearScore = calculateOptimizedFootTrafficScore(footTrafficInfo, timePeriods, year);
        
        if (yearScore > 0) {
          zone.foot_traffic_timeline[year] = yearScore * 10; // Convert to 0-100 scale
          zone.foot_traffic_timeline_metadata.available_years.push(year);
        } else {
          zone.foot_traffic_timeline[year] = null; // Mark missing/zero data
          zone.foot_traffic_timeline_metadata.missing_years.push(year);
        }

        // Store individual period scores for detailed charts
        for (const period of TIME_PERIODS) {
          const columnName = `${period}_${year}`;
          const periodScore = footTrafficInfo[columnName];
          if (periodScore !== null && periodScore !== undefined) {
            zone.foot_traffic_by_period[period][year] = periodScore * 10; // Convert to 0-100 scale
          } else {
            zone.foot_traffic_by_period[period][year] = null; // Mark missing period data
          }
        }
      }

      // Store combination data for potential future use
      zone.foot_traffic_combinations = {};
      for (const year of FOOT_TRAFFIC_YEARS) {
        zone.foot_traffic_combinations[year] = {
          morning_afternoon: footTrafficInfo[`morning_afternoon_${year}`] || null,
          morning_evening: footTrafficInfo[`morning_evening_${year}`] || null,
          afternoon_evening: footTrafficInfo[`afternoon_evening_${year}`] || null,
          average_all: footTrafficInfo[`average_${year}`] || null
        };
      }

      // Sort available years for proper timeline order
      zone.foot_traffic_timeline_metadata.available_years.sort();

      // Calculate foot traffic trend analysis
      const { trend_direction, trend_change } = analyzeFootTrafficTrend(footTrafficInfo, timePeriods);
      zone.foot_traffic_trend_direction = trend_direction;
      zone.foot_traffic_trend_change = trend_change;
      zone.foot_traffic_periods_used = timePeriods;

      console.log(`Zone ${zone.geoid}: ${zone.foot_traffic_timeline_metadata.available_years.length}/${FOOT_TRAFFIC_YEARS.length} years available (optimized)`);
    } else {
      // Default values when no detailed foot traffic data
      zone.main_foot_traffic_score = zone.foot_traffic_score || 0;
      zone.foot_traffic_timeline = {};
      zone.foot_traffic_timeline_metadata = {
        available_years: [],
        missing_years: FOOT_TRAFFIC_YEARS,
        data_gap_notes: ['No detailed foot traffic data available'],
        optimization_used: 'none'
      };
      zone.foot_traffic_by_period = {};
      zone.foot_traffic_combinations = {};
      zone.foot_traffic_trend_direction = 'unknown';
      zone.foot_traffic_trend_change = '0';
      zone.foot_traffic_periods_used = timePeriods;
    }
  }
}

// Complete timeline data for bar charts including all available years
export async function addCrimeDataToTopZones(
  supabase: any, 
  topZones: any[], 
  crimeYears: string[] = CRIME_YEARS
): Promise<void> {
  const topGeoIds = topZones.map((zone) => zone.geoid);
  const crimeData = await fetchCrimeData(supabase, topGeoIds);

  console.log(`Building complete timeline for ${topZones.length} zones with years:`, crimeYears);

  for (const zone of topZones) {
    const crimeInfo = crimeData?.find((c) => c.GEOID === zone.geoid);

    if (crimeInfo) {
      // Main score already set in processZones using 2025 data
      zone.main_crime_score = zone.crime_score;

      // Complete crime timeline for bar charts - includes ALL available years
      zone.crime_timeline = {};
      zone.crime_timeline_metadata = {
        available_years: [],
        missing_years: [],
        data_gap_notes: []
      };

      for (const year of crimeYears) {
        if (crimeInfo[year] !== undefined && crimeInfo[year] !== null) {
          zone.crime_timeline[year] = (crimeInfo[year] || 0) * 10; // Convert to 0-100 scale
          zone.crime_timeline_metadata.available_years.push(year);
        } else {
          zone.crime_timeline[year] = null; // Explicitly mark missing data
          zone.crime_timeline_metadata.missing_years.push(year);
        }
      }

      // Crime trend analysis
      const { trend_direction, trend_change } = analyzeCrimeTrend(crimeInfo);
      zone.crime_trend_direction = trend_direction;
      zone.crime_trend_change = trend_change;

      console.log(`🚨 [Crime] Zone ${zone.geoid}: ${zone.crime_timeline_metadata.available_years.length}/${crimeYears.length} years available`);
    } else {
      // Default values when no detailed crime data
      zone.main_crime_score = zone.crime_score || 0;
      zone.crime_timeline = {};
      zone.crime_timeline_metadata = {
        available_years: [],
        missing_years: crimeYears,
        data_gap_notes: ['No detailed crime data available']
      };
      zone.crime_trend_direction = 'unknown';
      zone.crime_trend_change = '0';
    }
  }
}

function generateTractNames(geoId: string, demo: any): { tract_name: string; display_name: string; nta_name: string } {
  let tract_name = `Tract ${geoId.slice(-3)}`;
  
  if (demo?.NTA2020_1) {
    tract_name = `${demo.NTA2020_1}-${geoId.slice(-3)}`;
  }

  const borough = getBoroughName(geoId);
  const display_name = `${tract_name} (${borough})`;
  const nta_name = demo?.NTA2020_1 || 'Unknown Area';

  return {
    tract_name,
    display_name,
    nta_name
  };
}

function analyzeCrimeTrend(crimeInfo: any): { trend_direction: string; trend_change: string } {
  const current = crimeInfo.pred_2025 || crimeInfo.year_2024 || 0;
  const futureYears = ['pred_2026', 'pred_2027'];
  const futureScores = futureYears
    .map((year) => crimeInfo[year])
    .filter((score) => score !== null && score !== undefined);

  if (futureScores.length > 0) {
    const futureAvg = futureScores.reduce((a, b) => a + b, 0) / futureScores.length;
    const change = (futureAvg - current) / current * 100;
    
    return {
      trend_direction: futureAvg > current ? 'increasing' : futureAvg < current ? 'decreasing' : 'stable',
      trend_change: change.toFixed(1)
    };
  } else {
    const recentYears = ['year_2020', 'year_2021', 'year_2022', 'year_2023', 'year_2024'];
    const recentScores = recentYears
      .map((year) => crimeInfo[year])
      .filter((score) => score !== null && score !== undefined);

    if (recentScores.length > 0) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const change = (current - recentAvg) / recentAvg * 100;
      
      return {
        trend_direction: current > recentAvg ? 'increasing' : current < recentAvg ? 'decreasing' : 'stable',
        trend_change: change.toFixed(1)
      };
    } else {
      return {
        trend_direction: 'unknown',
        trend_change: '0'
      };
    }
  }
}

function analyzeFootTrafficTrend(footTrafficInfo: any, timePeriods: string[]): { trend_direction: string; trend_change: string } {
  const current = calculateOptimizedFootTrafficScore(footTrafficInfo, timePeriods, '2024') || 
                  calculateOptimizedFootTrafficScore(footTrafficInfo, timePeriods, '2023') || 0;
  
  const futureYears = ['pred_2025', 'pred_2026', 'pred_2027'];
  const futureScores = futureYears
    .map((year) => calculateOptimizedFootTrafficScore(footTrafficInfo, timePeriods, year))
    .filter((score) => score > 0);

  if (futureScores.length > 0) {
    const futureAvg = futureScores.reduce((a, b) => a + b, 0) / futureScores.length;
    const change = current > 0 ? (futureAvg - current) / current * 100 : 0;
    
    return {
      trend_direction: futureAvg > current ? 'increasing' : futureAvg < current ? 'decreasing' : 'stable',
      trend_change: change.toFixed(1)
    };
  } else {
    const recentYears = ['2020', '2021', '2022', '2023', '2024'];
    const recentScores = recentYears
      .map((year) => calculateOptimizedFootTrafficScore(footTrafficInfo, timePeriods, year))
      .filter((score) => score > 0);

    if (recentScores.length > 1) {
      const recentAvg = recentScores.slice(0, -1).reduce((a, b) => a + b, 0) / (recentScores.length - 1);
      const change = recentAvg > 0 ? (current - recentAvg) / recentAvg * 100 : 0;
      
      return {
        trend_direction: current > recentAvg ? 'increasing' : current < recentAvg ? 'decreasing' : 'stable',
        trend_change: change.toFixed(1)
      };
    } else {
      return {
        trend_direction: 'unknown',
        trend_change: '0'
      };
    }
  }
}