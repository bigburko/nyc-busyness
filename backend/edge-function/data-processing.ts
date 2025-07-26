// data-processing.ts
/**
 * Fetches all required data from Supabase in parallel for optimal performance
 * Handles errors gracefully - only zones data is critical, others can be null
 */ export async function fetchAllData(supabase) {
  try {
    console.log('Fetching all data in parallel.');
    // Fetch all required data in parallel for better performance
    const [zonesResult, ethnicityResult, demographicsResult, incomeResult] = await Promise.allSettled([
      supabase.from('resilience_zones').select('*'),
      supabase.from('tract_race_ethnicity').select('*'),
      supabase.from('tract_demographics').select('*'),
      supabase.from('tract_economics').select('*')
    ]);
    // Handle zones result
    if (zonesResult.status === 'rejected') {
      throw new Error(`Failed to fetch zones: ${zonesResult.reason}`);
    }
    if (zonesResult.value.error) {
      throw new Error(`Failed to fetch zones: ${zonesResult.value.error.message}`);
    }
    // Handle other results with warnings but don't fail
    const ethnicityData = ethnicityResult.status === 'fulfilled' && !ethnicityResult.value.error ? ethnicityResult.value.data : null;
    const demographicsData = demographicsResult.status === 'fulfilled' && !demographicsResult.value.error ? demographicsResult.value.data : null;
    const incomeData = incomeResult.status === 'fulfilled' && !incomeResult.value.error ? incomeResult.value.data : null;
    // Log warnings for missing data
    if (!ethnicityData) {
      console.warn('Failed to fetch ethnicity data - ethnicity filtering disabled');
    }
    if (!demographicsData) {
      console.warn('Failed to fetch demographics data - gender/age filtering disabled');
    }
    if (!incomeData) {
      console.warn('Failed to fetch income data - income filtering disabled');
    }
    const result = {
      zones: zonesResult.value.data || [],
      ethnicityData,
      demographicsData,
      incomeData
    };
    console.log(`Successfully fetched data:`, {
      zones: result.zones.length,
      ethnicityData: result.ethnicityData?.length || 0,
      demographicsData: result.demographicsData?.length || 0,
      incomeData: result.incomeData?.length || 0
    });
    return result;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Database fetch failed: ${error.message}`);
  }
}
/**
 * Fetches crime data for specific zones (only called for top zones)
 * Returns null if failed, allowing the function to continue without crime data
 */ export async function fetchCrimeData(supabase, geoIds) {
  try {
    if (!geoIds || geoIds.length === 0) {
      console.warn('No GeoIDs provided for crime data fetch');
      return null;
    }
    console.log(`Fetching crime data for ${geoIds.length} zones...`);
    const { data, error } = await supabase.from('tract_crime_trends').select('*').in('GEOID', geoIds);
    if (error) {
      console.warn('Failed to fetch crime data:', error.message);
      return null;
    }
    console.log(`Successfully fetched crime data for ${data?.length || 0} zones`);
    return data;
  } catch (error) {
    console.error('Error fetching crime data:', error);
    return null;
  }
}
/**
 * Fetches foot traffic data for specific zones (optimization - only called for top zones)
 * Returns null if failed, allowing the function to continue without foot traffic data
 */ export async function fetchFootTrafficData(supabase, geoIds) {
  try {
    if (!geoIds || geoIds.length === 0) {
      console.warn('No GeoIDs provided for foot traffic data fetch');
      return null;
    }
    console.log(`Fetching foot traffic data for ${geoIds.length} zones.`);
    const { data, error } = await supabase.from('tract_foot_traffic_trends').select('*').in('GEOID', geoIds);
    if (error) {
      console.warn('Failed to fetch foot traffic data:', error.message);
      return null;
    }
    console.log(`Successfully fetched foot traffic data for ${data?.length || 0} zones`);
    return data;
  } catch (error) {
    console.error('Error fetching foot traffic data:', error);
    return null;
  }
}
/**
 * Validates that required database tables exist and have data
 */ export function validateDatabaseData(data) {
  console.log('Validating database data.');
  if (!data.zones || data.zones.length === 0) {
    console.error('No zones data available');
    return false;
  }
  // Warn about missing optional data but don't fail
  if (!data.ethnicityData) {
    console.warn('No ethnicity data available - ethnicity filtering will not work');
  }
  if (!data.demographicsData) {
    console.warn('No demographics data available - gender/age filtering will not work');
  }
  if (!data.incomeData) {
    console.warn('No income data available - income filtering will not work');
  }
  console.log(`Database validation passed - ${data.zones.length} zones available`);
  return true;
}
