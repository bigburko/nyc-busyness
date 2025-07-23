// src/stores/geminiStore.ts - FIXED: Validates and corrects ethnicity weight logic

import { create } from 'zustand';
import { useFilterStore, type Weighting } from './filterStore';

/**
 * Defines the shape of the current filter state that can be passed 
 * to the Gemini API to provide context for the user's query.
 */
interface FilterContext {
  weights?: Weighting[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[]; // NEW: Include time periods
  ageRange?: [number, number];
  incomeRange?: [number, number];
  // Fixed: Use proper array types instead of objects
  demographicScoring?: {
    weights: { ethnicity: number; gender: number; age: number; income: number };
    thresholdBonuses: Array<{ condition: string; bonus: number; description: string }>;
    penalties: Array<{ condition: string; penalty: number; description: string }>;
    reasoning?: string;
  };
  lastDemographicReasoning?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiApiResponse {
  reply: string;
  [key: string]: unknown;
}

interface GeminiErrorResponse {
  error: string;
  [key: string]: unknown;
}

// Define interfaces for Gemini response parsing
interface GeminiWeight {
  id: string;
  value: number;
}

interface GeminiDemographicScoring {
  weights?: {
    ethnicity?: number;
    gender?: number;
    age?: number;
    income?: number;
  };
  thresholdBonuses?: Array<{ condition: string; bonus: number; description: string }>;
  penalties?: Array<{ condition: string; penalty: number; description: string }>;
  reasoning?: string;
}

interface GeminiResponseData {
  weights?: GeminiWeight[];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  selectedTimePeriods?: string[]; // NEW: Handle time periods
  ageRange?: [number, number];
  incomeRange?: [number, number];
  rentRange?: [number, number];
  demographicScoring?: GeminiDemographicScoring;
  intent?: string;
}

// Type guard functions
function isGeminiWeight(obj: unknown): obj is GeminiWeight {
  return typeof obj === 'object' && obj !== null && 
         'id' in obj && 'value' in obj &&
         typeof (obj as Record<string, unknown>).id === 'string' &&
         typeof (obj as Record<string, unknown>).value === 'number';
}

function isGeminiWeightArray(arr: unknown): arr is GeminiWeight[] {
  return Array.isArray(arr) && arr.every(isGeminiWeight);
}

function isValidDemographicWeights(weights: unknown): weights is { ethnicity: number; gender: number; age: number; income: number } {
  return typeof weights === 'object' && weights !== null &&
         'ethnicity' in weights && 'gender' in weights && 'age' in weights && 'income' in weights &&
         typeof (weights as Record<string, unknown>).ethnicity === 'number' &&
         typeof (weights as Record<string, unknown>).gender === 'number' &&
         typeof (weights as Record<string, unknown>).age === 'number' &&
         typeof (weights as Record<string, unknown>).income === 'number';
}

function isValidTimePeriodArray(periods: unknown): periods is string[] {
  const validPeriods = ['morning', 'afternoon', 'evening'];
  return Array.isArray(periods) && periods.every(p => typeof p === 'string' && validPeriods.includes(p));
}

// ✅ NEW: Smart weight validation and redistribution
function validateAndFixDemographicWeights(
  weights: { ethnicity: number; gender: number; age: number; income: number },
  selectedEthnicities: string[]
): { ethnicity: number; gender: number; age: number; income: number } {
  
  const hasEthnicities = selectedEthnicities && selectedEthnicities.length > 0;
  
  console.log('🔧 [Weight Validation] Input:', {
    weights,
    hasEthnicities,
    selectedEthnicities: selectedEthnicities?.length || 0
  });
  
  // If no ethnicities selected but ethnicity weight > 0, redistribute
  if (!hasEthnicities && weights.ethnicity > 0) {
    console.warn('⚠️ [Weight Validation] No ethnicities selected but ethnicity weighted:', weights.ethnicity);
    
    const ethnicityWeight = weights.ethnicity;
    const correctedWeights = {
      ethnicity: 0, // Set to 0 when no ethnicities
      age: Math.min(1.0, weights.age + (ethnicityWeight * 0.5)), // Give 50% to age
      income: Math.min(1.0, weights.income + (ethnicityWeight * 0.4)), // Give 40% to income  
      gender: Math.min(1.0, weights.gender + (ethnicityWeight * 0.1)) // Give 10% to gender
    };
    
    // Ensure total doesn't exceed 1.0
    const total = correctedWeights.ethnicity + correctedWeights.age + correctedWeights.income + correctedWeights.gender;
    if (total > 1.0) {
      const scale = 1.0 / total;
      correctedWeights.age *= scale;
      correctedWeights.income *= scale;
      correctedWeights.gender *= scale;
    }
    
    console.log('✅ [Weight Validation] Corrected weights:', correctedWeights);
    console.log('📊 [Weight Validation] Redistributed', ethnicityWeight, 'from ethnicity to age/income/gender');
    
    return correctedWeights;
  }
  
  // If ethnicities selected but ethnicity weight is 0, this might be intentional
  if (hasEthnicities && weights.ethnicity === 0) {
    console.log('ℹ️ [Weight Validation] Ethnicities selected but ethnicity weight is 0 - keeping as intended');
  }
  
  console.log('✅ [Weight Validation] Weights are valid, no changes needed');
  return weights;
}

/**
 * Defines the state and actions for interacting with the Gemini AI.
 */
interface GeminiStore {
  lastMessage: string;
  sendToGemini: (message: string, context?: FilterContext) => Promise<string>;
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  input: string;
  setInput: (val: string) => void;
  resetChat: () => void;
}

export const useGeminiStore = create<GeminiStore>((set) => ({
  lastMessage: '',
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  input: '',
  setInput: (val) => set({ input: val }),
  resetChat: () => set({ messages: [], input: '' }),

  sendToGemini: async (message: string, context: FilterContext = {}) => {
    try {
      console.log('[🚀 Sending to Gemini]', { message, context });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ message, currentState: context }),
      });

      if (!response.ok) {
        let errorData: GeminiErrorResponse;
        try {
          errorData = await response.json() as GeminiErrorResponse;
        } catch {
          errorData = { error: 'Failed to parse error response.' };
        }
        
        console.error('[❌ Gemini API Error]', response.status, errorData);
        return `Sorry, Bricky encountered an error (Code: ${response.status}). Please try again.`;
      }

      const data = await response.json() as GeminiApiResponse;
      const reply = data.reply ?? 'No reply received.';

      console.log('[📥 Gemini API Response]', data);
      
      // Process Bricky's response and apply to filter store
      try {
        const parsedReply: unknown = JSON.parse(reply);
        console.log('[🔍 Gemini Store] Parsed Bricky response:', parsedReply);
        
        const responseData = parsedReply as Record<string, unknown>;
        console.log('🎯 [GEMINI STORE DEBUG] Raw Bricky response:', {
          weights: responseData.weights,
          demographicScoring: responseData.demographicScoring,
          selectedEthnicities: responseData.selectedEthnicities,
          selectedTimePeriods: responseData.selectedTimePeriods // NEW: Log time periods
        });
        
        if (typeof parsedReply !== 'object' || parsedReply === null) {
          throw new Error('Invalid response format');
        }
        
        const response = parsedReply as GeminiResponseData;
        
        // Apply filter updates
        const filterStore = useFilterStore.getState();
        const updates: Partial<{
          selectedEthnicities: string[];
          selectedGenders: string[];
          selectedTimePeriods: string[]; // NEW: Include time periods in updates
          ageRange: [number, number];
          incomeRange: [number, number];
          rentRange: [number, number];
        }> = {};
        
        // Handle weights separately
        if (response.weights && isGeminiWeightArray(response.weights)) {
          console.log('[⚖️ Gemini Store] Applying weight changes:', response.weights);
          
          const demographicWeight = response.weights.find(w => w.id === 'demographic');
          if (demographicWeight?.value === 100) {
            console.log('✅ [GEMINI STORE] DEMOGRAPHIC WEIGHT IS 100% - Single factor detected!');
          } else {
            console.log('⚠️ [GEMINI STORE] Demographic weight:', demographicWeight?.value || 'NOT FOUND');
          }
          
          const currentWeights = filterStore.weights || [];
          const updatedWeights = currentWeights.map(weight => {
            const geminiWeight = response.weights?.find((w: GeminiWeight) => w.id === weight.id);
            return geminiWeight ? { ...weight, value: geminiWeight.value } : weight;
          });
          
          console.log('🛡️ [GEMINI STORE DEBUG] Updated weights being set:', updatedWeights.map(w => `${w.id}: ${w.value}%`));
          
          filterStore.setFilters({ weights: updatedWeights });
        }
        
        // NEW: Handle time period changes
        if (response.selectedTimePeriods && isValidTimePeriodArray(response.selectedTimePeriods)) {
          updates.selectedTimePeriods = response.selectedTimePeriods;
          console.log('[🕐 Gemini Store] Applying time period changes:', response.selectedTimePeriods);
        }
        
        // Handle demographic filter changes
        if (response.selectedEthnicities && Array.isArray(response.selectedEthnicities)) {
          updates.selectedEthnicities = response.selectedEthnicities;
          console.log('[🌍 Gemini Store] Applying ethnicity changes:', response.selectedEthnicities);
        }
        
        if (response.selectedGenders && Array.isArray(response.selectedGenders)) {
          updates.selectedGenders = response.selectedGenders;
          console.log('[👥 Gemini Store] Applying gender changes:', response.selectedGenders);
        }
        
        if (response.ageRange && Array.isArray(response.ageRange) && response.ageRange.length === 2) {
          updates.ageRange = response.ageRange;
          console.log('[📅 Gemini Store] Applying age range changes:', response.ageRange);
        }
        
        if (response.incomeRange && Array.isArray(response.incomeRange) && response.incomeRange.length === 2) {
          updates.incomeRange = response.incomeRange;
          console.log('[💰 Gemini Store] Applying income range changes:', response.incomeRange);
        }
        
        if (response.rentRange && Array.isArray(response.rentRange) && response.rentRange.length === 2) {
          updates.rentRange = response.rentRange;
          console.log('[🏠 Gemini Store] Applying rent range changes:', response.rentRange);
        }
        
        // ✅ FIXED: Handle demographic scoring changes with weight validation
        if (response.demographicScoring && typeof response.demographicScoring === 'object') {
          console.log('[🧬 Gemini Store] Applying demographic scoring:', response.demographicScoring);
          
          const demoScoring = response.demographicScoring;
          if (demoScoring.weights && isValidDemographicWeights(demoScoring.weights)) {
            
            // ✅ CRITICAL FIX: Validate weights against selected ethnicities
            const selectedEthnicities = response.selectedEthnicities || updates.selectedEthnicities || filterStore.selectedEthnicities || [];
            const validatedWeights = validateAndFixDemographicWeights(demoScoring.weights, selectedEthnicities);
            
            console.log('🧬 [GEMINI STORE] Setting validated demographic scoring weights:', {
              original: demoScoring.weights,
              validated: validatedWeights,
              reasoning: demoScoring.reasoning
            });
            
            // ✅ FIXED: Use validated weights and pass arrays directly
            filterStore.setDemographicScoring({
              weights: validatedWeights,
              thresholdBonuses: Array.isArray(demoScoring.thresholdBonuses) ? 
                demoScoring.thresholdBonuses : [],
              penalties: Array.isArray(demoScoring.penalties) ? 
                demoScoring.penalties : [],
              reasoning: demoScoring.reasoning
            });
            
            console.log('[✅ Gemini Store] Successfully applied validated demographic scoring!');
          } else {
            console.warn('[⚠️ Gemini Store] Invalid demographic scoring weights structure:', demoScoring.weights);
          }
        }
        
        // Apply all other filter updates in batch
        if (Object.keys(updates).length > 0) {
          filterStore.setFilters(updates);
          console.log('[✅ Gemini Store] Applied filter updates:', updates);
        }
        
        // Enhanced debug logging
        const finalState = useFilterStore.getState();
        console.log('🎯 [GEMINI STORE DEBUG] Final state after updates:', {
          weights: finalState.weights.map(w => `${w.id}: ${w.value}%`),
          selectedEthnicities: finalState.selectedEthnicities,
          selectedGenders: finalState.selectedGenders,
          selectedTimePeriods: finalState.selectedTimePeriods, // NEW: Log time periods
          demographicScoring: {
            weights: finalState.demographicScoring.weights,
            thresholdBonuses: finalState.demographicScoring.thresholdBonuses,
            penalties: finalState.demographicScoring.penalties,
            reasoning: finalState.demographicScoring.reasoning
          }
        });
        
        // Handle special intents
        if (response.intent === 'reset') {
          console.log('[🔄 Gemini Store] Resetting filters per Bricky request');
          filterStore.reset();
        }
        
      } catch (parseError) {
        console.warn('[⚠️ Gemini Store] Could not parse Bricky response as JSON:', parseError);
        console.log('[📝 Gemini Store] Raw response:', reply);
      }
      
      set({ lastMessage: reply });
      return reply;

    } catch (err) {
      console.error('[❌ Gemini Fetch Failed]', err);
      return 'Sorry, there was a problem connecting to Bricky. Please check your network and try again.';
    }
  },
}));