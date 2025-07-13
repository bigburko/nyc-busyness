import { ethnicityData } from '../../DemographicGroup/RaceDropDownGroup/ethnicityData';

// Comprehensive ethnicity mappings based on your actual data structure
const ETHNICITY_MAPPINGS: Record<string, string[]> = {
  // ===== WHITE CATEGORY - Include ALL White subcategories =====
  'white': [
    'W',  // Root White category
    // European subcategory + ALL European ethnicities
    'WEur', 'WEurAlbn', 'WEurArmn', 'WEurAstrn', 'WEurAzrbjn', 'WEurBlrsn', 
    'WEurBlgn', 'WEurBsHrz', 'WEurBrtsh', 'WEurBlgrn', 'WEurCrtn', 'WEurCyprt',
    'WEurCzch', 'WEurDnsh', 'WEurDtch', 'WEurEnglsh', 'WEurEstn', 'WEurFnnsh',
    'WEurFrnch', 'WEurGrgn', 'WEurGrmn', 'WEurGrk', 'WEurHngrn', 'WEurIrsh',
    'WEurItln', 'WEurKsvn', 'WEurLtvn', 'WEurLthn', 'WEurMcdn', 'WEurMlts',
    'WEurMldvn', 'WEurMntgrn', 'WEurNrwgn', 'WEurPlsh', 'WEurPrtgs', 'WEurRmn',
    'WEurRsn', 'WEurScndvn', 'WEurStIrsh', 'WEurSctsh', 'WEurSrbn', 'WEurSlvc',
    'WEurSlvk', 'WEurSlvn', 'WEurSwdsh', 'WEurSwiss', 'WEurTrksh', 'WEurUrkrn', 'WEurWlsh',
    // Middle Eastern/North African subcategory + ALL MENA ethnicities
    'WMENA', 'WMENAAlgrn', 'WMENAArab', 'WMENAEgptn', 'WMENAIrn', 'WMENAIrq',
    'WMENAIsrl', 'WMENAJrdn', 'WMENALbns', 'WMENAMrcn', 'WMENAPlstn', 'WMENASyrn',
    'WMENATnsn', 'WMENAYmn',
    // Other White subcategory + ALL Other White ethnicities
    'WOth', 'WOthAstrln', 'WOthCndn', 'WOthFrCndn', 'WOthNZlndr'
  ],

  // ===== HISPANIC CATEGORY - Include ALL Hispanic subcategories =====
  'hispanic': [
    'H',  // Root Hispanic category
    'HMex',  // Mexican
    // Central American subcategory + ALL Central American ethnicities
    'HCA', 'HCACstRcn', 'HCAGutmln', 'HCAHndrn', 'HCANcrgn', 'HCAPnmn', 'HCASlvdrn',
    // South American subcategory + ALL South American ethnicities
    'HSA', 'HSAArgntn', 'HSABlvn', 'HSAChln', 'HSAClmbn', 'HSAEcudrn', 'HSAPrguyn',
    'HSAPrvn', 'HSAUrgyn', 'HSAVnzuln',
    // Caribbean Hispanic subcategory + ALL Caribbean Hispanic ethnicities
    'HCH', 'HCHCuban', 'HCHDmncn', 'HCHPrtRcn',
    // Other Hispanic subcategory + ALL Other Hispanic ethnicities
    'HOth', 'HOthSpnrd', 'HOthSpnsh', 'HOthSpnAm', 'HOthGrfna'
  ],

  // ===== BLACK CATEGORY - Include ALL Black subcategories =====
  'black': [
    'B',  // Root Black category
    'BAfrAm',  // African American
    // Sub-Saharan African subcategory + ALL Sub-Saharan ethnicities
    'BSSAf', 'BSSAfBrknb', 'BSSAfCmrn', 'BSSAfCngls', 'BSSAfEthpn', 'BSSAfGmbn',
    'BSSAfGhn', 'BSSAfGnn', 'BSSAfIvrn', 'BSSAfKnyn', 'BSSAfLbrn', 'BSSAfMln',
    'BSSAfNgrn', 'BSSAfSngls', 'BSSAfSrLn', 'BSSAfSAfr', 'BSSAfSdns', 'BSSAfTgls',
    // Caribbean subcategory + ALL Caribbean ethnicities
    'BCrb', 'BCrbAntBrb', 'BCrbBhmn', 'BCrbBrbdn', 'BCrbDmncIs', 'BCrbGrndn',
    'BCrbHtn', 'BCrbJmcn', 'BCrbKtnNev', 'BCrbStLuc', 'BCrbTrTob', 'BCrbUSVgIs',
    'BCrbVncntn', 'BCrbWind',
    // Other Black
    'BOth'
  ],

  // ===== ASIAN CATEGORY - Include ALL Asian subcategories =====
  'asian': [
    'A',  // Root Asian category
    // East Asian subcategory + ALL East Asian ethnicities
    'AEA', 'AEAChnsNoT', 'AEAJpns', 'AEAKrn', 'AEATwns',
    // Central Asian subcategory + ALL Central Asian ethnicities
    'ACA', 'ACAAfghan', 'ACAKazakh', 'ACAKyrgyz', 'ACATajik', 'ACAUzbek',
    // South Asian subcategory + ALL South Asian ethnicities
    'ASA', 'ASAAsnInd', 'ASABngldsh', 'ASANpls', 'ASAPkstn', 'ASASikh', 'ASASrLnkn',
    // Southeast Asian subcategory + ALL Southeast Asian ethnicities
    'ASEA', 'ASEABrms', 'ASEACmbdn', 'ASEAFlpn', 'ASEAIndnsn', 'ASEAMlysn',
    'ASEASngprn', 'ASEAThai', 'ASEAVtnms',
    // Other Asian
    'AOth'
  ],

  // ===== More specific subcategories =====
  'european': [
    'WEur', 'WEurAlbn', 'WEurArmn', 'WEurAstrn', 'WEurAzrbjn', 'WEurBlrsn', 
    'WEurBlgn', 'WEurBsHrz', 'WEurBrtsh', 'WEurBlgrn', 'WEurCrtn', 'WEurCyprt',
    'WEurCzch', 'WEurDnsh', 'WEurDtch', 'WEurEnglsh', 'WEurEstn', 'WEurFnnsh',
    'WEurFrnch', 'WEurGrgn', 'WEurGrmn', 'WEurGrk', 'WEurHngrn', 'WEurIrsh',
    'WEurItln', 'WEurKsvn', 'WEurLtvn', 'WEurLthn', 'WEurMcdn', 'WEurMlts',
    'WEurMldvn', 'WEurMntgrn', 'WEurNrwgn', 'WEurPlsh', 'WEurPrtgs', 'WEurRmn',
    'WEurRsn', 'WEurScndvn', 'WEurStIrsh', 'WEurSctsh', 'WEurSrbn', 'WEurSlvc',
    'WEurSlvk', 'WEurSlvn', 'WEurSwdsh', 'WEurSwiss', 'WEurTrksh', 'WEurUrkrn', 'WEurWlsh'
  ],

  'middleeastern': [
    'WMENA', 'WMENAAlgrn', 'WMENAArab', 'WMENAEgptn', 'WMENAIrn', 'WMENAIrq',
    'WMENAIsrl', 'WMENAJrdn', 'WMENALbns', 'WMENAMrcn', 'WMENAPlstn', 'WMENASyrn',
    'WMENATnsn', 'WMENAYmn'
  ],

  // Asian subcategories
  'southasian': ['ASA', 'ASAAsnInd', 'ASABngldsh', 'ASANpls', 'ASAPkstn', 'ASASikh', 'ASASrLnkn'],
  'eastasian': ['AEA', 'AEAChnsNoT', 'AEAJpns', 'AEAKrn', 'AEATwns'],
  'southeastasian': ['ASEA', 'ASEABrms', 'ASEACmbdn', 'ASEAFlpn', 'ASEAIndnsn', 'ASEAMlysn', 'ASEASngprn', 'ASEAThai', 'ASEAVtnms'],
  'centralasian': ['ACA', 'ACAAfghan', 'ACAKazakh', 'ACAKyrgyz', 'ACATajik', 'ACAUzbek'],

  // Black subcategories
  'africanamerican': ['BAfrAm'],
  'caribbean': ['BCrb', 'BCrbAntBrb', 'BCrbBhmn', 'BCrbBrbdn', 'BCrbDmncIs', 'BCrbGrndn', 'BCrbHtn', 'BCrbJmcn', 'BCrbKtnNev', 'BCrbStLuc', 'BCrbTrTob', 'BCrbUSVgIs', 'BCrbVncntn', 'BCrbWind'],
  'subsaharanafrican': ['BSSAf', 'BSSAfBrknb', 'BSSAfCmrn', 'BSSAfCngls', 'BSSAfEthpn', 'BSSAfGmbn', 'BSSAfGhn', 'BSSAfGnn', 'BSSAfIvrn', 'BSSAfKnyn', 'BSSAfLbrn', 'BSSAfMln', 'BSSAfNgrn', 'BSSAfSngls', 'BSSAfSrLn', 'BSSAfSAfr', 'BSSAfSdns', 'BSSAfTgls'],

  // Hispanic variations and aliases
  'latino': [
    'H', 'HMex', 'HCA', 'HCACstRcn', 'HCAGutmln', 'HCAHndrn', 'HCANcrgn', 'HCAPnmn', 'HCASlvdrn',
    'HSA', 'HSAArgntn', 'HSABlvn', 'HSAChln', 'HSAClmbn', 'HSAEcudrn', 'HSAPrguyn', 'HSAPrvn', 'HSAUrgyn', 'HSAVnzuln',
    'HCH', 'HCHCuban', 'HCHDmncn', 'HCHPrtRcn', 'HOth', 'HOthSpnrd', 'HOthSpnsh', 'HOthSpnAm', 'HOthGrfna'
  ],
  'latinx': [
    'H', 'HMex', 'HCA', 'HCACstRcn', 'HCAGutmln', 'HCAHndrn', 'HCANcrgn', 'HCAPnmn', 'HCASlvdrn',
    'HSA', 'HSAArgntn', 'HSABlvn', 'HSAChln', 'HSAClmbn', 'HSAEcudrn', 'HSAPrguyn', 'HSAPrvn', 'HSAUrgyn', 'HSAVnzuln',
    'HCH', 'HCHCuban', 'HCHDmncn', 'HCHPrtRcn', 'HOth', 'HOthSpnrd', 'HOthSpnsh', 'HOthSpnAm', 'HOthGrfna'
  ],

  // Specific country/ethnicity mappings
  'mexican': ['HMex'],
  'cuban': ['HCHCuban'],
  'dominican': ['HCHDmncn'],
  'puertoricans': ['HCHPrtRcn'],
  'colombian': ['HSAClmbn'],
  'peruvian': ['HSAPrvn'],
  'ecuadorian': ['HSAEcudrn'],
  'salvadoran': ['HCASlvdrn'],
  'guatemalan': ['HCAGutmln'],
  'honduran': ['HCAHndrn'],
  'nicaraguan': ['HCANcrgn'],
  'argentinean': ['HSAArgntn'],
  'venezuelan': ['HSAVnzuln'],

  'italian': ['WEurItln'],
  'irish': ['WEurIrsh'], 
  'german': ['WEurGrmn'],
  'polish': ['WEurPlsh'],
  'russian': ['WEurRsn'],
  'english': ['WEurEnglsh'],
  'french': ['WEurFrnch'],
  'greek': ['WEurGrk'],
  'swedish': ['WEurSwdsh'],
  'norwegian': ['WEurNrwgn'],
  'danish': ['WEurDnsh'],
  'finnish': ['WEurFnnsh'],
  'british': ['WEurBrtsh'],
  'scottish': ['WEurSctsh'],
  'welsh': ['WEurWlsh'],

  'chinese': ['AEAChnsNoT'],
  'japanese': ['AEAJpns'],
  'korean': ['AEAKrn'],
  'taiwanese': ['AEATwns'],
  'filipino': ['ASEAFlpn'],
  'vietnamese': ['ASEAVtnms'],
  'thai': ['ASEAThai'],
  'indonesian': ['ASEAIndnsn'],
  'cambodian': ['ASEACmbdn'],
  'indian': ['ASAAsnInd'],
  'pakistani': ['ASAPkstn'],
  'bangladeshi': ['ASABngldsh'],
  'srilankan': ['ASASrLnkn'],
  'nepalese': ['ASANpls'],

  'jamaican': ['BCrbJmcn'],
  'haitian': ['BCrbHtn'],
  'nigerian': ['BSSAfNgrn'],
  'ghanaian': ['BSSAfGhn'],
  'ethiopian': ['BSSAfEthpn'],
  'kenyan': ['BSSAfKnyn'],

  'arab': ['WMENAArab'],
  'iranian': ['WMENAIrn'],
  'lebanese': ['WMENALbns'],
  'syrian': ['WMENASyrn'],
  'egyptian': ['WMENAEgptn'],
  'moroccan': ['WMENAMrcn'],
  'palestinian': ['WMENAPlstn'],

  // Other categories
  'nativeamerican': ['AIANA'],
  'americanindian': ['AIANA'],
  'pacificislander': ['NHPI'],
  'someotherrace': ['SOR'],
};

export function resolveEthnicities(inputList: string[]): string[] {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    return [];
  }

  console.log('🎯 [Input Ethnicities]', inputList);
  
  const resolved = new Set<string>();
  const unresolved: string[] = []; 

  for (const rawInput of inputList) {
    if (!rawInput || typeof rawInput !== 'string') continue;
    
    const normalized = rawInput.toLowerCase().replace(/[^a-z]/g, '');
    
    // Skip single characters to avoid garbage input
    if (normalized.length <= 1) {
      console.warn(`⚠️ Skipping single character input: "${rawInput}"`);
      unresolved.push(rawInput);
      continue;
    }

    let matched = false;

    // 1. Try exact mapping first - this will now include ALL subcategories
    if (ETHNICITY_MAPPINGS[normalized]) {
      ETHNICITY_MAPPINGS[normalized].forEach(code => {
        resolved.add(code);
      });
      matched = true;
      continue;
    }

    // 2. Try fuzzy label matching (fallback)
    for (const item of ethnicityData) {
      const labelNormalized = item.label.toLowerCase().replace(/[^a-z]/g, '');
      
      // Exact label match
      if (labelNormalized === normalized) {
        resolved.add(item.value);
        matched = true;
        break;
      }
      
      // Partial label match (must be substantial - at least 4 chars)
      if (normalized.length >= 4 && labelNormalized.includes(normalized)) {
        resolved.add(item.value);
        matched = true;
        break;
      }
    }

    if (!matched) {
      unresolved.push(rawInput);
    }
  }

  const result = Array.from(resolved);
  
  // Log results for debugging
  console.log('✅ [Resolved Ethnicities]', result);
  if (unresolved.length > 0) {
    console.warn('⚠️ [Unresolved Ethnicities]', unresolved);
  }
  
  return result;
}

// Export for debugging/testing
export { ETHNICITY_MAPPINGS };