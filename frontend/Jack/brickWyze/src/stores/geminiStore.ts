import { create } from 'zustand';

/**
 * Defines the shape of the current filter state that can be passed 
 * to the Gemini API to provide context for the user's query.
 * All properties are optional.
 */
interface FilterContext {
  weights?: { id: string, value: number }[];
  rentRange?: [number, number];
  selectedEthnicities?: string[];
  selectedGenders?: string[];
  ageRange?: [number, number];
  incomeRange?: [number, number];
}

/**
 * Defines the state and actions for interacting with the Gemini AI.
 */
interface GeminiStore {
  /** The last text response received from the Gemini API. */
  lastMessage: string;
  /**
   * Sends a message to the Gemini API, optionally with filter context.
   * @param message The user's text query.
   * @param context (Optional) The current state of the filters in the UI.
   * @returns A promise that resolves with the AI's text reply.
   */
  sendToGemini: (message: string, context?: FilterContext) => Promise<string>;
}

export const useGeminiStore = create<GeminiStore>((set) => ({
  lastMessage: '',
  
  /**
   * The core function to interact with the backend Gemini API route.
   */
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        console.error('[❌ Gemini API Error]', response.status, errorData);
        // Provide a user-friendly error message
        return `Sorry, Bricky encountered an error (Code: ${response.status}). Please try again.`;
      }

      const data = await response.json();
      const reply = data.reply ?? 'No reply received.'; // Gracefully handle missing reply

      console.log('[📥 Gemini API Response]', data);
      
      set({ lastMessage: reply });
      return reply;

    } catch (err) {
      // Handle network errors or other exceptions during the fetch
      console.error('[❌ Gemini Fetch Failed]', err);
      return 'Sorry, there was a problem connecting to Bricky. Please check your network and try again.';
    }
  },
}));