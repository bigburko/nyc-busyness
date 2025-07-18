// src/stores/geminiStore.ts - Enhanced with demographic scoring integration

import { create } from 'zustand';
import { useFilterStore } from './filterStore'; // Import to access filter store

/**
 * Defines the shape of the current filter state that can be passed 
 * to the Gemini API to provide context for the user's query.
 * All properties are optional.
 */
interface FilterContext {
  weights?: { id: string; value: number }[];
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
        const parsedReply = JSON.parse(reply);
        console.log('[🔍 Gemini Store] Parsed Bricky response:', parsedReply);
        
        // Apply any filter updates that Bricky made
        const filterStore = useFilterStore.getState();
        const updates: Record<string, any> = {};
        
        // Apply main weight changes
        if (parsedReply.weights && Array.isArray(parsedReply.weights)) {
          updates.weights = parsedReply.weights;
          console.log('[⚖️ Gemini Store] Applying weight changes:', parsedReply.weights);
        }
        
        // Apply demographic filter changes
        if (parsedReply.selectedEthnicities) {
          updates.selectedEthnicities = parsedReply.selectedEthnicities;
          console.log('[🌍 Gemini Store] Applying ethnicity changes:', parsedReply.selectedEthnicities);
        }
        
        if (parsedReply.selectedGenders) {
          updates.selectedGenders = parsedReply.selectedGenders;
          console.log('[👥 Gemini Store] Applying gender changes:', parsedReply.selectedGenders);
        }
        
        if (parsedReply.ageRange) {
          updates.ageRange = parsedReply.ageRange;
          console.log('[📅 Gemini Store] Applying age range changes:', parsedReply.ageRange);
        }
        
        if (parsedReply.incomeRange) {
          updates.incomeRange = parsedReply.incomeRange;
          console.log('[💰 Gemini Store] Applying income range changes:', parsedReply.incomeRange);
        }
        
        if (parsedReply.rentRange) {
          updates.rentRange = parsedReply.rentRange;
          console.log('[🏠 Gemini Store] Applying rent range changes:', parsedReply.rentRange);
        }
        
        // 🎯 CRITICAL: Apply demographic scoring changes
        if (parsedReply.demographicScoring) {
          console.log('[🧬 Gemini Store] Applying demographic scoring:', parsedReply.demographicScoring);
          
          // Validate demographic scoring structure
          const demoScoring = parsedReply.demographicScoring;
          if (demoScoring.weights && 
              typeof demoScoring.weights.ethnicity === 'number' &&
              typeof demoScoring.weights.gender === 'number' &&
              typeof demoScoring.weights.age === 'number' &&
              typeof demoScoring.weights.income === 'number') {
            
            filterStore.setDemographicScoring({
              weights: demoScoring.weights,
              thresholdBonuses: demoScoring.thresholdBonuses || [],
              penalties: demoScoring.penalties || [],
              reasoning: demoScoring.reasoning || ''
            });
            
            console.log('[✅ Gemini Store] Successfully applied demographic scoring!');
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
        if (parsedReply.intent === 'reset') {
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