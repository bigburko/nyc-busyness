export const ethnicityOptions: {
  key: string;
  label: string;
  value: string;
  parent?: string;
}[] = [
  // Groups
  { key: 'group_White', label: 'White', value: 'group_White', parent: 'group_White' },
  { key: 'group_Black', label: 'Black or African American', value: 'group_Black', parent: 'group_Black' },
  { key: 'group_Asian', label: 'Asian', value: 'group_Asian', parent: 'group_Asian' },
  { key: 'group_Hispanic', label: 'Hispanic or Latino', value: 'group_Hispanic', parent: 'group_Hispanic' },
  { key: 'group_Other', label: 'Other', value: 'group_Other', parent: 'group_Other' },

  // White subgroups
  { key: 'Eastern-European', label: 'Eastern European', value: 'Eastern-European', parent: 'group_White' },
  { key: 'Western-European', label: 'Western European', value: 'Western-European', parent: 'group_White' },

  // Black subgroups
  { key: 'African', label: 'African', value: 'African', parent: 'group_Black' },
  { key: 'Caribbean', label: 'Caribbean', value: 'Caribbean', parent: 'group_Black' },
  { key: 'African-American', label: 'African American', value: 'African-American', parent: 'group_Black' },

  // Asian subgroups
  { key: 'East-Asian', label: 'East Asian', value: 'East-Asian', parent: 'group_Asian' },
  { key: 'South-Asian', label: 'South Asian', value: 'South-Asian', parent: 'group_Asian' },
  { key: 'Southeast-Asian', label: 'Southeast Asian', value: 'Southeast-Asian', parent: 'group_Asian' },

  // Hispanic subgroups
  { key: 'Mexican', label: 'Mexican', value: 'Mexican', parent: 'group_Hispanic' },
  { key: 'Puerto-Rican', label: 'Puerto Rican', value: 'Puerto-Rican', parent: 'group_Hispanic' },
  { key: 'Cuban', label: 'Cuban', value: 'Cuban', parent: 'group_Hispanic' },
  { key: 'Dominican', label: 'Dominican', value: 'Dominican', parent: 'group_Hispanic' },
  { key: 'Central-American', label: 'Central American', value: 'Central-American', parent: 'group_Hispanic' },
  { key: 'South-American', label: 'South American', value: 'South-American', parent: 'group_Hispanic' },
  { key: 'Caribbean-Hispanic', label: 'Caribbean Hispanic', value: 'Caribbean-Hispanic', parent: 'group_Hispanic' },

  // Other subgroups
  { key: 'MENA', label: 'Middle Eastern or North African', value: 'MENA', parent: 'group_Other' },
  { key: 'Multiracial', label: 'Multiracial', value: 'Multiracial', parent: 'group_Other' },
  { key: 'Native-American', label: 'Native American or Alaska Native', value: 'Native-American', parent: 'group_Other' },
  { key: 'NHPI', label: 'Native Hawaiian or Pacific Islander', value: 'NHPI', parent: 'group_Other' },
];
