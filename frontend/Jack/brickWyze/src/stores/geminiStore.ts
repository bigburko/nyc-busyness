// src/stores/geminiStore.ts - Enhanced with demographic scoring integration

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
        
        // Type guard to ensure parsedReply is an object
        if (typeof parsedReply !== 'object' || parsedReply === null) {
          throw new Error('Invalid response format');
        }
        
        const response = parsedReply as Record<string, unknown>;
        
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
        if (response.weights && Array.isArray(response.weights)) {
          console.log('[⚖️ Gemini Store] Applying weight changes:', response.weights);
          // Convert simple weight format to full Weighting format if needed
          const currentWeights = filterStore.weights || [];
          const weightsArray = response.weights as unknown[]; // 🔧 FIX: Properly type the array
          const updatedWeights = currentWeights.map(weight => {
            const geminiWeight = weightsArray.find((w: unknown) => {
              return typeof w === 'object' && w !== null && 
                     'id' in w && 'value' in w &&
                     (w as { id: unknown }).id === weight.id;
            }) as { id: string; value: number } | undefined;
            return geminiWeight ? { ...weight, value: geminiWeight.value } : weight;
          });
          filterStore.setFilters({ weights: updatedWeights });
        }
        
        // Apply demographic filter changes
        if (response.selectedEthnicities && Array.isArray(response.selectedEthnicities)) {
          updates.selectedEthnicities = response.selectedEthnicities as string[];
          console.log('[🌍 Gemini Store] Applying ethnicity changes:', response.selectedEthnicities);
        }
        
        if (response.selectedGenders && Array.isArray(response.selectedGenders)) {
          updates.selectedGenders = response.selectedGenders as string[];
          console.log('[👥 Gemini Store] Applying gender changes:', response.selectedGenders);
        }
        
        if (response.ageRange && Array.isArray(response.ageRange) && response.ageRange.length === 2) {
          updates.ageRange = response.ageRange as [number, number];
          console.log('[📅 Gemini Store] Applying age range changes:', response.ageRange);
        }
        
        if (response.incomeRange && Array.isArray(response.incomeRange) && response.incomeRange.length === 2) {
          updates.incomeRange = response.incomeRange as [number, number];
          console.log('[💰 Gemini Store] Applying income range changes:', response.incomeRange);
        }
        
        if (response.rentRange && Array.isArray(response.rentRange) && response.rentRange.length === 2) {
          updates.rentRange = response.rentRange as [number, number];
          console.log('[🏠 Gemini Store] Applying rent range changes:', response.rentRange);
        }
        
        // 🎯 CRITICAL: Apply demographic scoring changes
        if (response.demographicScoring && typeof response.demographicScoring === 'object') {
          console.log('[🧬 Gemini Store] Applying demographic scoring:', response.demographicScoring);
          
          // Validate demographic scoring structure
          const demoScoring = response.demographicScoring as Record<string, unknown>;
          if (demoScoring.weights && 
              typeof demoScoring.weights === 'object' &&
              demoScoring.weights !== null) {
            
            const weights = demoScoring.weights as Record<string, unknown>;
            if (typeof weights.ethnicity === 'number' &&
                typeof weights.gender === 'number' &&
                typeof weights.age === 'number' &&
                typeof weights.income === 'number') {
              
              filterStore.setDemographicScoring({
                weights: {
                  ethnicity: weights.ethnicity,
                  gender: weights.gender,
                  age: weights.age,
                  income: weights.income
                },
                thresholdBonuses: Array.isArray(demoScoring.thresholdBonuses) ? demoScoring.thresholdBonuses as Array<{ condition: string; bonus: number; description: string }> : [],
                penalties: Array.isArray(demoScoring.penalties) ? demoScoring.penalties as Array<{ condition: string; penalty: number; description: string }> : [],
                reasoning: typeof demoScoring.reasoning === 'string' ? demoScoring.reasoning : ''
              });
              
              console.log('[✅ Gemini Store] Successfully applied demographic scoring!');
            } else {
              console.warn('[⚠️ Gemini Store] Invalid demographic scoring weights structure:', weights);
            }
          } else {
            console.warn('[⚠️ Gemini Store] Invalid demographic scoring structure:', demoScoring);
          }
        }
        
        // Apply all other filter updates in batch
        if (Object.keys(updates).length > 0) {
          filterStore.setFilters(updates);
          console.log('[✅ Gemini Store] Applied filter updates:', updates);
        }
        
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