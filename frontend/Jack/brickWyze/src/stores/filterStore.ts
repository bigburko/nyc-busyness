// src/components/DrawerGroup/filterStore.ts

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
  reset: () => void;
}

// --- INITIAL STATE (Updated to your new requirements) ---
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
  ageRange: [0, 100] as [number, number],        // Updated to 0-100
  incomeRange: [0, 250000] as [number, number],
  selectedEthnicities: [] as string[],
  selectedGenders: ['male', 'female'] as string[],
};

// --- STORE CREATION LOGIC ---
const createFilterSlice: StateCreator<FilterState> = (set, get) => ({
  ...INITIAL_STATE,

  setFilters: (newFilters) => set((state) => ({ ...state, ...newFilters })),

  updateWeight: (id, value) => {
    const currentWeights = get().weights;
    const movingSlider = currentWeights.find(w => w.id === id);
    if (!movingSlider) return;
    const oldValue = movingSlider.value;
    const delta = value - oldValue;
    let otherTotal = 100 - oldValue;
    if (otherTotal <= 0) otherTotal = 1;

    // ✅ FIXED: Changed 'let' to 'const' since updatedWeights is never reassigned
    const updatedWeights = currentWeights.map(w => {
      if (w.id === id) return { ...w, value };
      const share = w.value / otherTotal;
      return { ...w, value: w.value - (delta * share) };
    });
    
    const currentTotal = updatedWeights.reduce((sum, w) => sum + w.value, 0);
    const normalizationFactor = 100 / currentTotal;
    const finalWeights = updatedWeights.map(w => ({
      ...w,
      value: Math.round(w.value * normalizationFactor)
    }));

    const finalSum = finalWeights.reduce((sum, w) => sum + w.value, 0);
    if (finalSum !== 100) {
      const diff = 100 - finalSum;
      const sliderToAdjust = finalWeights.find(w => w.id === id) || finalWeights[0];
      sliderToAdjust.value += diff;
    }
    set({ weights: finalWeights });
  },

  reset: () => set(INITIAL_STATE),
});

// =========================================================================================
// THE FINAL, DEFINITIVE CHANGE IS HERE.
// We are using the create<T>()(...) pattern. This locks in the type `FilterState` first,
// and then passes the implementation. This is the most TypeScript-robust way to create a store.
// =========================================================================================
export const useFilterStore = create<FilterState>()(createFilterSlice);