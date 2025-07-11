// src/utils/ethnicityUtils.ts
import { ethnicityData } from '../../DemographicGroup/RaceDropDownGroup/ethnicityData'; // adjust path if needed

// Dynamically generate groups based on `parent` or fuzzy `label` matches
export function getEthnicityGroups(): Record<string, string[]> {
  return {
    asian: ethnicityData
      .filter((e) => e.parent === 'group_Asian')
      .map((e) => e.value),

    black: ethnicityData
      .filter((e) => e.parent === 'group_Black')
      .map((e) => e.value),

    white: ethnicityData
      .filter((e) => e.parent === 'group_White')
      .map((e) => e.value),

    hispanic: ethnicityData
      .filter((e) => e.parent === 'group_Hispanic')
      .map((e) => e.value),

    middleeastern: ethnicityData
      .filter((e) => e.label.toLowerCase().includes('middle east'))
      .map((e) => e.value),

    southasian: ethnicityData
      .filter((e) => e.label.toLowerCase().includes('south asia'))
      .map((e) => e.value),

    nativeamerican: ethnicityData
      .filter((e) => e.label.toLowerCase().includes('native'))
      .map((e) => e.value),

    pacificislander: ethnicityData
      .filter((e) => e.label.toLowerCase().includes('pacific'))
      .map((e) => e.value),
  };
}
