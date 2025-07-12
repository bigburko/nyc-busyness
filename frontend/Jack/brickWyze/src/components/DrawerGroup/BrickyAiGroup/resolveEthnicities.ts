import { ethnicityData } from '../../DemographicGroup/RaceDropDownGroup/ethnicityData';

// Hierarchical mapping with fuzzy matching support
const ETHNICITY_MAPPINGS: Record<string, string[]> = {
  // Make these more specific to avoid too many results
  'white': ['W'], // Just use the root category
  'european': ['WEur'], // Specific European subcategory
  'middleeastern': ['WMENA'], // Keep specific
  
  // Keep everything else the same...
  'asian': ['AEA', 'ASA', 'ASEA', 'ACA'],
  'black': ['BAfrAm', 'BCrb', 'BSSAf'],
  'hispanic': ['H'],
  'latino': ['H'],
  'nativeamerican': ['AIANA'],
  'americanindian': ['AIANA'],
  'pacificislander': ['NHPI'],
  'someotherrace': ['SOR'],
  
  // Asian subcategories
  'southasian': ['ASA'],
  'eastasian': ['AEA'],
  'southeastasian': ['ASEA'],
  'centralasian': ['ACA'],
  
  // Specific groups
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
  
  // Black subcategories
  'africanamerican': ['BAfrAm'],
  'caribbean': ['BCrb'],
  'subsaharanafrican': ['BSSAf'],
  'jamaican': ['BCrbJmcn'],
  'haitian': ['BCrbHtn'],
  'nigerian': ['BSSAfNgrn'],
  
  // Hispanic variations
  'latinx': ['H'],
  'mexican': ['HMex'],
  'dominican': ['HCHDmncn'],
  'puertoricans': ['HCHPrtRcn'],
  'cuban': ['HCHCuban'],
  'colombian': ['HSAClmbn'],
  'salvadoran': ['HCASlvdrn'],
  
  // Add some specific white ethnicities
  'italian': ['WEurItln'],
  'irish': ['WEurIrsh'],
  'german': ['WEurGrmn'],
  'polish': ['WEurPlsh'],
  'russian': ['WEurRsn'],
  'arab': ['WMENAArab'],
  'iranian': ['WMENAIrn'],
  'turkish': ['WEurTrksh'],
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

    // 1. Try exact mapping first
    if (ETHNICITY_MAPPINGS[normalized]) {
      ETHNICITY_MAPPINGS[normalized].forEach(code => {
        const items = getEthnicityItemsByCode(code);
        items.forEach(item => resolved.add(item.value));
      });
      matched = true;
      continue;
    }

    // 2. Try fuzzy label matching
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

    // 3. Try parent group matching as last resort
    if (!matched) {
      for (const item of ethnicityData) {
        if (item.parent === item.value) continue; // Skip root categories
        
        const parentNormalized = item.parent.toLowerCase();
        if (parentNormalized === normalized) {
          resolved.add(item.value);
          matched = true;
        }
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

// Helper function to get ethnicity items by parent code
function getEthnicityItemsByCode(parentCode: string) {
  return ethnicityData.filter(item => 
    item.value === parentCode || item.parent === parentCode
  );
}

// Export for debugging/testing
export { ETHNICITY_MAPPINGS };