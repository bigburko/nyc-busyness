// src/components/DrawerGroup/BrickyAiGroup/resolveEthnicities.ts

import { ethnicityData } from '../../DemographicGroup/RaceDropDownGroup/ethnicityData';

// --- MAPPINGS ---
// This map is kept simple. It connects a user-friendly term to the TOP-LEVEL parent code in your data.
// The hierarchy traversal logic below will handle finding all the children.
const ETHNICITY_MAPPINGS: Record<string, string[]> = {
  // Top-level race categories
  asian: ['A'],
  white: ['W'],
  black: ['B'],
  hispanic: ['H'],
  latino: ['H'],
  latinx: ['H'],
  nativeamerican: ['AIANA'],
  americanindian: ['AIANA'],
  pacificislander: ['NHPI'],
  someotherrace: ['SOR'],

  // Common subcategories that users might ask for directly
  european: ['WEur'],
  middleeastern: ['WMENA'],
  northafrican: ['WMENA'], // Alias for Middle Eastern
  southasian: ['ASA'],
  eastasian: ['AEA'],
  southeastasian: ['ASEA'],
  centralasian: ['ACA'],
  caribbean: ['BCrb', 'HCH'], // Can be Black or Hispanic Caribbean
  subsaharanafrican: ['BSSAf'],
  
  // Aliases for specific, commonly requested groups
  mexican: ['HMex'],
  puertorican: ['HCHPrtRcn'],
  dominican: ['HCHDmncn'],
  cuban: ['HCHCuban'],
  italian: ['WEurItln'],
  irish: ['WEurIrsh'],
  german: ['WEurGrmn'],
  chinese: ['AEAChnsNoT'],
  korean: ['AEAKrn'],
  indian: ['ASAAsnInd'],
  arab: ['WMENAArab'],
};

// --- HIERARCHY TRAVERSAL LOGIC ---
// Create a map for quick lookups of children for any given parent code.
// This is built once when the module is loaded.
const parentToChildrenMap = new Map<string, string[]>();
ethnicityData.forEach(item => {
  if (item.parent !== item.value) { // Don't map a group to itself as a child
    if (!parentToChildrenMap.has(item.parent)) {
      parentToChildrenMap.set(item.parent, []);
    }
    parentToChildrenMap.get(item.parent)!.push(item.value);
  }
});

/**
 * Traverses the ethnicity hierarchy to find all descendant codes for a given set of starting codes.
 * For example, starting with ['W'] will return all codes related to the White category.
 * @param startCodes - An array of parent codes to begin the search from (e.g., ['W']).
 * @returns A Set of all unique ethnicity codes found in the hierarchy.
 */
function getAllDescendantCodes(startCodes: string[]): Set<string> {
  const allCodes = new Set<string>();
  const queue = [...startCodes]; // A list of codes to visit

  while (queue.length > 0) {
    const currentCode = queue.shift();
    if (!currentCode || allCodes.has(currentCode)) {
      continue;
    }

    allCodes.add(currentCode);
    const children = parentToChildrenMap.get(currentCode);

    if (children) {
      for (const child of children) {
        if (!allCodes.has(child)) {
          queue.push(child);
        }
      }
    }
  }
  return allCodes;
}


// --- MAIN RESOLVER FUNCTION ---
export function resolveEthnicities(inputList: string[]): string[] {
  if (!Array.isArray(inputList) || inputList.length === 0) {
    return [];
  }
  console.log('🎯 [Input Ethnicities]', inputList);

  const resolvedParentCodes = new Set<string>();

  for (const rawInput of inputList) {
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      continue;
    }
    const normalized = rawInput.toLowerCase().replace(/[^a-z\s]/g, '').trim();

    // 1. Check for a direct match in our simple mappings
    const mappedCodes = ETHNICITY_MAPPINGS[normalized];
    if (mappedCodes) {
      mappedCodes.forEach(code => resolvedParentCodes.add(code));
      continue;
    }

    // 2. If no mapping, search for an exact match in the ethnicity data values or labels
    for (const item of ethnicityData) {
      const itemLabelNormalized = item.label.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      if (item.value.toLowerCase() === normalized || itemLabelNormalized.includes(normalized)) {
        resolvedParentCodes.add(item.value); // Add the found code as a starting point
        break; 
      }
    }
  }
  
  if (resolvedParentCodes.size === 0) {
    console.warn(`[ResolveEthnicities] Could not find a match for any input in:`, inputList);
    return [];
  }

  // Traverse the tree for all found parent codes
  const finalCodes = getAllDescendantCodes(Array.from(resolvedParentCodes));
  
  const result = Array.from(finalCodes);
  console.log(`✅ [Resolved Ethnicities] ${result.length} codes found.`, result);
  return result;
}