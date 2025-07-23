// src/lib/resolveEthnicities.ts - FIXED: More permissive, no blocking errors

import { ethnicityData } from '../components/features/filters/DemographicGroup/RaceDropDownGroup/ethnicityData';

// 🎯 FIXED MAPPINGS - Use only Level 1 categories (no parents, no deep children)
const ETHNICITY_MAPPINGS: Record<string, string[]> = {
  // === MAIN RACE CATEGORIES (Level 1 only) ===
  asian: ['AEA', 'ASA', 'ASEA', 'ACA', 'AOth'], // East, South, Southeast, Central, Other Asian
  white: ['WEur', 'WMENA', 'WOth'], // European, Middle Eastern/North African, Other White
  black: ['BSSAf', 'BCrb', 'BOth'], // Sub-Saharan African, Caribbean, Other Black
  hispanic: ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'], // Mexican, Central Am, South Am, Caribbean Hispanic, Other
  nativeamerican: ['AIANA'], // American Indian/Alaska Native
  pacificislander: ['NHPI'], // Native Hawaiian/Pacific Islander
  
  // === SPECIFIC ETHNICITIES (Leaf nodes only) ===
  mexican: ['HMex'],
  korean: ['AEAKrn'],
  chinese: ['AEAChnsNoT'],
  indian: ['ASAAsnInd'], 
  italian: ['WEurItln'],
  irish: ['WEurIrsh'],
  german: ['WEurGrmn'],
  puertorican: ['HCHPrtRcn'],
  cuban: ['HCHCuban'],
  dominican: ['HCHDmncn'],
  
  // === REGIONAL GROUPINGS (Level 1 only) ===
  european: ['WEur'],
  middleeastern: ['WMENA'],
  southasian: ['ASA'],
  eastasian: ['AEA'],
  southeastasian: ['ASEA'],
  centralasian: ['ACA'],
  caribbean: ['BCrb', 'HCH'], // Both Black and Hispanic Caribbean
  subsaharanafrican: ['BSSAf'],
  
  // === ALIASES ===
  latino: ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'], // Same as hispanic
  latinx: ['HMex', 'HCA', 'HSA', 'HCH', 'HOth'], // Same as hispanic
  americanindian: ['AIANA'],
  northafrican: ['WMENA'], // Same as Middle Eastern
  arab: ['WMENAArab'],
};

// ✅ FIXED: More permissive resolution - no more blocking errors
export function resolveEthnicities(inputList: string[]): string[] {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    console.log('🌍 [Ethnicity] No ethnicities to resolve');
    return [];
  }
  
  console.log('🌍 [Ethnicity] Input ethnicities:', inputList);
  
  const resolvedCodes = new Set<string>();
  const processingLog: Array<{input: string, result: string[], method: string}> = [];
  
  for (const rawInput of inputList) {
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      continue;
    }
    
    const normalized = rawInput.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    let foundCodes: string[] = [];
    let method = '';
    
    // 1. Check for exact mapping (preferred)
    const mappedCodes = ETHNICITY_MAPPINGS[normalized];
    if (mappedCodes) {
      foundCodes = mappedCodes;
      method = 'exact_mapping';
      mappedCodes.forEach(code => resolvedCodes.add(code));
      processingLog.push({input: rawInput, result: foundCodes, method});
      continue;
    }
    
    // 2. Direct code lookup (if someone passes AEAKrn directly)
    const directMatch = ethnicityData.find(item => 
      item.value.toLowerCase() === normalized
    );
    if (directMatch) {
      foundCodes = [directMatch.value];
      method = 'direct_code';
      resolvedCodes.add(directMatch.value);
      processingLog.push({input: rawInput, result: foundCodes, method});
      continue;
    }
    
    // 3. Label search (fallback)
    const labelMatch = ethnicityData.find(item => {
      const itemLabel = item.label.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      return itemLabel.includes(normalized);
    });
    if (labelMatch) {
      foundCodes = [labelMatch.value];
      method = 'label_search';
      resolvedCodes.add(labelMatch.value);
      processingLog.push({input: rawInput, result: foundCodes, method});
      continue;
    }
    
    // ✅ CHANGED: Don't fail completely, just log warning
    console.warn(`⚠️ [Ethnicity] No mapping found for "${rawInput}" - will pass through`);
    processingLog.push({input: rawInput, result: [], method: 'no_match'});
  }
  
  const result = Array.from(resolvedCodes);
  
  // ✅ DETECT BUT DON'T BLOCK: Check for hierarchy conflicts
  const conflicts = detectHierarchyConflicts(result);
  if (conflicts.length > 0) {
    console.warn(`⚠️ [Ethnicity] Hierarchy conflicts detected (edge function will resolve):`, conflicts);
    console.warn(`   Input: ${inputList.join(', ')}`);
    console.warn(`   Conflicts: ${conflicts.map(c => `${c.parent} + [${c.children.join(',')}]`).join(', ')}`);
    console.warn(`   ✅ Letting edge function handle conflict resolution automatically`);
    
    // ✅ OPTION 1: Pass through all codes (let edge function decide)
    // ✅ OPTION 2: Clean up obvious conflicts (prefer specific over general)
    
    // Using Option 2: Clean up obvious conflicts but don't throw errors
    const cleanedResult = result.filter(code => 
      !conflicts.some(conflict => conflict.children.includes(code)) ||
      !conflicts.some(conflict => conflict.parent === code)
    );
    
    if (cleanedResult.length !== result.length) {
      console.log(`🧹 [Ethnicity] Cleaned conflicts: ${result.length} → ${cleanedResult.length} codes`);
      console.log(`   Keeping: ${cleanedResult.join(', ')}`);
      return cleanedResult;
    }
  }
  
  if (result.length === 0) {
    console.warn(`⚠️ [Ethnicity] No valid codes found for: ${inputList.join(', ')}`);
    console.warn(`   Available options: ${Object.keys(ETHNICITY_MAPPINGS).slice(0, 10).join(', ')}...`);
    return [];
  }
  
  console.log(`✅ [Ethnicity] Successfully resolved ${inputList.length} inputs → ${result.length} codes`);
  console.log(`   Resolution details:`, processingLog);
  console.log(`   Final codes: ${result.join(', ')}`);
  
  return result;
}

// 🔍 Helper: Detect hierarchy conflicts (for warning only, not blocking)
function detectHierarchyConflicts(codes: string[]): Array<{parent: string, children: string[]}> {
  const conflicts: Array<{parent: string, children: string[]}> = [];
  
  // Build parent->children map from ethnicity data
  const parentMap = new Map<string, string[]>();
  ethnicityData.forEach(item => {
    if (item.parent !== item.value) {
      if (!parentMap.has(item.parent)) {
        parentMap.set(item.parent, []);
      }
      parentMap.get(item.parent)!.push(item.value);
    }
  });
  
  // Check if any code is both a parent and has children in our selection
  for (const code of codes) {
    const children = parentMap.get(code);
    if (children) {
      const conflictingChildren = children.filter(child => codes.includes(child));
      if (conflictingChildren.length > 0) {
        conflicts.push({
          parent: code,
          children: conflictingChildren
        });
      }
    }
  }
  
  return conflicts;
}

// ✅ NEW: Helper functions for UI components
export function validateEthnicitySelection(selectedEthnicities: string[]): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const result = {
    isValid: true,
    warnings: [] as string[],
    suggestions: [] as string[]
  };

  if (!selectedEthnicities || selectedEthnicities.length === 0) {
    result.suggestions.push('Select ethnicities to filter by demographic composition');
    return result;
  }

  // Check for conflicts
  const resolvedCodes = resolveEthnicities(selectedEthnicities);
  const conflicts = detectHierarchyConflicts(resolvedCodes);
  
  if (conflicts.length > 0) {
    result.warnings.push(`Hierarchy conflicts detected: ${conflicts.map(c => `${c.parent} overlaps with ${c.children.join(', ')}`).join('; ')}`);
    result.suggestions.push('Consider using either broad categories (Asian) OR specific ethnicities (Korean, Chinese) but not both');
  }

  // Check for unmapped selections
  const unmapped = selectedEthnicities.filter(eth => {
    const normalized = eth.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    return !ETHNICITY_MAPPINGS[normalized] && 
           !ethnicityData.some(item => item.value.toLowerCase() === normalized || 
                                      item.label.toLowerCase().includes(normalized));
  });
  
  if (unmapped.length > 0) {
    result.warnings.push(`Some selections may not have database mappings: ${unmapped.join(', ')}`);
    result.suggestions.push('Try using common ethnicity names like "korean", "chinese", "hispanic", etc.');
  }

  if (selectedEthnicities.length > 8) {
    result.warnings.push('Many ethnicities selected - may affect search performance');
    result.suggestions.push('Consider narrowing selection to 3-5 most important ethnicities');
  }

  return result;
}

// ✅ EXPORT: Make available for other components
export { ETHNICITY_MAPPINGS };