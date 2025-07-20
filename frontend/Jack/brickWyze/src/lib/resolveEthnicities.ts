// src/lib/resolveEthnicities.ts - FIXED: No more hierarchy overcounting

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

// 🚫 NO MORE HIERARCHY TRAVERSAL - Use exact mappings only
export function resolveEthnicities(inputList: string[]): string[] {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    return [];
  }
  
  console.log('🎯 [Input Ethnicities]', inputList);
  
  const resolvedCodes = new Set<string>();
  
  for (const rawInput of inputList) {
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      continue;
    }
    
    const normalized = rawInput.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    
    // 1. Check for exact mapping (preferred)
    const mappedCodes = ETHNICITY_MAPPINGS[normalized];
    if (mappedCodes) {
      mappedCodes.forEach(code => resolvedCodes.add(code));
      continue;
    }
    
    // 2. Direct code lookup (if someone passes AEAKrn directly)
    const directMatch = ethnicityData.find(item => 
      item.value.toLowerCase() === normalized
    );
    if (directMatch) {
      resolvedCodes.add(directMatch.value);
      continue;
    }
    
    // 3. Label search (fallback)
    const labelMatch = ethnicityData.find(item => {
      const itemLabel = item.label.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      return itemLabel.includes(normalized);
    });
    if (labelMatch) {
      resolvedCodes.add(labelMatch.value);
    }
  }
  
  if (resolvedCodes.size === 0) {
    console.warn(`[ResolveEthnicities] Could not find a match for any input in:`, inputList);
    return [];
  }
  
  const result = Array.from(resolvedCodes);
  
  // 🚨 ANTI-OVERCOUNTING VALIDATION
  const parentChildConflicts = detectHierarchyConflicts(result);
  if (parentChildConflicts.length > 0) {
    console.error(`❌ [HIERARCHY CONFLICTS DETECTED]:`, parentChildConflicts);
    console.error(`   This will cause overcounting! Using parent categories only.`);
    
    // Remove child categories, keep only parents
    const cleanedResult = result.filter(code => 
      !parentChildConflicts.some(conflict => conflict.children.includes(code))
    );
    console.log(`✅ [Cleaned Ethnicities] ${cleanedResult.length} codes (conflicts removed):`, cleanedResult);
    return cleanedResult;
  }
  
  console.log(`✅ [Resolved Ethnicities] ${result.length} codes found:`, result);
  return result;
}

// 🔍 Helper: Detect if we're mixing parent + child categories
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