// src/stores/geminiStore.ts

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
