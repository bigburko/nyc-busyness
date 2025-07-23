// src/hooks/useActiveFilters.ts - FIXED: Proper typing instead of any

import { useFilterStore } from '@/stores/filterStore';

// Define proper type for default weights
interface DefaultWeight {
  id: string;
  value: number;
}

export function useActiveFilters() {
  const weights = useFilterStore(s => s.weights);
  const rentRange = useFilterStore(s => s.rentRange);
  const ageRange = useFilterStore(s => s.ageRange);
  const incomeRange = useFilterStore(s => s.incomeRange);
  const selectedEthnicities = useFilterStore(s => s.selectedEthnicities);
  const selectedGenders = useFilterStore(s => s.selectedGenders);

  let activeCount = 0;

  // ✅ DEBUG: Log current values to see what's different
  console.log('🔍 [useActiveFilters] Current values:', {
    weights: weights.map(w => ({ id: w.id, value: w.value })),
    rentRange,
    ageRange, 
    incomeRange,
    selectedEthnicities,
    selectedGenders
  });

  // ✅ FIXED: Properly typed default weights array
  const defaultWeights: DefaultWeight[] = [
    { id: 'foot_traffic', value: 30 },
    { id: 'crime', value: 25 },
    { id: 'rent_score', value: 20 },
    { id: 'poi', value: 15 },
    { id: 'flood_risk', value: 10 }
  ];

  // Check if weights are different from defaults
  const weightsChanged = weights.length !== defaultWeights.length || 
    weights.some(w => {
      const defaultWeight = defaultWeights.find((d: DefaultWeight) => d.id === w.id);
      const expectedValue = defaultWeight ? defaultWeight.value : 0;
      const changed = !defaultWeight || defaultWeight.value !== w.value;
      if (changed) console.log(`🎚️ [useActiveFilters] Weight changed: ${w.id} = ${w.value} (expected ${expectedValue})`);
      return changed;
    });
  if (weightsChanged) {
    console.log('🎚️ [useActiveFilters] Weights are active (+1)');
    activeCount++;
  }

  // Check if rent range is different from default [26, 160] 
  const rentChanged = rentRange[0] !== 26 || rentRange[1] !== 160;
  if (rentChanged) {
    console.log(`🏠 [useActiveFilters] Rent range changed: [${rentRange[0]}, ${rentRange[1]}] (expected [26, 160]) (+1)`);
    activeCount++;
  }

  // Check if age range is different from default [0, 100]
  const ageChanged = ageRange[0] !== 0 || ageRange[1] !== 100;
  if (ageChanged) {
    console.log(`👶 [useActiveFilters] Age range changed: [${ageRange[0]}, ${ageRange[1]}] (expected [0, 100]) (+1)`);
    activeCount++;
  }

  // Check if income range is different from default [0, 250000]
  const incomeChanged = incomeRange[0] !== 0 || incomeRange[1] !== 250000;
  if (incomeChanged) {
    console.log(`💰 [useActiveFilters] Income range changed: [${incomeRange[0]}, ${incomeRange[1]}] (expected [0, 250000]) (+1)`);
    activeCount++;
  }

  // Check if ethnicities are selected (default is empty)
  if (selectedEthnicities.length > 0) {
    console.log(`🌍 [useActiveFilters] Ethnicities selected: ${selectedEthnicities.length} (+1)`);
    activeCount++;
  }

  // ✅ FIXED: Check if genders are different from default ['male', 'female'] (lowercase)
  const defaultGenders = ['male', 'female'];
  const gendersChanged = selectedGenders.length !== defaultGenders.length ||
    selectedGenders.some(g => !defaultGenders.includes(g));
  if (gendersChanged) {
    console.log(`👥 [useActiveFilters] Genders changed: [${selectedGenders.join(', ')}] (expected [male, female]) (+1)`);
    activeCount++;
  }

  console.log(`🔢 [useActiveFilters] Total active count: ${activeCount}`);
  return activeCount;
}