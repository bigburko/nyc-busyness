import { ethnicityData } from '../../DemographicGroup/RaceDropDownGroup/ethnicityData';

const GROUP_ALIASES: Record<string, string[]> = {
  asian: ['asian', 'asians', 'eastasian', 'southasian', 'asianpeople'],
  black: ['black', 'blackpeople', 'africanamerican'],
  white: ['white', 'whitepeople', 'european'],
  hispanic: ['hispanic', 'latino', 'latina', 'latinx', 'latinos'],
  nativeamerican: ['native', 'nativeamerican', 'indigenous'],
  middleeastern: ['middleeastern', 'arab', 'arabic'],
  pacificislander: ['pacificislander', 'islander', 'hawaiian'],
};

export function resolveEthnicities(inputList: string[]): string[] {
  const resolved = new Set<string>();

  inputList.forEach(raw => {
    const clean = raw.toLowerCase().replace(/[^a-z]/g, '');

    // Match known aliases to parent groups
    const matchingGroups = Object.entries(GROUP_ALIASES).filter(([_, aliases]) =>
      aliases.includes(clean)
    ).map(([group]) => group);

    ethnicityData.forEach(entry => {
      const labelClean = entry.label.toLowerCase().replace(/[^a-z]/g, '');
      const parentClean = entry.parent?.toLowerCase().replace('group_', '');

      const isGroupMatch = matchingGroups.includes(parentClean);
      const isLabelMatch = labelClean.includes(clean);
      const isExactValueMatch = entry.value === clean;

      if (isGroupMatch || isLabelMatch || isExactValueMatch) {
        resolved.add(entry.value);
      }
    });
  });

  return Array.from(resolved);
}
