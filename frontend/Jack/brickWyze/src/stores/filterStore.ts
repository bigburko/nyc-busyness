// src/stores/filterStore.ts - FIXED: Proper demographic sub-weighting with array types

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Weighting {
  id: string;
  label: string;
  value: number;
  icon: string;
  color: string;
}

export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
}

// ✅ FIXED: Use proper weights structure (0.0 to 1.0 scale)
export interface DemographicScoringWeights {
  ethnicity: number;
  age: number;
  income: number;
  gender: number;
}

// ✅ FIXED: Use array types for bonuses/penalties (matches edge function)
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

// ✅ FIXED: Updated interface to match edge function expectations
export interface DemographicScoring {
  weights: DemographicScoringWeights;
  thresholdBonuses: ThresholdBonus[];  // ✅ Arrays, not objects
  penalties: DemographicPenalty[];     // ✅ Arrays, not objects
  reasoning?: string;                  // ✅ Added missing reasoning property
}

export interface DemographicReasoning {
  summary: string;
  details: {
    ethnicity?: string;
    age?: string;
    income?: string;
    gender?: string;
  };
  timestamp: number;
}

export interface TimePeriod {
  id: string;
  label: string;
  icon: string;
  description: string;
  timeRange: string;
}

export interface FilterState {
  weights: Weighting[];
  rentRange: [number, number];
  ageRange: [number, number];
  incomeRange: [number, number];
  selectedEthnicities: string[];
  selectedGenders: string[];
  selectedTimePeriods: string[];
  demographicScoring: DemographicScoring;
  lastDemographicReasoning: DemographicReasoning | null;
}

interface FilterActions {
  setFilters: (updates: Partial<FilterState>) => void;
  updateWeight: (id: string, value: number) => void;
  addWeight: (layer: Layer) => void;
  removeWeight: (id: string) => void;
  reset: () => void;
  setDemographicScoring: (scoring: Partial<DemographicScoring>) => void;
  setDemographicReasoning: (reasoning: DemographicReasoning) => void;
  setTimePeriods: (periods: string[]) => void;
  addTimePeriod: (period: string) => void;
  removeTimePeriod: (period: string) => void;
}

// ✅ FIXED: Default demographic scoring with proper array structure
const DEFAULT_DEMOGRAPHIC_SCORING: DemographicScoring = {
  weights: {
    ethnicity: 0.25,    // ✅ Use 0.0-1.0 scale (25% each)
    age: 0.25,
    income: 0.25,
    gender: 0.25
  },
  thresholdBonuses: [],  // ✅ Empty arrays by default
  penalties: [],         // ✅ Empty arrays by default
  reasoning: undefined   // ✅ No default reasoning
};

// ✅ FIXED: DEFAULT_STATE now matches INITIAL_WEIGHTS with proper default weights
const DEFAULT_STATE: FilterState = {
  weights: [
    { id: 'foot_traffic', label: 'Foot Traffic', value: 30, icon: '🚶', color: '#4299E1' },
    { id: 'crime', label: 'Crime Score', value: 25, icon: '🚨', color: '#E53E3E' },
    { id: 'rent_score', label: 'Rent Score', value: 20, icon: '💰', color: '#ED8936' },
    { id: 'poi', label: 'Points of Interest', value: 15, icon: '📍', color: '#9F7AEA' },
    { id: 'flood_risk', label: 'Flood Risk', value: 10, icon: '🌊', color: '#38B2AC' },
  ],
  rentRange: [26, 160],           
  ageRange: [0, 100],             
  incomeRange: [0, 250000],       
  selectedEthnicities: [],        
  selectedGenders: ['male', 'female'], 
  selectedTimePeriods: ['morning', 'afternoon', 'evening'], 
  demographicScoring: DEFAULT_DEMOGRAPHIC_SCORING,
  lastDemographicReasoning: null,
};

// ✅ Export the actual default weights for useActiveFilters compatibility
export const INITIAL_WEIGHTS = [
  { id: 'foot_traffic', value: 30 },
  { id: 'crime', value: 25 },
  { id: 'rent_score', value: 20 },
  { id: 'poi', value: 15 },
  { id: 'flood_risk', value: 10 }
];

// ✅ FIXED: Removed unused 'get' parameter
export const useFilterStore = create<FilterState & FilterActions>()(
  subscribeWithSelector((set) => ({
    ...DEFAULT_STATE,

    setFilters: (updates: Partial<FilterState>) =>
      set((state) => {
        console.log('🔄 [FilterStore] setFilters called with:', updates);
        
        // ✅ DEBUG: Check if weights are being set to zeros
        if (updates.weights) {
          const hasZeroWeights = updates.weights.some(w => w.value === 0);
          if (hasZeroWeights) {
            console.warn('⚠️ [FilterStore] WARNING: Zero weights detected in setFilters!');
            console.trace('⚠️ [FilterStore] Stack trace for zero weights:');
          }
          
          const totalWeight = updates.weights.reduce((sum, w) => sum + w.value, 0);
          if (Math.abs(totalWeight - 100) > 0.1) {
            console.warn('⚠️ [FilterStore] Weight total is not 100%:', totalWeight);
          }
        }
        
        // Validate time periods
        if (updates.selectedTimePeriods) {
          const validPeriods = ['morning', 'afternoon', 'evening'];
          const invalidPeriods = updates.selectedTimePeriods.filter(p => !validPeriods.includes(p));
          
          if (invalidPeriods.length > 0) {
            console.warn('⚠️ [FilterStore] Invalid time periods detected:', invalidPeriods);
            updates.selectedTimePeriods = updates.selectedTimePeriods.filter(p => validPeriods.includes(p));
          }
          
          // Ensure at least one period is selected
          if (updates.selectedTimePeriods.length === 0) {
            console.warn('⚠️ [FilterStore] No time periods selected, defaulting to morning');
            updates.selectedTimePeriods = ['morning'];
          }
        }
        
        const newState = { ...state, ...updates };
        console.log('🔄 [FilterStore] New state after setFilters:', newState);
        return newState;
      }),

    updateWeight: (id: string, value: number) =>
      set((state) => {
        console.log(`🎚️ [FilterStore] updateWeight: ${id} = ${value}%`);
        
        const updatedWeights = state.weights.map((w) =>
          w.id === id ? { ...w, value } : w
        );
        
        const totalWeight = updatedWeights.reduce((sum, w) => sum + w.value, 0);
        console.log(`🎚️ [FilterStore] Total weight after update: ${totalWeight}%`);
        
        return { ...state, weights: updatedWeights };
      }),

    addWeight: (layer: Layer) =>
      set((state) => {
        console.log(`➕ [FilterStore] addWeight: ${layer.label}`);
        
        // Check if weight already exists
        if (state.weights.some((w) => w.id === layer.id)) {
          console.warn(`⚠️ [FilterStore] Weight ${layer.id} already exists`);
          return state;
        }

        const newWeight: Weighting = {
          id: layer.id,
          label: layer.label,
          value: 0,
          icon: layer.icon,
          color: layer.color,
        };

        return { ...state, weights: [...state.weights, newWeight] };
      }),

    removeWeight: (id: string) =>
      set((state) => {
        console.log(`➖ [FilterStore] removeWeight: ${id}`);
        
        const filteredWeights = state.weights.filter((w) => w.id !== id);
        
        // Redistribute weight proportionally among remaining weights
        const removedWeight = state.weights.find((w) => w.id === id)?.value || 0;
        const remainingTotal = filteredWeights.reduce((sum, w) => sum + w.value, 0);
        
        if (remainingTotal > 0 && removedWeight > 0) {
          const redistributedWeights = filteredWeights.map((w) => ({
            ...w,
            value: Math.round((w.value / remainingTotal) * (remainingTotal + removedWeight)),
          }));
          
          return { ...state, weights: redistributedWeights };
        }
        
        return { ...state, weights: filteredWeights };
      }),

    reset: () => {
      console.log('🔄 [FilterStore] reset called');
      console.trace('🔄 [FilterStore] Stack trace for reset:');
      set(DEFAULT_STATE);
    },

    // ✅ FIXED: Proper demographic scoring setter with array handling
    setDemographicScoring: (scoring: Partial<DemographicScoring>) =>
      set((state) => {
        console.log('🧬 [FilterStore] setDemographicScoring:', scoring);
        
        const updatedScoring: DemographicScoring = {
          weights: scoring.weights ? { ...state.demographicScoring.weights, ...scoring.weights } : state.demographicScoring.weights,
          thresholdBonuses: scoring.thresholdBonuses ?? state.demographicScoring.thresholdBonuses,
          penalties: scoring.penalties ?? state.demographicScoring.penalties,
          reasoning: scoring.reasoning ?? state.demographicScoring.reasoning,
        };
        
        console.log('🧬 [FilterStore] Updated demographic scoring:', updatedScoring);
        return { ...state, demographicScoring: updatedScoring };
      }),

    setDemographicReasoning: (reasoning: DemographicReasoning) =>
      set((state) => {
        console.log('💭 [FilterStore] setDemographicReasoning:', reasoning.summary);
        return { ...state, lastDemographicReasoning: reasoning };
      }),

    // Time period management actions
    setTimePeriods: (periods: string[]) =>
      set((state) => {
        console.log('🕐 [FilterStore] setTimePeriods:', periods);
        
        const validPeriods = ['morning', 'afternoon', 'evening'];
        const filteredPeriods = periods.filter(p => validPeriods.includes(p));
        
        // Ensure at least one period is selected
        const finalPeriods = filteredPeriods.length === 0 ? ['morning'] : filteredPeriods;
        
        return { ...state, selectedTimePeriods: finalPeriods };
      }),

    addTimePeriod: (period: string) =>
      set((state) => {
        console.log(`🕐 [FilterStore] addTimePeriod: ${period}`);
        
        const validPeriods = ['morning', 'afternoon', 'evening'];
        if (!validPeriods.includes(period)) {
          console.warn(`⚠️ [FilterStore] Invalid time period: ${period}`);
          return state;
        }
        
        if (state.selectedTimePeriods.includes(period)) {
          console.warn(`⚠️ [FilterStore] Time period ${period} already selected`);
          return state;
        }
        
        return { ...state, selectedTimePeriods: [...state.selectedTimePeriods, period] };
      }),

    removeTimePeriod: (period: string) =>
      set((state) => {
        console.log(`🕐 [FilterStore] removeTimePeriod: ${period}`);
        
        const newPeriods = state.selectedTimePeriods.filter(p => p !== period);
        
        // Ensure at least one period remains
        if (newPeriods.length === 0) {
          console.warn('⚠️ [FilterStore] Cannot remove last time period, keeping morning');
          return { ...state, selectedTimePeriods: ['morning'] };
        }
        
        return { ...state, selectedTimePeriods: newPeriods };
      }),
  }))
);

// Selector hooks for better performance
export const useSelectedTimePeriods = () => useFilterStore(state => state.selectedTimePeriods);
export const useTimePeriodsActions = () => useFilterStore(state => ({
  setTimePeriods: state.setTimePeriods,
  addTimePeriod: state.addTimePeriod,
  removeTimePeriod: state.removeTimePeriod
}));

// Existing selector hooks
export const useActiveWeights = () => useFilterStore(state => state.weights);
export const useSelectedEthnicities = () => useFilterStore(state => state.selectedEthnicities);
export const useSelectedGenders = () => useFilterStore(state => state.selectedGenders);
export const useDemographicScoring = () => useFilterStore(state => state.demographicScoring);
export const useLastDemographicReasoning = () => useFilterStore(state => state.lastDemographicReasoning);

// Debug logging subscription
if (typeof window !== 'undefined') {
  useFilterStore.subscribe(
    (state) => state,
    (state) => {
      console.log('🔄 [FilterStore] State changed:', {
        weightsTotal: state.weights.reduce((sum, w) => sum + w.value, 0),
        ethnicitiesCount: state.selectedEthnicities.length,
        gendersCount: state.selectedGenders.length,
        timePeriodsCount: state.selectedTimePeriods.length,
        rentRange: state.rentRange,
        ageRange: state.ageRange,
        incomeRange: state.incomeRange,
        selectedTimePeriods: state.selectedTimePeriods,
        hasDemographicReasoning: !!state.lastDemographicReasoning,
        demographicScoring: state.demographicScoring
      });
    }
  );
}