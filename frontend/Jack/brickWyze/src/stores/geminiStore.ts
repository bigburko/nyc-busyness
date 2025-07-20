// src/stores/geminiStore.ts - Enhanced with demographic scoring integration + DEBUGGING

import { create } from 'zustand';
import { useFilterStore, type Weighting } from './filterStore'; // Import types

/**
 * Defines the shape of the current filter state that can be passed 
 * to the Gemini API to provide context for the user's query.
 * All properties are optional.
 */
interface FilterContext {
  weights?: Weighting[]; // 🔧 FIX: Use proper Weighting type
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
  // NEW: Include demographic scoring in context
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

/**
 * API response structure from the Gemini endpoint
 */
interface GeminiApiResponse {
  reply: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Error response structure
 */
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

/**
 * Defines the state and actions for interacting with the Gemini AI.
 */
interface GeminiStore {
  lastMessage: string;
  sendToGemini: (message: string, context?: FilterContext) => Promise<string>;

  messages: Message[];               // 🟢 All chat history
  setMessages: (msgs: Message[]) => void;

  input: string;                     // 🟢 Current input value
  setInput: (val: string) => void;

  resetChat: () => void;             // 🟢 Clear chat (when user requests it)
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
      // Log the payload being sent for easier debugging
      console.log('[🚀 Sending to Gemini]', { message, context });

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ message, currentState: context }), // Pass message and context
      });

      // Handle non-successful HTTP responses (e.g., 400, 500 errors)
      if (!response.ok) {
        let errorData: GeminiErrorResponse;
        try {
          errorData = await response.json() as GeminiErrorResponse;
        } catch {
          errorData = { error: 'Failed to parse error response.' };
        }
        
        console.error('[❌ Gemini API Error]', response.status, errorData);
        // Provide a user-friendly error message
        return `Sorry, Bricky encountered an error (Code: ${response.status}). Please try again.`;
      }

      const data = await response.json() as GeminiApiResponse;
      const reply = data.reply ?? 'No reply received.'; // Gracefully handle missing reply

      console.log('[📥 Gemini API Response]', data);
      
      // 🆕 NEW: Process Bricky's response and apply to filter store
      try {
        const parsedReply: unknown = JSON.parse(reply);
        console.log('[🔍 Gemini Store] Parsed Bricky response:', parsedReply);
        
        // 🎯 ENHANCED DEBUG: Log what Bricky returned - safe access with type guards
        const responseData = parsedReply as Record<string, unknown>;
        console.log('🎯 [GEMINI STORE DEBUG] Raw Bricky weights:', responseData.weights);
        console.log('🎯 [GEMINI STORE DEBUG] Demographic scoring:', responseData.demographicScoring);
        console.log('🎯 [GEMINI STORE DEBUG] Selected ethnicities:', responseData.selectedEthnicities);
        
        // Type guard to ensure parsedReply is an object
        if (typeof parsedReply !== 'object' || parsedReply === null) {
          throw new Error('Invalid response format');
        }
        
        const response = parsedReply as GeminiResponseData;
        
        // Apply any filter updates that Bricky made
        const filterStore = useFilterStore.getState();
        const updates: Partial<{
          selectedEthnicities: string[];
          selectedGenders: string[];
          ageRange: [number, number];
          incomeRange: [number, number];
          rentRange: [number, number];
        }> = {}; // 🔧 FIX: Use partial type without weights (handle weights separately)
        
        // Handle weights separately since they need special processing
        if (response.weights && isGeminiWeightArray(response.weights)) {
          console.log('[⚖️ Gemini Store] Applying weight changes:', response.weights);
          
          // 🎯 ENHANCED DEBUG: Check if demographic is 100%
          const demographicWeight = response.weights.find(w => w.id === 'demographic');
          if (demographicWeight?.value === 100) {
            console.log('✅ [GEMINI STORE] DEMOGRAPHIC WEIGHT IS 100% - Single factor detected!');
          } else {
            console.log('⚠️ [GEMINI STORE] Demographic weight:', demographicWeight?.value || 'NOT FOUND');
          }
          
          // Convert simple weight format to full Weighting format if needed
          const currentWeights = filterStore.weights || [];
          const updatedWeights = currentWeights.map(weight => {
            const geminiWeight = response.weights?.find((w: GeminiWeight) => w.id === weight.id);
            return geminiWeight ? { ...weight, value: geminiWeight.value } : weight;
          });
          
          // 🎯 ENHANCED DEBUG: Log weight changes
          console.log('🛡️ [GEMINI STORE DEBUG] Updated weights being set:', updatedWeights.map(w => `${w.id}: ${w.value}%`));
          
          filterStore.setFilters({ weights: updatedWeights });
        }
        
        // Apply demographic filter changes
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
        
        // 🎯 CRITICAL: Apply demographic scoring changes
        if (response.demographicScoring && typeof response.demographicScoring === 'object') {
          console.log('[🧬 Gemini Store] Applying demographic scoring:', response.demographicScoring);
          
          // Validate demographic scoring structure
          const demoScoring = response.demographicScoring;
          if (demoScoring.weights && isValidDemographicWeights(demoScoring.weights)) {
            
            const weights = demoScoring.weights;
            
            // 🎯 ENHANCED DEBUG: Log demographic scoring details
            console.log('🧬 [GEMINI STORE] Setting demographic scoring weights:', {
              ethnicity: weights.ethnicity,
              gender: weights.gender,
              age: weights.age,
              income: weights.income,
              reasoning: demoScoring.reasoning
            });
            
            filterStore.setDemographicScoring({
              weights: {
                ethnicity: weights.ethnicity,
                gender: weights.gender,
                age: weights.age,
                income: weights.income
              },
              thresholdBonuses: Array.isArray(demoScoring.thresholdBonuses) ? demoScoring.thresholdBonuses : [],
              penalties: Array.isArray(demoScoring.penalties) ? demoScoring.penalties : [],
              reasoning: typeof demoScoring.reasoning === 'string' ? demoScoring.reasoning : ''
            });
            
            console.log('[✅ Gemini Store] Successfully applied demographic scoring!');
          } else {
            console.warn('[⚠️ Gemini Store] Invalid demographic scoring weights structure:', demoScoring.weights);
          }
        }
        
        // Apply all other filter updates in batch
        if (Object.keys(updates).length > 0) {
          filterStore.setFilters(updates);
          console.log('[✅ Gemini Store] Applied filter updates:', updates);
        }
        
        // 🎯 ENHANCED DEBUG: Log final state after all updates
        const finalState = useFilterStore.getState();
        console.log('🎯 [GEMINI STORE DEBUG] Final state after updates:', {
          weights: finalState.weights.map(w => `${w.id}: ${w.value}%`),
          selectedEthnicities: finalState.selectedEthnicities,
          selectedGenders: finalState.selectedGenders,
          demographicScoring: finalState.demographicScoring
        });
        
        // Handle special intents
        if (response.intent === 'reset') {
          console.log('[🔄 Gemini Store] Resetting filters per Bricky request');
          filterStore.reset();
        }
        
      } catch (parseError) {
        console.warn('[⚠️ Gemini Store] Could not parse Bricky response as JSON:', parseError);
        console.log('[📝 Gemini Store] Raw response:', reply);
        // This is fine - not all responses need to be JSON (e.g., clarifying questions)
      }
      
      set({ lastMessage: reply });
      return reply;

    } catch (err) {
      // Handle network errors or other exceptions during the fetch
      console.error('[❌ Gemini Fetch Failed]', err);
      return 'Sorry, there was a problem connecting to Bricky. Please check your network and try again.';
    }
  },
}));