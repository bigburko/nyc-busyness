// Clean filterStore.ts - keeping essential logs, removing verbose ones
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

export interface FilterState {
  weights: Weighting[];
  rentRange: [number, number];
  ageRange: [number, number];
  incomeRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  setFilters: (newFilters: Partial<FilterState>) => void;
  updateWeight: (id: string, value: number) => void;
  addWeight: (layer: Layer) => void;
  removeWeight: (id: string) => void;
  reset: () => void;
}

// --- INITIAL STATE ---
export const INITIAL_WEIGHTS: Weighting[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', value: 35, icon: '🚶', color: '#4299E1' },
  { id: 'demographic', label: 'Demographics', value: 25, icon: '👥', color: '#48BB78' },
  { id: 'crime', label: 'Crime Score', value: 15, icon: '🚨', color: '#E53E3E' },
  { id: 'flood_risk', label: 'Flood Risk', value: 10, icon: '🌊', color: '#3182CE' },
  { id: 'rent_score', label: 'Rent Score', value: 10, icon: '💰', color: '#ED8936' },
  { id: 'poi', label: 'Points of Interest', value: 5, icon: '📍', color: '#805AD5' },
];

const INITIAL_STATE = {
  weights: INITIAL_WEIGHTS,
  rentRange: [26, 160] as [number, number],
  ageRange: [0, 100] as [number, number],
  incomeRange: [0, 250000] as [number, number],
  selectedEthnicities: [] as string[],
  selectedGenders: ['male', 'female'] as string[],
};

// ✅ REDISTRIBUTION LOGIC
const redistributeWeights = (weights: Weighting[], changedId: string, newValue: number): Weighting[] => {
  const updatedWeights = [...weights];
  const changedIndex = updatedWeights.findIndex(w => w.id === changedId);
  
  if (changedIndex === -1) return weights;
  
  // Clamp the new value to valid range
  const clampedValue = Math.max(0, Math.min(100, newValue));
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
    // ✅ Normalize weights if they're being set externally
    if (newFilters.weights) {
      const totalWeight = newFilters.weights.reduce((sum, w) => sum + w.value, 0);
      
      if (totalWeight !== 100) {
        // Normalize the weights to sum to 100%
        const normalizedWeights = newFilters.weights.map(weight => ({
          ...weight,
          value: Math.round((weight.value / totalWeight) * 100)
        }));
        
        // Final adjustment to ensure exact 100%
        const finalTotal = normalizedWeights.reduce((sum, w) => sum + w.value, 0);
        const adjustment = 100 - finalTotal;
        if (adjustment !== 0 && normalizedWeights.length > 0) {
          normalizedWeights[0].value += adjustment;
        }
        
        newFilters = { ...newFilters, weights: normalizedWeights };
      }
    }
    
    set((state) => ({ ...state, ...newFilters }));
  },

  updateWeight: (id, value) => {
    const currentWeights = get().weights;
    const redistributedWeights = redistributeWeights(currentWeights, id, value);
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
    set(INITIAL_STATE);
  },
});

export const useFilterStore = create<FilterState>()(createFilterSlice);