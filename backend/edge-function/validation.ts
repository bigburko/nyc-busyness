// validation.ts
import { VALID_GENDERS, DEFAULT_CRIME_YEARS, VALID_TIME_PERIODS, DEFAULT_TIME_PERIODS } from './utils.ts';
export function validateRequestBody(body) {
  console.log('Starting validation');
  try {
    // Validate and provide defaults for all input parameters
    const weights = Array.isArray(body.weights) ? body.weights : [];
    const ethnicities = Array.isArray(body.ethnicities) ? body.ethnicities : [];
    const genders = Array.isArray(body.genders) ? body.genders : [];
    // Validate age range
    const ageRange = Array.isArray(body.ageRange) && body.ageRange.length === 2 ? [
      Math.max(0, Math.min(100, body.ageRange[0])),
      Math.max(0, Math.min(100, body.ageRange[1]))
    ] : [
      0,
      100
    ];
    // Validate income range
    const incomeRange = Array.isArray(body.incomeRange) && body.incomeRange.length === 2 ? [
      Math.max(0, body.incomeRange[0]),
      Math.max(0, body.incomeRange[1])
    ] : [
      0,
      250000
    ];
    // Validate rent range
    const rentRange = Array.isArray(body.rentRange) && body.rentRange.length === 2 ? [
      Math.max(0, body.rentRange[0]),
      body.rentRange[1] === Infinity ? Infinity : Math.max(0, body.rentRange[1])
    ] : [
      0,
      Infinity
    ];
    // Validate topN percentage
    const topN = typeof body.topN === 'number' && body.topN > 0 && body.topN <= 100 ? body.topN : 10;
    // Validate crime years
    const crimeYears = Array.isArray(body.crimeYears) && body.crimeYears.length > 0 ? body.crimeYears.filter((year)=>typeof year === 'string') : DEFAULT_CRIME_YEARS;
    // Validate foot traffic time periods
    const timePeriods = Array.isArray(body.timePeriods) && body.timePeriods.length > 0 ? body.timePeriods.filter((period)=>VALID_TIME_PERIODS.includes(period)) : DEFAULT_TIME_PERIODS;
    // Ensure at least one valid time period
    const validatedTimePeriods = timePeriods.length > 0 ? timePeriods : DEFAULT_TIME_PERIODS;
    // Validate demographic scoring (can be null or object)
    const demographicScoring = body.demographicScoring || null;
    // Additional validation for demographic scoring if present
    if (demographicScoring && !validateDemographicScoring(demographicScoring)) {
      console.warn('Invalid demographic scoring structure, ignore it.');
    // Don't throw error, just ignore invalid demographic scoring
    }
    // Validate weights array
    const validatedWeights = weights.filter((w)=>w && typeof w === 'object' && typeof w.id === 'string' && typeof w.value === 'number' && w.value >= 0 && w.value <= 100);
    // Validate ethnicities array
    const validatedEthnicities = ethnicities.filter((e)=>typeof e === 'string' && e.length > 0);
    // Validate genders array
    const validatedGenders = genders.filter((g)=>VALID_GENDERS.includes(g));
    const result = {
      weights: validatedWeights,
      ethnicities: validatedEthnicities,
      genders: validatedGenders,
      ageRange,
      incomeRange,
      rentRange,
      topN,
      crimeYears,
      timePeriods: validatedTimePeriods,
      demographicScoring: demographicScoring && validateDemographicScoring(demographicScoring) ? demographicScoring : null
    };
    console.log('Request validation completed:', {
      weights: result.weights.length,
      weightDetails: result.weights.map((w)=>`${w.id}: ${w.value}%`),
      ethnicities: result.ethnicities.length,
      genders: result.genders.length,
      ageRange: result.ageRange,
      incomeRange: result.incomeRange,
      rentRange: result.rentRange,
      topN: result.topN,
      crimeYears: result.crimeYears.length,
      timePeriods: result.timePeriods,
      hasDemographicScoring: !!result.demographicScoring
    });
    return result;
  } catch (error) {
    console.error('Error during validation:', error);
    throw new Error(`Invalid request body: ${error.message}`);
  }
}
export function validateDemographicScoring(demographicScoring) {
  try {
    if (!demographicScoring || typeof demographicScoring !== 'object') {
      return false;
    }
    // Check if weights object exists and has valid structure
    if (!demographicScoring.weights || typeof demographicScoring.weights !== 'object') {
      console.warn('Missing or invalid weights object in demographic scoring');
      return false;
    }
    const { weights } = demographicScoring;
    const requiredWeightKeys = [
      'ethnicity',
      'gender',
      'age',
      'income'
    ];
    // Validate that all required weight keys exist and are numbers between 0 and 1
    for (const key of requiredWeightKeys){
      if (typeof weights[key] !== 'number' || weights[key] < 0 || weights[key] > 1) {
        console.warn(`Invalid weight for ${key}: ${weights[key]}`);
        return false;
      }
    }
    // Validate threshold bonuses if present
    if (demographicScoring.thresholdBonuses && Array.isArray(demographicScoring.thresholdBonuses)) {
      for (const bonus of demographicScoring.thresholdBonuses){
        if (!bonus.condition || typeof bonus.condition !== 'string' || typeof bonus.bonus !== 'number' || !bonus.description || typeof bonus.description !== 'string') {
          console.warn('Invalid threshold bonus structure:', bonus);
          return false;
        }
      }
    }
    // Validate penalties if present
    if (demographicScoring.penalties && Array.isArray(demographicScoring.penalties)) {
      for (const penalty of demographicScoring.penalties){
        if (!penalty.condition || typeof penalty.condition !== 'string' || typeof penalty.penalty !== 'number' || !penalty.description || typeof penalty.description !== 'string') {
          console.warn('Invalid penalty structure:', penalty);
          return false;
        }
      }
    }
    console.log('Demographic scoring validation passed');
    return true;
  } catch (error) {
    console.error('Error validating demographic scoring:', error);
    return false;
  }
}
