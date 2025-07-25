// src/types/WeightTypes.ts
export interface Weight {
  id: string;
  value: number;
}

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

export interface Penalty {
  condition: string;
  penalty: number;
  description: string;
}

export interface DemographicScoring {
  weights?: DemographicWeights;
  thresholdBonuses?: ThresholdBonus[];
  penalties?: Penalty[];
  reasoning?: string;
}

export interface FilterStore {
  weights: Weight[];
  selectedTimePeriods: string[];
  demographicScoring?: DemographicScoring;
}