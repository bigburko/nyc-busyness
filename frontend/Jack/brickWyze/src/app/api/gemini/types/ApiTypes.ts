// src/app/api/gemini/types/ApiTypes.ts

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
  thresholdBonuses?: ThresholdBonus[];
  penalties?: DemographicPenalty[];
  reasoning?: string;
}

export interface WeightObject {
  id: string;
  value: number;
  label: string;
  icon: string;
  color: string;
}

export interface CurrentState {
  weights?: WeightObject[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  demographicScoring?: DemographicScoring;
  lastDemographicReasoning?: string;
  [key: string]: unknown;
}

export interface RequestBody {
  message: string;
  systemPrompt?: string;
  currentState?: CurrentState;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterChoice {
  message?: {
    content?: string;
  };
  [key: string]: unknown;
}

export interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  [key: string]: unknown;
}

export interface BusinessDemographics {
  age: [number, number];
  income?: [number, number];
  ethnicity_weight?: number;
}

export interface BusinessContext {
  type: string;
  priority: string;
  timePreference: string[];
  avoidAreas?: string[];
  preferAreas?: string[];
  demographics: BusinessDemographics;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProcessedResponse {
  weights?: WeightObject[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
  demographicScoring?: DemographicScoring;
}

// Business type constants
export const BUSINESS_TYPES = {
  NIGHTLIFE: 'nightlife',
  HERITAGE_FOOD: 'heritage_food',
  PREMIUM_FOOD: 'premium_food',
  ALL_HOURS: 'all_hours',
  PROFESSIONAL_SERVICES: 'professional_services',
  CASUAL_DINING: 'casual_dining',
  MEXICAN_HISPANIC: 'mexican_hispanic',
  MIDDLE_EASTERN: 'middle_eastern',
  GENERAL: 'general'
} as const;

export type BusinessType = typeof BUSINESS_TYPES[keyof typeof BUSINESS_TYPES];

// Time period constants
export const TIME_PERIODS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening'
} as const;

export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS];

// Weight ID constants
export const WEIGHT_IDS = {
  DEMOGRAPHIC: 'demographic',
  FOOT_TRAFFIC: 'foot_traffic',
  CRIME: 'crime',
  FLOOD_RISK: 'flood_risk',
  RENT_SCORE: 'rent_score',
  POI: 'poi'
} as const;

export type WeightId = typeof WEIGHT_IDS[keyof typeof WEIGHT_IDS];

// Validation constraints
export const VALIDATION_CONSTRAINTS = {
  AGE: {
    MIN: 18,
    MAX: 80
  },
  INCOME: {
    MIN: 20000,
    MAX: 250000
  },
  RENT: {
    MIN: 26,
    MAX: 160
  }
} as const;