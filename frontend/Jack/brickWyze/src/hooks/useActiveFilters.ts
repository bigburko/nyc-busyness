// src/hooks/useActiveFilters.ts

import { useFilterStore, INITIAL_WEIGHTS } from '@/stores/filterStore';

export function useActiveFilters() {
  const weights = useFilterStore(s => s.weights);
  const rentRange = useFilterStore(s => s.rentRange);
  const ageRange = useFilterStore(s => s.ageRange);
  const incomeRange = useFilterStore(s => s.incomeRange);
  const selectedEthnicities = useFilterStore(s => s.selectedEthnicities);
  const selectedGenders = useFilterStore(s => s.selectedGenders);

  let activeCount = 0;

  // Check if weights are different from defaults
  const weightsChanged = weights.length !== INITIAL_WEIGHTS.length || 
    weights.some(w => {
      const defaultWeight = INITIAL_WEIGHTS.find(d => d.id === w.id);
      return !defaultWeight || defaultWeight.value !== w.value;
    });
  if (weightsChanged) activeCount++;

  // Check if rent range is different from default [26, 160]
  if (rentRange[0] !== 26 || rentRange[1] !== 160) activeCount++;

  // Check if age range is different from default [0, 100]
  if (ageRange[0] !== 0 || ageRange[1] !== 100) activeCount++;

  // Check if income range is different from default [0, 250000]
  if (incomeRange[0] !== 0 || incomeRange[1] !== 250000) activeCount++;

  // Check if ethnicities are selected (default is empty)
  if (selectedEthnicities.length > 0) activeCount++;

  // Check if genders are different from default ['male', 'female']
  const defaultGenders = ['male', 'female'];
  const gendersChanged = selectedGenders.length !== defaultGenders.length ||
    selectedGenders.some(g => !defaultGenders.includes(g));
  if (gendersChanged) activeCount++;

  return activeCount;
}