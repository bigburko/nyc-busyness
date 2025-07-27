// src/lib/DemographicDataProcessor.ts
import { TractResult } from '../types/TractTypes';

// Define interfaces based on the ACTUAL SQL schema
interface EthnicityRow {
  GEOID: string;
  total_population: number;
  // Hispanic categories
  HMex?: number;           // Hispanic Mexican
  HCA?: number;            // Hispanic Central American
  HSA?: number;            // Hispanic South American
  HCH?: number;            // Hispanic Caribbean
  HOth?: number;           // Hispanic Other
  // White European categories
  WEur?: number;           // White European
  WEurEnglsh?: number;     // White European English
  WEurIrsh?: number;       // White European Irish
  WEurGrmn?: number;       // White European German
  WEurItln?: number;       // White European Italian
  WEurPlsh?: number;       // White European Polish
  WOth?: number;           // White Other
  // Black/African American categories
  BAfrAm?: number;         // Black African American
  BSSAf?: number;          // Black Sub-Saharan African
  BCrb?: number;           // Black Caribbean
  // Asian categories
  AEA?: number;            // Asian East Asian
  ACA?: number;            // Asian Central Asian
  ASA?: number;            // Asian South Asian
  ASEA?: number;           // Asian Southeast Asian
  AOth?: number;           // Asian Other
  // Native American/Pacific Islander
  AIANAlkNtv?: number;     // American Indian Alaska Native
  NHPIPly?: number;        // Native Hawaiian Pacific Islander
  // Other races
  SORBlzn?: number;        // Some Other Race
  // Note: Many more specific subcategories available in schema
}

interface DemographicsRow {
  GEOID: string;
  'Total population': number;
  'Male (%)': number;
  'Female (%)': number;
  'Under 5 years (%)': number;
  '5 to 9 years (%)': number;
  '10 to 14 years (%)': number;
  '15 to 19 years (%)': number;
  '20 to 24 years (%)': number;
  '25 to 29 years (%)': number;
  '30 to 34 years (%)': number;
  '35 to 39 years (%)': number;
  '40 to 44 years (%)': number;
  '45 to 49 years (%)': number;
  '50 to 54 years (%)': number;
  '55 to 59 years (%)': number;
  '60 to 64 years (%)': number;
  '65 to 69 years (%)': number;
  '70 to 74 years (%)': number;
  '75 to 79 years (%)': number;
  '80 to 84 years (%)': number;
  '85 years and over (%)': number;
}

interface IncomeRow {
  GEOID: string;
  HHIU10E: number;      // Households Under $10k (count, not percentage)
  HHI10t14E: number;    // Households $10k-$14.9k
  HHI15t24E: number;    // Households $15k-$24.9k
  HHI25t34E: number;    // Households $25k-$34.9k
  HHI35t49E: number;    // Households $35k-$49.9k
  HHI50t74E: number;    // Households $50k-$74.9k
  HHI75t99E: number;    // Households $75k-$99.9k
  HI100t149E: number;   // Households $100k-$149.9k
  HI150t199E: number;   // Households $150k-$199.9k
  HHI200plE: number;    // Households $200k+
}

export interface DemographicChartData {
  name: string;
  value: number;
  color: string;
}

export interface ProcessedDemographicData {
  ethnicityData: DemographicChartData[];
  ageData: DemographicChartData[];
  incomeData: DemographicChartData[];
}

// Color palette matching your app theme
const ETHNICITY_COLORS = [
  '#4299E1', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#9CA3AF'  // Gray
];

const AGE_COLORS = [
  '#4299E1', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#9CA3AF'  // Gray
];

const INCOME_COLORS = [
  '#EF4444', // Red (low income)
  '#F59E0B', // Orange
  '#10B981', // Green
  '#4299E1'  // Blue (high income)
];

/**
 * Process ethnicity data for a specific tract using the real schema
 */
export function processEthnicityData(
  tract: TractResult, 
  ethnicityData: EthnicityRow[]
): DemographicChartData[] {
  const tractData = ethnicityData.find(row => row.GEOID === tract.geoid);
  
  if (!tractData || !tractData.total_population) {
    console.warn(`No ethnicity data found for tract ${tract.geoid}`);
    return [];
  }

  const total = tractData.total_population;
  const ethnicities: DemographicChartData[] = [];

  // Process major ethnicity categories based on real schema
  const ethnicityMappings = [
    {
      name: 'Hispanic/Latino',
      keys: ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'], // All Hispanic categories
      color: ETHNICITY_COLORS[1]
    },
    {
      name: 'White',
      keys: ['WEur', 'WOth'], // White European + White Other
      color: ETHNICITY_COLORS[0]
    },
    {
      name: 'Black/African American',
      keys: ['BAfrAm', 'BSSAf', 'BCrb'], // Black African American + Sub-Saharan + Caribbean
      color: ETHNICITY_COLORS[3]
    },
    {
      name: 'Asian',
      keys: ['AEA', 'ACA', 'ASA', 'ASEA', 'AOth'], // All Asian categories
      color: ETHNICITY_COLORS[2]
    },
    {
      name: 'Native American',
      keys: ['AIANAlkNtv'], // American Indian Alaska Native
      color: ETHNICITY_COLORS[4]
    },
    {
      name: 'Pacific Islander',
      keys: ['NHPIPly'], // Native Hawaiian Pacific Islander
      color: ETHNICITY_COLORS[5]
    }
  ];

  ethnicityMappings.forEach(mapping => {
    let totalCount = 0;
    
    mapping.keys.forEach(key => {
      const count = tractData[key as keyof EthnicityRow] as number || 0;
      totalCount += count;
    });

    const percentage = total > 0 ? Math.round((totalCount / total) * 100) : 0;
    
    if (percentage > 0) {
      ethnicities.push({
        name: mapping.name,
        value: percentage,
        color: mapping.color
      });
    }
  });

  // Sort by percentage and return top results
  return ethnicities
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

/**
 * Process age data for a specific tract
 */
export function processAgeData(
  tract: TractResult, 
  demographicsData: DemographicsRow[]
): DemographicChartData[] {
  const tractData = demographicsData.find(row => row.GEOID === tract.geoid);
  
  if (!tractData) {
    console.warn(`No demographics data found for tract ${tract.geoid}`);
    return [];
  }

  // Group age brackets into meaningful categories
  const ageGroups = [
    {
      name: 'Children/Teens (0-17)',
      brackets: ['Under 5 years (%)', '5 to 9 years (%)', '10 to 14 years (%)', '15 to 19 years (%)'],
      color: AGE_COLORS[4]
    },
    {
      name: 'Young Adults (18-34)',
      brackets: ['20 to 24 years (%)', '25 to 29 years (%)', '30 to 34 years (%)'],
      color: AGE_COLORS[0]
    },
    {
      name: 'Middle Age (35-54)',
      brackets: ['35 to 39 years (%)', '40 to 44 years (%)', '45 to 49 years (%)', '50 to 54 years (%)'],
      color: AGE_COLORS[1]
    },
    {
      name: 'Older Adults (55-64)',
      brackets: ['55 to 59 years (%)', '60 to 64 years (%)'],
      color: AGE_COLORS[2]
    },
    {
      name: 'Seniors (65+)',
      brackets: ['65 to 69 years (%)', '70 to 74 years (%)', '75 to 79 years (%)', '80 to 84 years (%)', '85 years and over (%)'],
      color: AGE_COLORS[3]
    }
  ];

  const ageData: DemographicChartData[] = [];

  ageGroups.forEach(group => {
    let totalPercentage = 0;
    
    group.brackets.forEach(bracket => {
      const percentage = tractData[bracket as keyof DemographicsRow] as number || 0;
      totalPercentage += percentage;
    });

    if (totalPercentage > 0) {
      ageData.push({
        name: group.name,
        value: Math.round(totalPercentage),
        color: group.color
      });
    }
  });

  return ageData.sort((a, b) => b.value - a.value);
}

/**
 * Process income data for a specific tract using real schema (counts, not percentages)
 */
export function processIncomeData(
  tract: TractResult, 
  incomeData: IncomeRow[]
): DemographicChartData[] {
  const tractData = incomeData.find(row => row.GEOID === tract.geoid);
  
  if (!tractData) {
    console.warn(`No income data found for tract ${tract.geoid}`);
    return [];
  }

  // Calculate total households from all income bracket counts
  const incomeBrackets = [
    'HHIU10E', 'HHI10t14E', 'HHI15t24E', 'HHI25t34E', 'HHI35t49E',
    'HHI50t74E', 'HHI75t99E', 'HI100t149E', 'HI150t199E', 'HHI200plE'
  ];
  
  const totalHouseholds = incomeBrackets.reduce((sum, bracket) => {
    return sum + (tractData[bracket as keyof IncomeRow] as number || 0);
  }, 0);

  if (totalHouseholds === 0) {
    console.warn(`No household data for tract ${tract.geoid}`);
    return [];
  }

  // Group income brackets into meaningful ranges
  const incomeGroups = [
    {
      name: 'Under $50k',
      brackets: ['HHIU10E', 'HHI10t14E', 'HHI15t24E', 'HHI25t34E', 'HHI35t49E'],
      color: INCOME_COLORS[0]
    },
    {
      name: '$50k-$100k',
      brackets: ['HHI50t74E', 'HHI75t99E'],
      color: INCOME_COLORS[1]
    },
    {
      name: '$100k-$150k',
      brackets: ['HI100t149E'],
      color: INCOME_COLORS[2]
    },
    {
      name: '$150k+',
      brackets: ['HI150t199E', 'HHI200plE'],
      color: INCOME_COLORS[3]
    }
  ];

  const processedIncomeData: DemographicChartData[] = [];

  incomeGroups.forEach(group => {
    let totalCount = 0;
    
    group.brackets.forEach(bracket => {
      const count = tractData[bracket as keyof IncomeRow] as number || 0;
      totalCount += count;
    });

    const percentage = Math.round((totalCount / totalHouseholds) * 100);
    
    if (percentage > 0) {
      processedIncomeData.push({
        name: group.name,
        value: percentage,
        color: group.color
      });
    }
  });

  console.log(`📊 Income data for ${tract.geoid}: ${totalHouseholds} total households`, processedIncomeData);
  return processedIncomeData;
}

/**
 * Main function to process all demographic data for a tract using real schema
 */
export function processTractDemographics(
  tract: TractResult,
  rawData: {
    ethnicityData: EthnicityRow[] | null;
    demographicsData: DemographicsRow[] | null;
    incomeData: IncomeRow[] | null;
  }
): ProcessedDemographicData {
  console.log(`📊 Processing demographic data for tract ${tract.geoid}`);
  console.log(`📊 Available data: ethnicity=${rawData.ethnicityData?.length || 0}, demographics=${rawData.demographicsData?.length || 0}, income=${rawData.incomeData?.length || 0}`);

  const result = {
    ethnicityData: rawData.ethnicityData ? processEthnicityData(tract, rawData.ethnicityData) : [],
    ageData: rawData.demographicsData ? processAgeData(tract, rawData.demographicsData) : [],
    incomeData: rawData.incomeData ? processIncomeData(tract, rawData.incomeData) : []
  };

  console.log(`📊 Processed results for ${tract.geoid}:`, {
    ethnicityCount: result.ethnicityData.length,
    ageCount: result.ageData.length,
    incomeCount: result.incomeData.length
  });

  return result;
}