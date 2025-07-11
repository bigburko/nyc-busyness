// filterStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Weighting } from '../ScoreWeightingGroup/WeightingPanel';

export interface FilterStore {
  weights: Weighting[];
  rentRange: [number, number];
  ageRange: [number, number];
  incomeRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  setFilters: (updates: Partial<FilterStore>) => void;
}

export const INITIAL_WEIGHTS: Weighting[] = [
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', color: '#4299E1', value: 35 },
  { id: 'demographic', label: 'Demographics', icon: '👥', color: '#48BB78', value: 25 },
  { id: 'crime', label: 'Crime Score', icon: '🚨', color: '#E53E3E', value: 15 },
  { id: 'flood_risk', label: 'Flood Risk', icon: '🌊', color: '#38B2AC', value: 10 },
  { id: 'rent_score', label: 'Rent Score', icon: '💰', color: '#ED8936', value: 10 },
  { id: 'poi', label: 'Points of Interest', icon: '📍', color: '#9F7AEA', value: 5 },
];

export const useFilterStore = create<FilterStore>()(
  subscribeWithSelector((set) => ({
    weights: INITIAL_WEIGHTS,
    rentRange: [26, 160],
    ageRange: [0, 100],
    incomeRange: [0, 250000],
    selectedEthnicities: [],
    selectedGenders: ['male', 'female'],

    setFilters: (updates) =>
      set((state) => {
        const newState = { ...state, ...updates };
        console.log('🧠 Zustand store updated:', updates); // ✅ Debug log
        return newState;
      }),
  }))
);
