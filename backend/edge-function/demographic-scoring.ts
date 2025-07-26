// demographic-scoring.ts
// Prevents hierarchical overcounting that causes >100% demographic matches

// Type interfaces for better type safety
interface EthnicityRow {
  GEOID: string;
  total_population: number;
  [columnName: string]: any;
}

interface DemographicsRow {
  GEOID: string;
  'Total population': number;
  'Male (%)': number;
  'Female (%)': number;
  [ageKey: string]: any;
}

interface IncomeRow {
  GEOID: string;
  [incomeKey: string]: any;
}

interface ValidatedInput {
  ethnicities: string[];
  genders: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  demographicScoring?: {
    weights: {
      ethnicity: number;
      gender: number;
      age: number;
      income: number;
    };
    thresholdBonuses?: any;
    penalties?: any;
  };
}

interface PercentageResults {
  ethnicPercent: Record<string, number>;
  genderPercent: Record<string, number>;
  agePercent: Record<string, number>;
  incomePercent: Record<string, number>;
}

interface MaxPercentages {
  maxEthnicPct: number;
  maxGenderPct: number;
  maxAgePct: number;
  maxIncomePct: number;
}

interface ValueInfo {
  column: string;
  value: number;
  percentage_of_total: string;
  note?: string;
  selected?: boolean;
}

interface EthnicityBreakdown {
  input_ethnicity: string;
  mapped_columns: string[];
  values: ValueInfo[];
  deduplication_applied: boolean;
}

interface DetailedBreakdown {
  geoId: string;
  total_population: number;
  ethnicities: EthnicityBreakdown[];
  columns_used: string[];
  individual_values: any[];
  deduplication_method: string;
  final_match: number;
  final_percentage: number;
  overcounting_detected?: boolean;
  percentage_over_100?: string;
}

// 🎯 SOLUTION: Use LEVEL 1 categories (mid-level) for balanced granularity
// This avoids overcounting while still providing useful ethnic specificity
const ETHNICITY_COLUMN_MAPPING: Record<string, string[]> = {
  // ===== ASIAN CATEGORIES (Level 1 - No Overcounting) =====
  'asian': ['AEA', 'ASA', 'ASEA', 'ACA', 'AOth'],
  'east_asian': ['AEA'],
  'south_asian': ['ASA'],
  'southeast_asian': ['ASEA'],
  'central_asian': ['ACA'],
  
  // Specific Level 2 ethnicities when user wants precision
  'korean': ['AEAKrn'],
  'chinese': ['AEAChnsNoT'],
  'japanese': ['AEAJpns'],
  'taiwanese': ['AEATwns'],
  'filipino': ['ASEAFlpn'],
  'vietnamese': ['ASEAVtnms'],
  'thai': ['ASEAThai'],
  'cambodian': ['ASEACmbdn'],
  'indonesian': ['ASEAIndnsn'],
  'malaysian': ['ASEAMlysn'],
  'burmese': ['ASEABrms'],
  'singaporean': ['ASEASngprn'],
  'indian': ['ASAAsnInd'],
  'pakistani': ['ASAPkstn'],
  'bangladeshi': ['ASABngldsh'],
  'sri_lankan': ['ASASrLnkn'],
  'nepalese': ['ASANpls'],
  'afghan': ['ACAAfghan'],
  'uzbek': ['ACAUzbek'],
  
  // ===== HISPANIC CATEGORIES (Level 1 - No Overcounting) =====
  'hispanic': ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'],
  'latino': ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'],
  'latinx': ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'],
  
  // Level 1 regional groups
  'mexican': ['HMex'],
  'central_american': ['HCA'],
  'south_american': ['HSA'],
  'caribbean_hispanic': ['HCH'],
  
  // Specific Level 2 ethnicities
  'puerto_rican': ['HCHPrtRcn'],
  'cuban': ['HCHCuban'],
  'dominican': ['HCHDmncn'],
  'costa_rican': ['HCACstRcn'],
  'guatemalan': ['HCAGutmln'],
  'honduran': ['HCAHndrn'],
  'nicaraguan': ['HCANcrgn'],
  'salvadoran': ['HCASlvdrn'],
  'argentinean': ['HSAArgntn'],
  'bolivian': ['HSABlvn'],
  'chilean': ['HSAChln'],
  'colombian': ['HSAClmbn'],
  'ecuadorian': ['HSAEcudrn'],
  'peruvian': ['HSAPrvn'],
  'venezuelan': ['HSAVnzuln'],
  
  // ===== WHITE CATEGORIES (Level 1 - No Overcounting) =====
  'white': ['WEur', 'WMENA', 'WOth'],
  'european': ['WEur'],
  'middle_eastern': ['WMENA'],
  'north_african': ['WMENA'],
  
  // Specific Level 2 ethnicities
  'italian': ['WEurItln'],
  'irish': ['WEurIrsh'],
  'german': ['WEurGrmn'],
  'polish': ['WEurPlsh'],
  'russian': ['WEurRsn'],
  'french': ['WEurFrnch'],
  'british': ['WEurBrtsh'],
  'english': ['WEurEnglsh'],
  'scottish': ['WEurSctsh'],
  'greek': ['WEurGrk'],
  'portuguese': ['WEurPrtgs'],
  'dutch': ['WEurDtch'],
  'swedish': ['WEurSwdsh'],
  'norwegian': ['WEurNrwgn'],
  'turkish': ['WEurTrksh'],
  'armenian': ['WEurArmn'],
  'arab': ['WMENAArab'],
  'lebanese': ['WMENALbns'],
  'palestinian': ['WMENAPlstn'],
  'syrian': ['WMENASyrn'],
  'egyptian': ['WMENAEgptn'],
  'iraqi': ['WMENAIrq'],
  'iranian': ['WMENAIrn'],
  'israeli': ['WMENAIsrl'],
  
  // ===== BLACK CATEGORIES (Level 1 - No Overcounting) =====
  'black': ['BAfrAm', 'BSSAf', 'BCrb', 'BOth'],
  'african_american': ['BAfrAm'],
  'sub_saharan_african': ['BSSAf'],
  'caribbean_black': ['BCrb'],
  
  // Specific Level 2 ethnicities
  'nigerian': ['BSSAfNgrn'],
  'ghanaian': ['BSSAfGhn'],
  'ethiopian': ['BSSAfEthpn'],
  'kenyan': ['BSSAfKnyn'],
  'south_african': ['BSSAfSAfr'],
  'jamaican': ['BCrbJmcn'],
  'haitian': ['BCrbHtn'],
  'barbadian': ['BCrbBrbdn'],
  'trinidadian': ['BCrbTrTob'],
  
  // ===== OTHER CATEGORIES =====
  'native_american': ['AIANA'],
  'american_indian': ['AIANAIn'],
  'alaska_native': ['AIANAlkNtv'],
  'pacific_islander': ['NHPI'],
  'native_hawaiian': ['NHPIPlyNH'],
  'samoan': ['NHPIPlySmn'],
  'some_other_race': ['SOR'],
  'brazilian': ['SORBrzln'],
  'belizean': ['SORBlzn'],
  'guyanese': ['SORGuyans']
};

// Valid database columns
const VALID_DATABASE_COLUMNS = new Set([
  // Level 0 (Top-level)
  'H', 'W', 'B', 'A', 'AIANA', 'NHPI', 'SOR',
  // Level 1 (Mid-level) - RECOMMENDED for balanced granularity
  'HMex', 'HCA', 'HSA', 'HCH', 'HOth',
  'WEur', 'WMENA', 'WOth',
  'BAfrAm', 'BSSAf', 'BCrb', 'BOth',
  'AEA', 'ASA', 'ASEA', 'ACA', 'AOth',
  'AIANAIn', 'AIANAlkNtv', 'NHPIPly', 'NHPIMc',
  // Level 2 (Specific) - Use these for precise ethnic targeting
  'AEAKrn', 'AEAChnsNoT', 'AEAJpns', 'AEATwns',
  'ASAAsnInd', 'ASAPkstn', 'ASABngldsh', 'ASASrLnkn', 'ASANpls',
  'ASEAFlpn', 'ASEAVtnms', 'ASEAThai', 'ASEACmbdn', 'ASEAIndnsn',
  'ASEAMlysn', 'ASEABrms', 'ASEASngprn',
  'ACAAfghan', 'ACAKazakh', 'ACAKyrgyz', 'ACATajik', 'ACAUzbek',
  'HCHPrtRcn', 'HCHCuban', 'HCHDmncn',
  'HCACstRcn', 'HCAGutmln', 'HCAHndrn', 'HCANcrgn', 'HCAPnmn', 'HCASlvdrn',
  'HSAArgntn', 'HSABlvn', 'HSAChln', 'HSAClmbn', 'HSAEcudrn',
  'HSAPrguyn', 'HSAPrvn', 'HSAUrgyn', 'HSAVnzuln',
  'WEurItln', 'WEurIrsh', 'WEurGrmn', 'WEurPlsh', 'WEurRsn',
  'WEurFrnch', 'WEurBrtsh', 'WEurEnglsh',
  'WMENAArab', 'WMENALbns', 'WMENAPlstn', 'WMENASyrn',
  'WMENAEgptn', 'WMENAIrq', 'WMENAIrn', 'WMENAIsrl',
  'BSSAfNgrn', 'BSSAfGhn', 'BSSAfEthpn', 'BSSAfKnyn', 'BSSAfSAfr',
  'BCrbJmcn', 'BCrbHtn', 'BCrbBrbdn', 'BCrbTrTob',
  'NHPIPlyNH', 'NHPIPlySmn', 'NHPIMcChmr',
  'SORBrzln', 'SORBlzn', 'SORGuyans'
]);

// Age bracket definitions
const AGE_KEYS = [
  { key: 'Under 5 years (%)', min: 0, max: 4 },
  { key: '5 to 9 years (%)', min: 5, max: 9 },
  { key: '10 to 14 years (%)', min: 10, max: 14 },
  { key: '15 to 19 years (%)', min: 15, max: 19 },
  { key: '20 to 24 years (%)', min: 20, max: 24 },
  { key: '25 to 29 years (%)', min: 25, max: 29 },
  { key: '30 to 34 years (%)', min: 30, max: 34 },
  { key: '35 to 39 years (%)', min: 35, max: 39 },
  { key: '40 to 44 years (%)', min: 40, max: 44 },
  { key: '45 to 49 years (%)', min: 45, max: 49 },
  { key: '50 to 54 years (%)', min: 50, max: 54 },
  { key: '55 to 59 years (%)', min: 55, max: 59 },
  { key: '60 to 64 years (%)', min: 60, max: 64 },
  { key: '65 to 69 years (%)', min: 65, max: 69 },
  { key: '70 to 74 years (%)', min: 70, max: 74 },
  { key: '75 to 79 years (%)', min: 75, max: 79 },
  { key: '80 to 84 years (%)', min: 80, max: 84 },
  { key: '85 years and over (%)', min: 85, max: 120 }
];

// Income bracket definitions
const INCOME_BRACKETS = [
  { key: 'HHIU10E', min: 0, max: 9999 },
  { key: 'HHI10t14E', min: 10000, max: 14999 },
  { key: 'HHI15t24E', min: 15000, max: 24999 },
  { key: 'HHI25t34E', min: 25000, max: 34999 },
  { key: 'HHI35t49E', min: 35000, max: 49999 },
  { key: 'HHI50t74E', min: 50000, max: 74999 },
  { key: 'HHI75t99E', min: 75000, max: 99999 },
  { key: 'HI100t149E', min: 100000, max: 149999 },
  { key: 'HI150t199E', min: 150000, max: 199999 },
  { key: 'HHI200plE', min: 200000, max: 999999 }
];

// Research-backed scoring thresholds
const DEMOGRAPHIC_THRESHOLDS = {
  EXCELLENT: 30,
  STRONG: 25,
  GOOD: 20,
  AVERAGE: 15,
  WEAK: 10,
  POOR: 5
};

// Parent column mapping for deduplication
const PARENT_COLUMN_MAP: Record<string, string> = {
  'HMex': 'H', 'HCA': 'H', 'HSA': 'H', 'HCH': 'H', 'HOth': 'H',
  'HCACstRcn': 'HCA', 'HCAGutmln': 'HCA', 'HCAHndrn': 'HCA',
  'HCANcrgn': 'HCA', 'HCASlvdrn': 'HCA',
  'HSAArgntn': 'HSA', 'HSAClmbn': 'HSA', 'HSAPrvn': 'HSA', 'HSAVnzuln': 'HSA',
  'HCHPrtRcn': 'HCH', 'HCHCuban': 'HCH', 'HCHDmncn': 'HCH',
  'AEA': 'A', 'ASA': 'A', 'ASEA': 'A', 'ACA': 'A', 'AOth': 'A',
  'AEAKrn': 'AEA', 'AEAChnsNoT': 'AEA', 'AEAJpns': 'AEA', 'AEATwns': 'AEA',
  'ASAAsnInd': 'ASA', 'ASAPkstn': 'ASA', 'ASABngldsh': 'ASA',
  'ASEAFlpn': 'ASEA', 'ASEAVtnms': 'ASEA', 'ASEAThai': 'ASEA',
  'WEur': 'W', 'WMENA': 'W', 'WOth': 'W',
  'BAfrAm': 'B', 'BSSAf': 'B', 'BCrb': 'B', 'BOth': 'B'
};

// Ethnicity resolution
function resolveEthnicityColumns(ethnicity: string): string[] {
  console.log(`Resolving ethnicity: "${ethnicity}"`);
  
  // Case 1: Direct database column lookup
  if (VALID_DATABASE_COLUMNS.has(ethnicity)) {
    console.log(`"${ethnicity}" is a valid database column, using directly`);
    return [ethnicity];
  }
  
  // Case 2: Human-readable name mapping
  const normalizedEthnicity = ethnicity.toLowerCase().trim().replace(/[^a-z]/g, '_');
  const columns = ETHNICITY_COLUMN_MAPPING[normalizedEthnicity];
  
  if (columns) {
    console.log(`Mapping '${ethnicity}' to columns:`, columns);
    return columns;
  }
  
  // Case 3: No mapping found
  console.error(`No mapping found for ethnicity: "${ethnicity}"`);
  return [];
}

// Find parent column for deduplication
function findParentColumn(columns: string[]): string | null {
  const parents = columns.map(col => PARENT_COLUMN_MAP[col]).filter(Boolean);
  const uniqueParents = [...new Set(parents)];
  
  if (uniqueParents.length === 1) {
    console.log(`Found common parent "${uniqueParents[0]}" for columns:`, columns);
    return uniqueParents[0];
  }
  
  console.log(`No single parent found for columns:`, columns, 'Parents:', uniqueParents);
  return null;
}

// Safe number conversion
function safeNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Main calculation function with overcounting prevention
export function calculateDemographicPercentages(
  input: ValidatedInput,
  ethnicityData: EthnicityRow[],
  demographicsData: DemographicsRow[],
  incomeData: IncomeRow[]
): PercentageResults {
  const ethnicPercent: Record<string, number> = {};
  const genderPercent: Record<string, number> = {};
  const agePercent: Record<string, number> = {};
  const incomePercent: Record<string, number> = {};

  // Process ethnicity data with overcounting prevention
  if (ethnicityData && input.ethnicities.length > 0) {
    console.log('Processing ethnicities:', input.ethnicities);
    console.log('Available ethnicity data rows:', ethnicityData.length);

    const overCountingResults: DetailedBreakdown[] = [];

    for (const row of ethnicityData) {
      const geoId = row.GEOID;
      const total = safeNumber(row.total_population);
      let totalMatchValue = 0;

      const detailedBreakdown: DetailedBreakdown = {
        geoId,
        total_population: total,
        ethnicities: [],
        columns_used: [],
        individual_values: [],
        deduplication_method: 'unknown',
        final_match: 0,
        final_percentage: 0
      };

      for (const ethnicity of input.ethnicities) {
        const columns = resolveEthnicityColumns(ethnicity);
        
        const ethnicityBreakdown: EthnicityBreakdown = {
          input_ethnicity: ethnicity,
          mapped_columns: columns,
          values: [],
          deduplication_applied: false
        };

        if (columns.length > 1) {
          // Multiple columns - check for parent column
          const parentColumn = findParentColumn(columns);
          
          if (parentColumn && row[parentColumn] !== undefined && row[parentColumn] !== null) {
            // Use parent column to avoid double-counting
            const parentValue = safeNumber(row[parentColumn]);
            totalMatchValue += parentValue;
            ethnicityBreakdown.deduplication_applied = true;
            
            const valueInfo: ValueInfo = {
              column: parentColumn,
              value: parentValue,
              percentage_of_total: total > 0 ? (parentValue / total * 100).toFixed(2) + '%' : '0%',
              note: 'Used parent column to avoid overcounting'
            };
            ethnicityBreakdown.values.push(valueInfo);
            
            detailedBreakdown.deduplication_method = 'parent_column';
            console.log(`Using parent column ${parentColumn} = ${parentValue} for "${ethnicity}"`);
          } else {
            // No parent available - use maximum of child columns
            let maxValue = 0;
            let maxColumn = '';
            
            for (const column of columns) {
              const value = safeNumber(row[column]);
              if (value > maxValue) {
                maxValue = value;
                maxColumn = column;
              }
              
              const valueInfo: ValueInfo = {
                column: column,
                value: value,
                percentage_of_total: total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%',
                selected: value === maxValue
              };
              ethnicityBreakdown.values.push(valueInfo);
            }
            
            totalMatchValue += maxValue;
            ethnicityBreakdown.deduplication_applied = true;
            detailedBreakdown.deduplication_method = 'maximum_child';
            console.log(`Using max child column ${maxColumn} = ${maxValue} for "${ethnicity}"`);
          }
        } else if (columns.length === 1) {
          // Single column - use directly
          const column = columns[0];
          const value = safeNumber(row[column]);
          totalMatchValue += value;
          
          const valueInfo: ValueInfo = {
            column: column,
            value: value,
            percentage_of_total: total > 0 ? (value / total * 100).toFixed(2) + '%' : '0%',
            note: 'Single column, no deduplication needed'
          };
          ethnicityBreakdown.values.push(valueInfo);
          
          detailedBreakdown.deduplication_method = 'single_column';
          if (value > 0) {
            console.log(`${geoId}: ${column} = ${value} (${total > 0 ? (value / total * 100).toFixed(2) : 0}%) from "${ethnicity}"`);
          }
        }

        detailedBreakdown.ethnicities.push(ethnicityBreakdown);
        detailedBreakdown.columns_used.push(...columns);
      }

      // Calculate percentage with proper bounds
      const percentage = total > 0 ? Math.min(1.0, totalMatchValue / total) : 0;
      ethnicPercent[geoId] = percentage;
      
      detailedBreakdown.final_match = totalMatchValue;
      detailedBreakdown.final_percentage = percentage;

      // Check for overcounting (should not happen with fix)
      if (percentage > 1.0) {
        detailedBreakdown.overcounting_detected = true;
        detailedBreakdown.percentage_over_100 = (percentage * 100).toFixed(2) + '%';
        console.error(`[Overcounting present] ${geoId}: ${totalMatchValue}/${total} = ${(percentage * 100).toFixed(2)}%`);
      }

      // Store for debugging
      if (overCountingResults.length < 5 || percentage > 0.5) {
        overCountingResults.push(detailedBreakdown);
      }

      if (totalMatchValue > 0 || total > 0) {
        const isRealistic = percentage <= 1.0;
        const logLevel = isRealistic ? 'Success' : 'Error';
        console.log(`[${logLevel}] Fixed ${geoId}: ${totalMatchValue}/${total} = ${(percentage * 100).toFixed(2)}% (method: ${detailedBreakdown.deduplication_method})`);
      }
    }

    console.log(`🧬 [Demographic] Processed ${Object.keys(ethnicPercent).length} tracts for ethnicity data`);

    // Check for remaining overcounting
    const overCountingTracts = Object.entries(ethnicPercent).filter(([, pct]) => {
      const percentage = typeof pct === 'number' ? pct : 0;
      return percentage > 1.0;
    });
    
    if (overCountingTracts.length > 0) {
      console.error(`${overCountingTracts.length} tracts still have >100% ethnicity match.`);
      overCountingTracts.slice(0, 5).forEach(([geoid, pct]) => {
        const percentage = typeof pct === 'number' ? pct : 0;
        console.error(`   ${geoid}: ${(percentage * 100).toFixed(2)}%`);
      });
    } else {
      console.log('No overcounting detected.');
    }

    // Show top matches
    const topMatches = Object.entries(ethnicPercent)
      .sort(([, a], [, b]) => {
        const numA = typeof a === 'number' ? a : 0;
        const numB = typeof b === 'number' ? b : 0;
        return numB - numA;
      })
      .slice(0, 5);
    
    console.log('[Demographic] Top 5 ethnicity matches:', 
      topMatches.map(([geoid, pct]) => {
        const percentage = typeof pct === 'number' ? pct : 0;
        return `${geoid}: ${(percentage * 100).toFixed(2)}%`;
      })
    );
  }

  // Process gender and age data
  if (demographicsData) {
    console.log('[Demographic] Processing gender/age data for', demographicsData.length, 'tracts');
    
    for (const row of demographicsData) {
      const geoId = row.GEOID;
      const total = safeNumber(row['Total population']);

      // Gender calculation
      if (input.genders.length > 0) {
        const male = total * (safeNumber(row['Male (%)']) / 100);
        const female = total * (safeNumber(row['Female (%)']) / 100);
        let genderSum = 0;
        
        for (const gender of input.genders) {
          if (gender === 'male') genderSum += male;
          if (gender === 'female') genderSum += female;
        }
        
        genderPercent[geoId] = total > 0 ? genderSum / total : 0;
      }

      // Age calculation
      if (input.ageRange) {
        const [minAge, maxAge] = input.ageRange;
        let ageSum = 0;
        
        for (const bracket of AGE_KEYS) {
          if (minAge <= bracket.max && maxAge >= bracket.min) {
            ageSum += safeNumber(row[bracket.key]);
          }
        }
        
        agePercent[geoId] = total > 0 ? ageSum / 100 : 0; // Age data is already in percentages
      }
    }
  }

  // Process income data
  if (incomeData && input.incomeRange) {
    console.log('[Demographic] Processing income data for', incomeData.length, 'tracts');
    const [minIncome, maxIncome] = input.incomeRange;
    
    for (const row of incomeData) {
      const geoId = row.GEOID;
      let match = 0;
      let total = 0;
      
      for (const bracket of INCOME_BRACKETS) {
        const value = safeNumber(row[bracket.key]);
        total += value;
        
        if (minIncome <= bracket.max && maxIncome >= bracket.min) {
          match += value;
        }
      }
      
      incomePercent[geoId] = total > 0 ? match / total : 0;
    }
  }

  return {
    ethnicPercent,
    genderPercent,
    agePercent,
    incomePercent
  };
}

// Find max percentages for normalization
export function findMaxPercentages(
  ethnicPercent: Record<string, number>,
  genderPercent: Record<string, number>,
  agePercent: Record<string, number>,
  incomePercent: Record<string, number>
): MaxPercentages {
  let maxEthnicPct = 1;
  let maxGenderPct = 1;
  let maxAgePct = 1;
  let maxIncomePct = 1;

  for (const value of Object.values(ethnicPercent)) {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue > maxEthnicPct) maxEthnicPct = numValue;
  }

  for (const value of Object.values(genderPercent)) {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue > maxGenderPct) maxGenderPct = numValue;
  }

  for (const value of Object.values(agePercent)) {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue > maxAgePct) maxAgePct = numValue;
  }

  for (const value of Object.values(incomePercent)) {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue > maxIncomePct) maxIncomePct = numValue;
  }

  console.log('Max percentages found:', {
    ethnicity: (maxEthnicPct * 100).toFixed(2) + '%',
    gender: (maxGenderPct * 100).toFixed(2) + '%',
    age: (maxAgePct * 100).toFixed(2) + '%',
    income: (maxIncomePct * 100).toFixed(2) + '%'
  });

  return {
    maxEthnicPct,
    maxGenderPct,
    maxAgePct,
    maxIncomePct
  };
}

// Research-backed scoring function
function scorePercentageMatch(percentage: number): number {
  const pct = percentage * 100;
  
  if (pct >= DEMOGRAPHIC_THRESHOLDS.EXCELLENT) {
    return Math.min(100, 80 + (pct - DEMOGRAPHIC_THRESHOLDS.EXCELLENT) / 20 * 20);
  } else if (pct >= DEMOGRAPHIC_THRESHOLDS.STRONG) {
    return 70 + (pct - DEMOGRAPHIC_THRESHOLDS.STRONG) / 5 * 9;
  } else if (pct >= DEMOGRAPHIC_THRESHOLDS.GOOD) {
    return 60 + (pct - DEMOGRAPHIC_THRESHOLDS.GOOD) / 5 * 9;
  } else if (pct >= DEMOGRAPHIC_THRESHOLDS.AVERAGE) {
    return 50 + (pct - DEMOGRAPHIC_THRESHOLDS.AVERAGE) / 5 * 9;
  } else if (pct >= DEMOGRAPHIC_THRESHOLDS.WEAK) {
    return 40 + (pct - DEMOGRAPHIC_THRESHOLDS.WEAK) / 5 * 9;
  } else if (pct >= DEMOGRAPHIC_THRESHOLDS.POOR) {
    return 20 + (pct - DEMOGRAPHIC_THRESHOLDS.POOR) / 5 * 19;
  } else {
    return Math.max(0, pct / DEMOGRAPHIC_THRESHOLDS.POOR * 19);
  }
}

// Enhanced demographic score calculation
export function calculateEnhancedDemographicScore(
  geoId: string,
  input: ValidatedInput,
  percentages: PercentageResults,
  maxPercentages: MaxPercentages
): number {
  const { ethnicPercent, genderPercent, agePercent, incomePercent } = percentages;
  
  console.log(`[Demographic] Calculating enhanced score for ${geoId}`);

  // Enhanced demographic scoring with research-backed thresholds
  if (input.demographicScoring && input.demographicScoring.weights) {
    console.log('[Demographic] Using advanced demographic scoring with research thresholds');
    const { weights: demoWeights } = input.demographicScoring;
    let weightedScore = 0;
    let totalWeight = 0;

    if (input.ethnicities.length > 0 && ethnicPercent[geoId] !== undefined) {
      const ethnicValue = ethnicPercent[geoId];
      const numericValue = typeof ethnicValue === 'number' ? ethnicValue : 0;
      const ethnicScore = scorePercentageMatch(numericValue) / 100;
      weightedScore += ethnicScore * demoWeights.ethnicity;
      totalWeight += demoWeights.ethnicity;
      console.log(`[Demographic] ${geoId} ethnicity: ${(numericValue * 100).toFixed(2)}% = score ${(ethnicScore * 100).toFixed(1)}`);
    }

    if (input.genders.length > 0 && genderPercent[geoId] !== undefined) {
      const genderValue = genderPercent[geoId];
      const numericValue = typeof genderValue === 'number' ? genderValue : 0;
      const genderScore = scorePercentageMatch(numericValue) / 100;
      weightedScore += genderScore * demoWeights.gender;
      totalWeight += demoWeights.gender;
      console.log(`[Demographic] ${geoId} gender: ${(numericValue * 100).toFixed(2)}% = score ${(genderScore * 100).toFixed(1)}`);
    }

    if (input.ageRange && agePercent[geoId] !== undefined) {
      const ageValue = agePercent[geoId];
      const numericValue = typeof ageValue === 'number' ? ageValue : 0;
      const ageScore = scorePercentageMatch(numericValue) / 100;
      weightedScore += ageScore * demoWeights.age;
      totalWeight += demoWeights.age;
      console.log(`🧬 [Demographic] ${geoId} age: ${(numericValue * 100).toFixed(2)}% = score ${(ageScore * 100).toFixed(1)}`);
    }

    if (input.incomeRange && incomePercent[geoId] !== undefined) {
      const incomeValue = incomePercent[geoId];
      const numericValue = typeof incomeValue === 'number' ? incomeValue : 0;
      const incomeScore = scorePercentageMatch(numericValue) / 100;
      weightedScore += incomeScore * demoWeights.income;
      totalWeight += demoWeights.income;
      console.log(`[Demographic] ${geoId} income: ${(numericValue * 100).toFixed(2)}% = score ${(incomeScore * 100).toFixed(1)}`);
    }

    let finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    finalScore = Math.min(1, Math.max(0, finalScore));
    console.log(`[Demographic] Final enhanced score for ${geoId}: ${finalScore.toFixed(3)}`);
    return finalScore;
  } else {
    // Fallback: Use research-backed scoring
    console.log('[Demographic] Using research-backed threshold scoring (no custom weights)');
    const scores: number[] = [];

    if (input.ethnicities.length > 0 && ethnicPercent[geoId] !== undefined) {
      const ethnicValue = ethnicPercent[geoId];
      const numericValue = typeof ethnicValue === 'number' ? ethnicValue : 0;
      const score = scorePercentageMatch(numericValue) / 100;
      scores.push(score);
      console.log(`[Demographic] ${geoId} ethnicity: ${(numericValue * 100).toFixed(2)}% = score ${(score * 100).toFixed(1)}`);
    }

    if (input.genders.length > 0 && genderPercent[geoId] !== undefined) {
      const genderValue = genderPercent[geoId];
      const numericValue = typeof genderValue === 'number' ? genderValue : 0;
      const score = scorePercentageMatch(numericValue) / 100;
      scores.push(score);
      console.log(`[Demographic] ${geoId} gender: ${(numericValue * 100).toFixed(2)}% = score ${(score * 100).toFixed(1)}`);
    }

    if (input.ageRange && agePercent[geoId] !== undefined) {
      const ageValue = agePercent[geoId];
      const numericValue = typeof ageValue === 'number' ? ageValue : 0;
      const score = scorePercentageMatch(numericValue) / 100;
      scores.push(score);
      console.log(`[Demographic] ${geoId} age: ${(numericValue * 100).toFixed(2)}% = score ${(score * 100).toFixed(1)}`);
    }

    if (input.incomeRange && incomePercent[geoId] !== undefined) {
      const incomeValue = incomePercent[geoId];
      const numericValue = typeof incomeValue === 'number' ? incomeValue : 0;
      const score = scorePercentageMatch(numericValue) / 100;
      scores.push(score);
      console.log(`[Demographic] ${geoId} income: ${(numericValue * 100).toFixed(2)}% = score ${(score * 100).toFixed(1)}`);
    }

    const finalScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    console.log(`[Demographic] Average threshold-based score for ${geoId}: ${finalScore.toFixed(3)}`);
    return finalScore;
  }
}

// Simple condition evaluator for threshold bonuses/penalties
export function evaluateCondition(condition: string, tractData: any): boolean {
  try {
    const operators = ['>=', '<=', '>', '<', '==', '!='];
    let operator: string | null = null;
    let parts: string[] = [];

    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        parts = condition.split(op).map(p => p.trim());
        break;
      }
    }

    if (!operator || parts.length !== 2) {
      console.warn('Invalid condition format:', condition);
      return false;
    }

    const [leftSide, rightSide] = parts;
    const leftValue = tractData[leftSide];
    const rightValue = parseFloat(rightSide);

    if (leftValue === undefined || isNaN(rightValue)) {
      console.warn('Invalid condition values:', leftSide, '=', leftValue, operator, rightValue);
      return false;
    }

    const numericLeftValue = typeof leftValue === 'number' ? leftValue : parseFloat(leftValue);
    if (isNaN(numericLeftValue)) {
      console.warn('Left value is not numeric:', leftValue);
      return false;
    }

    switch (operator) {
      case '>=':
        return numericLeftValue >= rightValue;
      case '<=':
        return numericLeftValue <= rightValue;
      case '>':
        return numericLeftValue > rightValue;
      case '<':
        return numericLeftValue < rightValue;
      case '==':
        return numericLeftValue == rightValue;
      case '!=':
        return numericLeftValue != rightValue;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error evaluating condition:', condition, error);
    return false;
  }
}