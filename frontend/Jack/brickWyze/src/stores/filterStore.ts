// Clean filterStore.ts - Enhanced with demographic sub-weighting + COMPREHENSIVE CLAMPING
import { create, StateCreator } from 'zustand';

// --- TYPE DEFINITIONS ---
export interface Weighting {
  id: string;
  label: string;
  icon: string;
  color: string;
  value: number;
}

export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// NEW: Demographic sub-weighting types
export interface DemographicWeights {
  ethnicity: number;
  gender: number;
  age: number;
  income: number;
}

export interface ThresholdBonus {
  condition: string;
  bonus: number;
  description: string;
}

export interface DemographicPenalty {
  condition: string;
  penalty: number;
  description: string;
}

export interface DemographicScoring {
  weights: DemographicWeights;
  thresholdBonuses: ThresholdBonus[];
  penalties: DemographicPenalty[];
  reasoning?: string;
}

export interface FilterState {
  weights: Weighting[];
  rentRange: [number, number];
  ageRange: [number, number];
  incomeRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  
  // NEW: Demographic sub-weighting
  demographicScoring: DemographicScoring;
  lastDemographicReasoning: string;
  
  setFilters: (newFilters: Partial<FilterState>) => void;
  updateWeight: (id: string, value: number) => void;
  addWeight: (layer: Layer) => void;
  removeWeight: (id: string) => void;
  reset: () => void;
  
  // NEW: Demographic sub-weighting actions
  setDemographicScoring: (scoring: DemographicScoring) => void;
  resetDemographicScoring: () => void;
  updateDemographicWeights: (weights: Partial<DemographicWeights>) => void;
}

// --- VALIDATION & CLAMPING CONSTANTS ---
const VALIDATION_BOUNDS = {
  RENT_MIN: 0,
  RENT_MAX: 500,      // $500/sqft max reasonable
  AGE_MIN: 0,
  AGE_MAX: 100,
  INCOME_MIN: 0,
  INCOME_MAX: 1000000, // $1M max reasonable
  WEIGHT_MIN: 0,
  WEIGHT_MAX: 100,
  DEMO_WEIGHT_MIN: 0.0,
  DEMO_WEIGHT_MAX: 1.0,
  DEMO_WEIGHT_TOLERANCE: 0.001, // Allow small floating point errors
};

// --- VALIDATION HELPERS ---
const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const clampRange = (range: [number, number], min: number, max: number): [number, number] => {
  const [start, end] = range;
  const clampedStart = clampValue(start, min, max);
  const clampedEnd = clampValue(end, min, max);
  
  // Ensure start <= end
  return [
    Math.min(clampedStart, clampedEnd),
    Math.max(clampedStart, clampedEnd)
  ];
};

const validateGenderArray = (genders: string[]): string[] => {
  if (!Array.isArray(genders) || genders.length === 0) {
    console.warn('🛡️ [FilterStore] Invalid gender array, defaulting to both');
    return ['male', 'female'];
  }
  
  // Filter valid genders only
  const validGenders = genders.filter(g => ['male', 'female'].includes(g));
  
  if (validGenders.length === 0) {
    console.warn('🛡️ [FilterStore] No valid genders found, defaulting to both');
    return ['male', 'female'];
  }
  
  return validGenders;
};

const validateEthnicityArray = (ethnicities: string[]): string[] => {
  if (!Array.isArray(ethnicities)) {
    console.warn('🛡️ [FilterStore] Invalid ethnicity array, defaulting to empty');
    return [];
  }
  return ethnicities;
};

const normalizeDemographicWeights = (weights: DemographicWeights): DemographicWeights => {
  // Clamp individual weights
  const clampedWeights = {
    ethnicity: clampValue(weights.ethnicity, VALIDATION_BOUNDS.DEMO_WEIGHT_MIN, VALIDATION_BOUNDS.DEMO_WEIGHT_MAX),
    gender: clampValue(weights.gender, VALIDATION_BOUNDS.DEMO_WEIGHT_MIN, VALIDATION_BOUNDS.DEMO_WEIGHT_MAX),
    age: clampValue(weights.age, VALIDATION_BOUNDS.DEMO_WEIGHT_MIN, VALIDATION_BOUNDS.DEMO_WEIGHT_MAX),
    income: clampValue(weights.income, VALIDATION_BOUNDS.DEMO_WEIGHT_MIN, VALIDATION_BOUNDS.DEMO_WEIGHT_MAX)
  };
  
  // Calculate total
  const total = clampedWeights.ethnicity + clampedWeights.gender + clampedWeights.age + clampedWeights.income;
  
  // If total is 0 or very close to 0, return default balanced weights
  if (total < VALIDATION_BOUNDS.DEMO_WEIGHT_TOLERANCE) {
    console.warn('🛡️ [FilterStore] Demographic weights sum to ~0, using balanced defaults');
    return { ethnicity: 0.25, gender: 0.25, age: 0.25, income: 0.25 };
  }
  
  // If total is close to 1.0, return as-is
  if (Math.abs(total - 1.0) < VALIDATION_BOUNDS.DEMO_WEIGHT_TOLERANCE) {
    return clampedWeights;
  }
  
  // Normalize to sum to 1.0
  console.log(`🛡️ [FilterStore] Normalizing demographic weights (total: ${total})`);
  return {
    ethnicity: clampedWeights.ethnicity / total,
    gender: clampedWeights.gender / total,
    age: clampedWeights.age / total,
    income: clampedWeights.income / total
  };
};

// --- UPDATED INITIAL STATE ---
export const INITIAL_WEIGHTS: Weighting[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', value: 45, icon: '🚶', color: '#4299E1' },
  { id: 'demographic', label: 'Demographics', value: 0, icon: '👥', color: '#48BB78' },
  { id: 'crime', label: 'Crime Score', value: 25, icon: '🚨', color: '#E53E3E' },
  { id: 'flood_risk', label: 'Flood Risk', value: 15, icon: '🌊', color: '#3182CE' },
  { id: 'rent_score', label: 'Rent Score', value: 10, icon: '💰', color: '#ED8936' },
  { id: 'poi', label: 'Points of Interest', value: 5, icon: '📍', color: '#805AD5' },
];

// NEW: Default demographic scoring (balanced approach)
const defaultDemographicScoring: DemographicScoring = {
  weights: {
    ethnicity: 0.25,
    gender: 0.25,
    age: 0.25,
    income: 0.25
  },
  thresholdBonuses: [],
  penalties: [],
  reasoning: "Default balanced weighting - all demographic factors equally important."
};

const INITIAL_STATE = {
  weights: INITIAL_WEIGHTS,
  rentRange: [26, 160] as [number, number],
  ageRange: [0, 100] as [number, number],
  incomeRange: [0, 250000] as [number, number],
  selectedEthnicities: [] as string[],
  selectedGenders: ['male', 'female'] as string[],
  
  // NEW: Demographic sub-weighting initial state
  demographicScoring: defaultDemographicScoring,
  lastDemographicReasoning: "",
};

// ✅ REDISTRIBUTION LOGIC (enhanced with clamping)
const redistributeWeights = (weights: Weighting[], changedId: string, newValue: number): Weighting[] => {
  const updatedWeights = [...weights];
  const changedIndex = updatedWeights.findIndex(w => w.id === changedId);
  
  if (changedIndex === -1) return weights;
  
  // 🛡️ ENHANCED: Clamp the new value to valid range
  const clampedValue = clampValue(newValue, VALIDATION_BOUNDS.WEIGHT_MIN, VALIDATION_BOUNDS.WEIGHT_MAX);
  const oldValue = updatedWeights[changedIndex].value;
  
  // If no change, return early
  if (clampedValue === oldValue) return weights;
  
  // Update the changed slider
  updatedWeights[changedIndex].value = clampedValue;
  
  // Get other sliders that need adjustment
  const otherIndices = updatedWeights
    .map((_, index) => index)
    .filter(index => index !== changedIndex);
  
  if (otherIndices.length === 0) {
    return updatedWeights;
  }
  
  // Calculate remaining budget for other sliders
  const remainingBudget = 100 - clampedValue;
  
  // Get current values of other sliders
  const otherSliders = otherIndices.map(i => ({
    index: i,
    value: updatedWeights[i].value
  }));
  
  const currentOtherTotal = otherSliders.reduce((sum, s) => sum + s.value, 0);
  
  // If other sliders are already at 0, distribute equally
  if (currentOtherTotal === 0) {
    const equalShare = remainingBudget / otherIndices.length;
    otherIndices.forEach(i => {
      updatedWeights[i].value = Math.round(equalShare);
    });
  } else {
    // Redistribute proportionally
    if (remainingBudget > 0) {
      const scaleFactor = remainingBudget / currentOtherTotal;
      
      otherIndices.forEach(i => {
        updatedWeights[i].value = Math.round(updatedWeights[i].value * scaleFactor);
      });
    } else {
      // If no budget left, set others to 0
      otherIndices.forEach(i => {
        updatedWeights[i].value = 0;
      });
    }
  }
  
  // Final adjustment to ensure exact sum of 100
  const finalTotal = updatedWeights.reduce((sum, w) => sum + w.value, 0);
  const adjustment = 100 - finalTotal;
  
  if (adjustment !== 0) {
    // Apply adjustment to the slider with highest value (excluding the one being changed)
    const adjustableSliders = otherIndices.filter(i => updatedWeights[i].value > 0);
    
    if (adjustableSliders.length > 0) {
      const targetIndex = adjustableSliders.reduce((maxIndex, currentIndex) => 
        updatedWeights[currentIndex].value > updatedWeights[maxIndex].value ? currentIndex : maxIndex
      );
      
      updatedWeights[targetIndex].value = Math.max(0, updatedWeights[targetIndex].value + adjustment);
    } else {
      // If no other sliders have positive values, adjust the changed slider
      updatedWeights[changedIndex].value = Math.max(0, updatedWeights[changedIndex].value + adjustment);
    }
  }
  
  return updatedWeights;
};

// --- STORE CREATION LOGIC ---
const createFilterSlice: StateCreator<FilterState> = (set, get) => ({
  ...INITIAL_STATE,

  setFilters: (newFilters) => {
    // 🛡️ ENHANCED: Validate and clamp all incoming values
    const validatedFilters = { ...newFilters };
    
    // Validate ranges
    if (newFilters.rentRange) {
      validatedFilters.rentRange = clampRange(
        newFilters.rentRange, 
        VALIDATION_BOUNDS.RENT_MIN, 
        VALIDATION_BOUNDS.RENT_MAX
      );
      if (newFilters.rentRange !== validatedFilters.rentRange) {
        console.log('🛡️ [FilterStore] Clamped rent range:', validatedFilters.rentRange);
      }
    }
    
    if (newFilters.ageRange) {
      validatedFilters.ageRange = clampRange(
        newFilters.ageRange, 
        VALIDATION_BOUNDS.AGE_MIN, 
        VALIDATION_BOUNDS.AGE_MAX
      );
      if (newFilters.ageRange !== validatedFilters.ageRange) {
        console.log('🛡️ [FilterStore] Clamped age range:', validatedFilters.ageRange);
      }
    }
    
    if (newFilters.incomeRange) {
      validatedFilters.incomeRange = clampRange(
        newFilters.incomeRange, 
        VALIDATION_BOUNDS.INCOME_MIN, 
        VALIDATION_BOUNDS.INCOME_MAX
      );
      if (newFilters.incomeRange !== validatedFilters.incomeRange) {
        console.log('🛡️ [FilterStore] Clamped income range:', validatedFilters.incomeRange);
      }
    }
    
    // Validate arrays
    if (newFilters.selectedGenders) {
      validatedFilters.selectedGenders = validateGenderArray(newFilters.selectedGenders);
    }
    
    if (newFilters.selectedEthnicities) {
      validatedFilters.selectedEthnicities = validateEthnicityArray(newFilters.selectedEthnicities);
    }
    
    // ✅ Normalize weights if they're being set externally (keeping your existing logic)
    if (validatedFilters.weights) {
      const totalWeight = validatedFilters.weights.reduce((sum, w) => sum + w.value, 0);
      
      if (totalWeight !== 100) {
        // Normalize the weights to sum to 100%
        const normalizedWeights = validatedFilters.weights.map(weight => ({
          ...weight,
          value: Math.round((weight.value / totalWeight) * 100)
        }));
        
        // Final adjustment to ensure exact 100%
        const finalTotal = normalizedWeights.reduce((sum, w) => sum + w.value, 0);
        const adjustment = 100 - finalTotal;
        if (adjustment !== 0 && normalizedWeights.length > 0) {
          normalizedWeights[0].value += adjustment;
        }
        
        validatedFilters.weights = normalizedWeights;
        console.log('🛡️ [FilterStore] Normalized weights to 100%');
      }
    }
    
    set((state) => ({ ...state, ...validatedFilters }));
  },

  updateWeight: (id, value) => {
    // 🛡️ ENHANCED: Pre-clamp the value before redistribution
    const clampedValue = clampValue(value, VALIDATION_BOUNDS.WEIGHT_MIN, VALIDATION_BOUNDS.WEIGHT_MAX);
    const currentWeights = get().weights;
    const redistributedWeights = redistributeWeights(currentWeights, id, clampedValue);
    set({ weights: redistributedWeights });
  },

  addWeight: (layer) => {
    const currentWeights = get().weights;
    const newWeight: Weighting = { ...layer, value: 0 };
    const newWeights = [...currentWeights, newWeight];
    
    // Redistribute equally among all weights
    const equalValue = Math.floor(100 / newWeights.length);
    const remainder = 100 - (equalValue * newWeights.length);
    
    const redistributedWeights = newWeights.map((weight, index) => ({
      ...weight,
      value: index === 0 ? equalValue + remainder : equalValue
    }));
    
    set({ weights: redistributedWeights });
  },

  removeWeight: (id) => {
    const currentWeights = get().weights;
    const filteredWeights = currentWeights.filter(w => w.id !== id);
    
    if (filteredWeights.length === 0) return;
    
    // Redistribute equally among remaining weights
    const equalValue = Math.floor(100 / filteredWeights.length);
    const remainder = 100 - (equalValue * filteredWeights.length);
    
    const redistributedWeights = filteredWeights.map((weight, index) => ({
      ...weight,
      value: index === 0 ? equalValue + remainder : equalValue
    }));
    
    set({ weights: redistributedWeights });
  },

  reset: () => {
    console.log('🔄 [FilterStore] Resetting to initial state');
    set(INITIAL_STATE);
  },

  // 🛡️ ENHANCED: Demographic sub-weighting actions with validation
  setDemographicScoring: (scoring) => {
    // Validate and normalize demographic weights
    const normalizedWeights = normalizeDemographicWeights(scoring.weights);
    
    // Validate threshold bonuses and penalties
    const validatedBonuses = Array.isArray(scoring.thresholdBonuses) ? scoring.thresholdBonuses : [];
    const validatedPenalties = Array.isArray(scoring.penalties) ? scoring.penalties : [];
    
    const validatedScoring: DemographicScoring = {
      weights: normalizedWeights,
      thresholdBonuses: validatedBonuses,
      penalties: validatedPenalties,
      reasoning: typeof scoring.reasoning === 'string' ? scoring.reasoning : ""
    };
    
    set((state) => ({
      ...state,
      demographicScoring: validatedScoring,
      lastDemographicReasoning: validatedScoring.reasoning || ""
    }));
    
    console.log('🛡️ [FilterStore] Set demographic scoring with validated weights:', normalizedWeights);
  },

  resetDemographicScoring: () => {
    console.log('🔄 [FilterStore] Resetting demographic scoring to defaults');
    set((state) => ({
      ...state,
      demographicScoring: defaultDemographicScoring,
      lastDemographicReasoning: ""
    }));
  },

  updateDemographicWeights: (weights) => {
    const currentState = get();
    const updatedWeights = {
      ...currentState.demographicScoring.weights,
      ...weights
    };
    
    // Normalize the updated weights
    const normalizedWeights = normalizeDemographicWeights(updatedWeights);
    
    set((state) => ({
      ...state,
      demographicScoring: {
        ...state.demographicScoring,
        weights: normalizedWeights
      }
    }));
    
    console.log('🛡️ [FilterStore] Updated demographic weights:', normalizedWeights);
  },
});

export const useFilterStore = create<FilterState>()(createFilterSlice);