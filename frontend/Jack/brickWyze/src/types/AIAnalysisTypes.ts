// src/types/AIAnalysisTypes.ts

export interface TrendInsight {
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  change: string;
  sparklineData: number[];
}

export interface LocationInsights {
  footTraffic: TrendInsight;
  safety: TrendInsight;
  overallOutlook: string;
}

export interface BusinessInsight {
  type: 'strength' | 'opportunity' | 'consideration';
  icon: string;
  title: string;
  description: string;
  data?: string;
}

export interface AIBusinessAnalysis {
  headline: string;
  reasoning: string;
  insights: BusinessInsight[];
  businessTypes: string[];
  marketStrategy: string;
  competitorExamples: string[];
  bottomLine: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FootTrafficTimeline {
  '2022'?: number;
  '2023'?: number;
  '2024'?: number;  // ✅ ADDED: Missing 2024 property
  'pred_2025'?: number;
  'pred_2026'?: number;
  'pred_2027'?: number;
}

export interface CrimeTimeline {
  year_2022?: number;
  year_2023?: number;
  year_2024?: number;  // ✅ ADDED: Missing 2024 property
  pred_2025?: number;
  pred_2026?: number;
  pred_2027?: number;
}

export interface ParsedAIResponse {
  HEADLINE?: string;
  REASONING?: string;
  KEY_INSIGHTS?: Array<{
    Type?: string;
    Title?: string;
    Description?: string;
  }>;
  BUSINESS_TYPES?: string[];
  MARKET_STRATEGY?: string;
  COMPETITOR_EXAMPLES?: string[];
  BOTTOM_LINE?: string;
}

export interface FilterStoreSlice {
  selectedTimePeriods?: string[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
  demographicScoring?: {
    weights: { ethnicity: number; gender: number; age: number; income: number; };
    thresholdBonuses: { condition: string; bonus: number; description: string; }[];
    penalties: { condition: string; penalty: number; description: string; }[];
    reasoning?: string;
  };
}

export interface CachedAnalysis {
  analysis: AIBusinessAnalysis;
  timestamp: number;
  tractId: string;
}